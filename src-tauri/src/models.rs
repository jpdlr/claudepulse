use serde::{Deserialize, Serialize};

/// Token usage breakdown from a single API response
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct TokenUsage {
    #[serde(default)]
    pub input_tokens: u64,
    #[serde(default)]
    pub cache_creation_input_tokens: u64,
    #[serde(default)]
    pub cache_read_input_tokens: u64,
    #[serde(default)]
    pub output_tokens: u64,
}

/// Aggregated usage for a specific model
#[derive(Debug, Clone, Serialize, Default)]
pub struct ModelUsage {
    pub model: String,
    pub display_name: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_read_tokens: u64,
    pub cache_creation_tokens: u64,
    pub message_count: u64,
}

/// 5-hour rolling window usage
#[derive(Debug, Clone, Serialize)]
pub struct WindowUsage {
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    pub total_cache_read_tokens: u64,
    pub total_cache_creation_tokens: u64,
    pub message_count: u64,
    pub session_count: u64,
    pub window_start: String,
    pub window_end: String,
}

/// Single day usage
#[derive(Debug, Clone, Serialize)]
pub struct DailyUsage {
    pub date: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub message_count: u64,
}

/// Weekly usage with daily breakdown
#[derive(Debug, Clone, Serialize)]
pub struct WeeklyUsage {
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    pub total_cache_read_tokens: u64,
    pub total_cache_creation_tokens: u64,
    pub message_count: u64,
    pub session_count: u64,
    pub daily_breakdown: Vec<DailyUsage>,
}

/// Cost for a single model
#[derive(Debug, Clone, Serialize)]
pub struct ModelCost {
    pub model: String,
    pub display_name: String,
    pub cost_usd: f64,
}

/// Cost estimates
#[derive(Debug, Clone, Serialize)]
pub struct CostEstimate {
    pub window_cost_usd: f64,
    pub weekly_cost_usd: f64,
    pub by_model: Vec<ModelCost>,
}

/// Complete usage snapshot returned to frontend
#[derive(Debug, Clone, Serialize)]
pub struct UsageSnapshot {
    pub window: WindowUsage,
    pub weekly: WeeklyUsage,
    pub models: Vec<ModelUsage>,
    pub cost_estimate: CostEstimate,
    pub last_updated: String,
}

/// User-configurable settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub refresh_interval_secs: u64,
    pub window_hours: f64,
    pub usage_limit_tokens: Option<u64>,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            refresh_interval_secs: 180,
            window_hours: 5.0,
            usage_limit_tokens: None,
            theme: "system".to_string(),
        }
    }
}
