use std::collections::{HashMap, HashSet};

use chrono::{DateTime, Datelike, Duration, Utc};

use crate::models::*;
use crate::parser::{collect_entries, UsageEntry};

/// Pricing per million tokens (USD)
/// (model_prefix, input, output, cache_read, cache_create)
const PRICING: &[(&str, f64, f64, f64, f64)] = &[
    ("claude-opus-4", 5.00, 25.00, 0.50, 6.25),
    ("claude-sonnet-4", 3.00, 15.00, 0.30, 3.75),
    ("claude-haiku-4", 1.00, 5.00, 0.10, 1.25),
    ("claude-haiku-3", 0.25, 1.25, 0.03, 0.30),
];

pub fn model_display_name(model: &str) -> String {
    if model.contains("opus-4-6") {
        "Opus 4.6".into()
    } else if model.contains("opus-4-5") || model.contains("opus-4") {
        "Opus 4.5".into()
    } else if model.contains("sonnet-4-5") || model.contains("sonnet-4") {
        "Sonnet 4.5".into()
    } else if model.contains("haiku-4") {
        "Haiku 4.5".into()
    } else if model.contains("haiku-3") {
        "Haiku 3.5".into()
    } else {
        model.to_string()
    }
}

fn get_pricing(model: &str) -> (f64, f64, f64, f64) {
    for (prefix, input, output, cache_read, cache_create) in PRICING {
        if model.starts_with(prefix) {
            return (*input, *output, *cache_read, *cache_create);
        }
    }
    // Default to Sonnet pricing
    (3.00, 15.00, 0.30, 3.75)
}

fn calculate_cost(usage: &ModelUsage) -> f64 {
    let (input_rate, output_rate, cache_read_rate, cache_create_rate) = get_pricing(&usage.model);
    let mtok = 1_000_000.0;
    (usage.input_tokens as f64 / mtok) * input_rate
        + (usage.output_tokens as f64 / mtok) * output_rate
        + (usage.cache_read_tokens as f64 / mtok) * cache_read_rate
        + (usage.cache_creation_tokens as f64 / mtok) * cache_create_rate
}

struct AggregateResult {
    models: HashMap<String, ModelUsage>,
    message_count: u64,
    sessions: HashSet<String>,
}

fn aggregate_entries(
    entries: &[UsageEntry],
    start: DateTime<Utc>,
    end: DateTime<Utc>,
) -> AggregateResult {
    let mut models: HashMap<String, ModelUsage> = HashMap::new();
    let mut message_count = 0u64;
    let mut sessions: HashSet<String> = HashSet::new();

    for entry in entries {
        if entry.timestamp < start || entry.timestamp > end {
            continue;
        }
        message_count += 1;
        if !entry.session_id.is_empty() {
            sessions.insert(entry.session_id.clone());
        }

        let model_usage = models.entry(entry.model.clone()).or_insert_with(|| ModelUsage {
            model: entry.model.clone(),
            display_name: model_display_name(&entry.model),
            ..Default::default()
        });
        model_usage.input_tokens += entry.usage.input_tokens;
        model_usage.output_tokens += entry.usage.output_tokens;
        model_usage.cache_read_tokens += entry.usage.cache_read_input_tokens;
        model_usage.cache_creation_tokens += entry.usage.cache_creation_input_tokens;
        model_usage.message_count += 1;
    }

    AggregateResult {
        models,
        message_count,
        sessions,
    }
}

/// Build the complete usage snapshot
pub fn build_snapshot(window_hours: f64) -> UsageSnapshot {
    let entries = collect_entries(window_hours);
    let now = Utc::now();

    // --- Rolling window ---
    let window_start = now - Duration::seconds((window_hours * 3600.0) as i64);
    let window_agg = aggregate_entries(&entries, window_start, now);

    let window = WindowUsage {
        total_input_tokens: window_agg.models.values().map(|m| m.input_tokens).sum(),
        total_output_tokens: window_agg.models.values().map(|m| m.output_tokens).sum(),
        total_cache_read_tokens: window_agg.models.values().map(|m| m.cache_read_tokens).sum(),
        total_cache_creation_tokens: window_agg
            .models
            .values()
            .map(|m| m.cache_creation_tokens)
            .sum(),
        message_count: window_agg.message_count,
        session_count: window_agg.sessions.len() as u64,
        window_start: window_start.to_rfc3339(),
        window_end: now.to_rfc3339(),
    };

    // --- Weekly usage (Monday to now) ---
    let today = now.date_naive();
    let days_since_monday = today.weekday().num_days_from_monday();
    let week_start_date = today - chrono::Duration::days(days_since_monday as i64);
    let week_start = week_start_date.and_hms_opt(0, 0, 0).unwrap().and_utc();

    let weekly_agg = aggregate_entries(&entries, week_start, now);

    // Daily breakdown
    let mut daily_breakdown = Vec::new();
    for day_offset in 0..=days_since_monday {
        let day = week_start_date + chrono::Duration::days(day_offset as i64);
        let day_start = day.and_hms_opt(0, 0, 0).unwrap().and_utc();
        let day_end = day.and_hms_opt(23, 59, 59).unwrap().and_utc();
        let day_agg = aggregate_entries(&entries, day_start, day_end);
        daily_breakdown.push(DailyUsage {
            date: day.to_string(),
            input_tokens: day_agg.models.values().map(|m| m.input_tokens).sum(),
            output_tokens: day_agg.models.values().map(|m| m.output_tokens).sum(),
            message_count: day_agg.message_count,
        });
    }

    let weekly = WeeklyUsage {
        total_input_tokens: weekly_agg.models.values().map(|m| m.input_tokens).sum(),
        total_output_tokens: weekly_agg.models.values().map(|m| m.output_tokens).sum(),
        total_cache_read_tokens: weekly_agg.models.values().map(|m| m.cache_read_tokens).sum(),
        total_cache_creation_tokens: weekly_agg
            .models
            .values()
            .map(|m| m.cache_creation_tokens)
            .sum(),
        message_count: weekly_agg.message_count,
        session_count: weekly_agg.sessions.len() as u64,
        daily_breakdown,
    };

    // --- Model breakdown (from window) ---
    let mut models: Vec<ModelUsage> = window_agg.models.into_values().collect();
    models.sort_by(|a, b| b.output_tokens.cmp(&a.output_tokens));

    // --- Cost estimate ---
    let window_cost: f64 = models.iter().map(|m| calculate_cost(m)).sum();
    let weekly_model_costs: Vec<ModelCost> = weekly_agg
        .models
        .values()
        .map(|m| ModelCost {
            model: m.model.clone(),
            display_name: m.display_name.clone(),
            cost_usd: calculate_cost(m),
        })
        .collect();
    let weekly_cost: f64 = weekly_model_costs.iter().map(|c| c.cost_usd).sum();

    let cost_estimate = CostEstimate {
        window_cost_usd: window_cost,
        weekly_cost_usd: weekly_cost,
        by_model: weekly_model_costs,
    };

    UsageSnapshot {
        window,
        weekly,
        models,
        cost_estimate,
        last_updated: now.to_rfc3339(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_display_name() {
        assert_eq!(
            model_display_name("claude-opus-4-6"),
            "Opus 4.6"
        );
        assert_eq!(
            model_display_name("claude-opus-4-5-20251101"),
            "Opus 4.5"
        );
        assert_eq!(
            model_display_name("claude-sonnet-4-5-20250929"),
            "Sonnet 4.5"
        );
        assert_eq!(
            model_display_name("claude-haiku-4-5-20251001"),
            "Haiku 4.5"
        );
        assert_eq!(
            model_display_name("claude-haiku-3-5-sonnet"),
            "Haiku 3.5"
        );
        assert_eq!(
            model_display_name("unknown-model"),
            "unknown-model"
        );
    }

    #[test]
    fn test_get_pricing() {
        let (i, o, cr, cc) = get_pricing("claude-opus-4-5-20251101");
        assert_eq!(i, 5.00);
        assert_eq!(o, 25.00);
        assert_eq!(cr, 0.50);
        assert_eq!(cc, 6.25);

        let (i, o, _, _) = get_pricing("claude-sonnet-4-5-20250929");
        assert_eq!(i, 3.00);
        assert_eq!(o, 15.00);

        // Unknown model defaults to Sonnet pricing
        let (i, o, _, _) = get_pricing("unknown-model");
        assert_eq!(i, 3.00);
        assert_eq!(o, 15.00);
    }

    #[test]
    fn test_calculate_cost() {
        let usage = ModelUsage {
            model: "claude-sonnet-4-5-20250929".into(),
            display_name: "Sonnet 4.5".into(),
            input_tokens: 1_000_000,
            output_tokens: 1_000_000,
            cache_read_tokens: 0,
            cache_creation_tokens: 0,
            message_count: 10,
        };
        let cost = calculate_cost(&usage);
        // 1M input * $3/MTok + 1M output * $15/MTok = $18.00
        assert!((cost - 18.0).abs() < 0.001);
    }

    #[test]
    fn test_aggregate_entries_filters_by_time() {
        let now = Utc::now();
        let entries = vec![
            UsageEntry {
                model: "claude-sonnet-4-5-20250929".into(),
                usage: crate::models::TokenUsage {
                    input_tokens: 100,
                    output_tokens: 200,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                },
                timestamp: now - Duration::hours(1),
                session_id: "s1".into(),
            },
            UsageEntry {
                model: "claude-sonnet-4-5-20250929".into(),
                usage: crate::models::TokenUsage {
                    input_tokens: 300,
                    output_tokens: 400,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                },
                timestamp: now - Duration::hours(10), // Outside 5-hour window
                session_id: "s2".into(),
            },
        ];

        let result = aggregate_entries(&entries, now - Duration::hours(5), now);
        assert_eq!(result.message_count, 1);
        let model = result.models.get("claude-sonnet-4-5-20250929").unwrap();
        assert_eq!(model.input_tokens, 100);
        assert_eq!(model.output_tokens, 200);
    }
}
