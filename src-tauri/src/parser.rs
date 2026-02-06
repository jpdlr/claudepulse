use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use chrono::{DateTime, Duration, Utc};

use crate::models::TokenUsage;

/// A single parsed usage entry from a JSONL file
pub struct UsageEntry {
    pub model: String,
    pub usage: TokenUsage,
    pub timestamp: DateTime<Utc>,
    pub session_id: String,
}

/// Parse a single JSONL file, returning deduplicated usage entries.
/// Entries are deduplicated by `requestId` since the same API response
/// produces multiple JSONL lines (thinking, text, tool_use content blocks)
/// with identical usage data.
pub fn parse_session_file(path: &Path) -> Vec<UsageEntry> {
    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return vec![],
    };
    let reader = BufReader::new(file);
    let mut seen_requests: HashSet<String> = HashSet::new();
    let mut entries = Vec::new();

    for line in reader.lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => continue,
        };
        if line.trim().is_empty() {
            continue;
        }

        let raw: serde_json::Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(_) => continue,
        };

        // Only process assistant entries with usage data
        let entry_type = raw.get("type").and_then(|v| v.as_str());
        if entry_type != Some("assistant") {
            continue;
        }

        let message = match raw.get("message") {
            Some(m) => m,
            None => continue,
        };

        let usage_val = match message.get("usage") {
            Some(u) => u,
            None => continue,
        };

        let model = match message.get("model").and_then(|v| v.as_str()) {
            Some(m) => m.to_string(),
            None => continue,
        };

        // Deduplicate by requestId
        let request_id = raw
            .get("requestId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        if !request_id.is_empty() && seen_requests.contains(&request_id) {
            continue;
        }
        if !request_id.is_empty() {
            seen_requests.insert(request_id);
        }

        let usage: TokenUsage = match serde_json::from_value(usage_val.clone()) {
            Ok(u) => u,
            Err(_) => continue,
        };

        let timestamp_str = match raw.get("timestamp").and_then(|v| v.as_str()) {
            Some(t) => t,
            None => continue,
        };
        let timestamp = match timestamp_str.parse::<DateTime<Utc>>() {
            Ok(t) => t,
            Err(_) => continue,
        };

        let session_id = raw
            .get("sessionId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        entries.push(UsageEntry {
            model,
            usage,
            timestamp,
            session_id,
        });
    }

    entries
}

/// Discover all JSONL session files, optionally filtering by modification time.
/// `min_mtime` allows skipping files that haven't been modified since a given time,
/// which is critical for performance with ~300MB of session data.
pub fn discover_session_files(min_mtime: Option<SystemTime>) -> Vec<PathBuf> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return vec![],
    };
    let projects_dir = home.join(".claude").join("projects");

    if !projects_dir.exists() {
        return vec![];
    }

    let pattern = projects_dir
        .join("*")
        .join("*.jsonl")
        .to_string_lossy()
        .to_string();

    glob::glob(&pattern)
        .unwrap_or_else(|_| glob::glob("").unwrap())
        .filter_map(|entry| entry.ok())
        .filter(|path| {
            if let Some(min) = min_mtime {
                fs::metadata(path)
                    .and_then(|m| m.modified())
                    .map(|mtime| mtime >= min)
                    .unwrap_or(false)
            } else {
                true
            }
        })
        .collect()
}

/// Collect all usage entries from session files modified within the given window.
pub fn collect_entries(window_hours: f64) -> Vec<UsageEntry> {
    let min_mtime = SystemTime::now()
        .checked_sub(std::time::Duration::from_secs(
            (window_hours * 3600.0) as u64,
        ))
        .unwrap_or(SystemTime::UNIX_EPOCH);

    // For weekly view we need up to 7 days of data
    let weekly_mtime = SystemTime::now()
        .checked_sub(std::time::Duration::from_secs(7 * 24 * 3600))
        .unwrap_or(SystemTime::UNIX_EPOCH);

    // Use the wider window so we have data for both views
    let effective_mtime = std::cmp::min(min_mtime, weekly_mtime);

    let files = discover_session_files(Some(effective_mtime));
    let mut all_entries = Vec::new();

    for file in files {
        let file_entries = parse_session_file(&file);
        // Only keep entries that fall within the weekly window at most
        let weekly_cutoff = Utc::now() - Duration::days(7);
        for entry in file_entries {
            if entry.timestamp >= weekly_cutoff {
                all_entries.push(entry);
            }
        }
    }

    all_entries.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
    all_entries
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn make_entry(request_id: &str, model: &str, output_tokens: u64) -> String {
        format!(
            r#"{{"type":"assistant","requestId":"{}","timestamp":"2026-02-06T10:00:00Z","sessionId":"sess-1","message":{{"model":"{}","role":"assistant","usage":{{"input_tokens":10,"output_tokens":{},"cache_read_input_tokens":0,"cache_creation_input_tokens":0}}}}}}"#,
            request_id, model, output_tokens
        )
    }

    #[test]
    fn test_deduplicates_by_request_id() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, "{}", make_entry("req_001", "claude-sonnet-4-5-20250929", 100)).unwrap();
        writeln!(file, "{}", make_entry("req_001", "claude-sonnet-4-5-20250929", 100)).unwrap();
        writeln!(file, "{}", make_entry("req_002", "claude-sonnet-4-5-20250929", 200)).unwrap();

        let entries = parse_session_file(file.path());
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].usage.output_tokens, 100);
        assert_eq!(entries[1].usage.output_tokens, 200);
    }

    #[test]
    fn test_skips_non_assistant_entries() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, r#"{{"type":"user","timestamp":"2026-02-06T10:00:00Z"}}"#).unwrap();
        writeln!(file, r#"{{"type":"progress","timestamp":"2026-02-06T10:00:00Z"}}"#).unwrap();
        writeln!(file, r#"{{"type":"tool_use","timestamp":"2026-02-06T10:00:00Z"}}"#).unwrap();

        let entries = parse_session_file(file.path());
        assert_eq!(entries.len(), 0);
    }

    #[test]
    fn test_skips_malformed_lines() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(file, "not json at all").unwrap();
        writeln!(file, "{{broken json").unwrap();
        writeln!(file, "").unwrap();
        writeln!(file, "{}", make_entry("req_001", "claude-sonnet-4-5-20250929", 50)).unwrap();

        let entries = parse_session_file(file.path());
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].usage.output_tokens, 50);
    }

    #[test]
    fn test_skips_entries_without_usage() {
        let mut file = NamedTempFile::new().unwrap();
        writeln!(
            file,
            r#"{{"type":"assistant","requestId":"req_001","timestamp":"2026-02-06T10:00:00Z","sessionId":"s1","message":{{"model":"claude-sonnet-4-5-20250929","role":"assistant"}}}}"#
        )
        .unwrap();

        let entries = parse_session_file(file.path());
        assert_eq!(entries.len(), 0);
    }
}
