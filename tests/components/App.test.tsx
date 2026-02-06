import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import App from '../../src/App';
import type { UsageSnapshot, AppSettings } from '../../src/types';

const mockSnapshot: UsageSnapshot = {
  window: {
    total_input_tokens: 5_000,
    total_output_tokens: 150_000,
    total_cache_read_tokens: 2_000_000,
    total_cache_creation_tokens: 50_000,
    message_count: 42,
    session_count: 3,
    window_start: '2026-02-06T10:00:00Z',
    window_end: '2026-02-06T15:00:00Z',
  },
  weekly: {
    total_input_tokens: 20_000,
    total_output_tokens: 800_000,
    total_cache_read_tokens: 10_000_000,
    total_cache_creation_tokens: 200_000,
    message_count: 250,
    session_count: 12,
    daily_breakdown: [
      { date: '2026-02-03', input_tokens: 3000, output_tokens: 120_000, message_count: 40 },
      { date: '2026-02-04', input_tokens: 5000, output_tokens: 200_000, message_count: 60 },
      { date: '2026-02-05', input_tokens: 4000, output_tokens: 180_000, message_count: 50 },
      { date: '2026-02-06', input_tokens: 8000, output_tokens: 300_000, message_count: 100 },
    ],
  },
  models: [
    {
      model: 'claude-sonnet-4-5-20250929',
      display_name: 'Sonnet 4.5',
      input_tokens: 4_000,
      output_tokens: 120_000,
      cache_read_tokens: 1_500_000,
      cache_creation_tokens: 40_000,
      message_count: 35,
    },
    {
      model: 'claude-opus-4-5-20251101',
      display_name: 'Opus 4.5',
      input_tokens: 1_000,
      output_tokens: 30_000,
      cache_read_tokens: 500_000,
      cache_creation_tokens: 10_000,
      message_count: 7,
    },
  ],
  cost_estimate: {
    window_cost_usd: 2.35,
    weekly_cost_usd: 12.50,
    by_model: [
      { model: 'claude-sonnet-4-5-20250929', display_name: 'Sonnet 4.5', cost_usd: 8.20 },
      { model: 'claude-opus-4-5-20251101', display_name: 'Opus 4.5', cost_usd: 4.30 },
    ],
  },
  last_updated: new Date().toISOString(),
};

const mockSettings: AppSettings = {
  refresh_interval_secs: 180,
  window_hours: 5.0,
  usage_limit_tokens: null,
  theme: 'light',
};

describe('App', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === 'get_usage_snapshot') return mockSnapshot;
      if (cmd === 'get_settings') return mockSettings;
      return null;
    });
  });

  it('renders all usage cards', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('ClaudePulse')).toBeInTheDocument();
    });

    // Labels appear in both section cards and CostEstimate
    expect(screen.getAllByText('5-Hour Window').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('This Week').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Model Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Est. Cost')).toBeInTheDocument();
  });

  it('renders model names', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Sonnet 4.5')).toBeInTheDocument();
    });

    expect(screen.getByText('Opus 4.5')).toBeInTheDocument();
  });

  it('renders cost estimates', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('$2.35')).toBeInTheDocument();
    });

    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });
});
