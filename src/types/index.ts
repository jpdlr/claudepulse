export interface ModelUsage {
  model: string;
  display_name: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  message_count: number;
}

export interface WindowUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_read_tokens: number;
  total_cache_creation_tokens: number;
  message_count: number;
  session_count: number;
  window_start: string;
  window_end: string;
}

export interface DailyUsage {
  date: string;
  input_tokens: number;
  output_tokens: number;
  message_count: number;
}

export interface WeeklyUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_read_tokens: number;
  total_cache_creation_tokens: number;
  message_count: number;
  session_count: number;
  daily_breakdown: DailyUsage[];
}

export interface ModelCost {
  model: string;
  display_name: string;
  cost_usd: number;
}

export interface CostEstimate {
  window_cost_usd: number;
  weekly_cost_usd: number;
  by_model: ModelCost[];
}

export interface UsageSnapshot {
  window: WindowUsage;
  weekly: WeeklyUsage;
  models: ModelUsage[];
  cost_estimate: CostEstimate;
  last_updated: string;
}

export interface AppSettings {
  refresh_interval_secs: number;
  window_hours: number;
  usage_limit_tokens: number | null;
  theme: 'light' | 'dark' | 'system';
}

export type Theme = 'light' | 'dark';
