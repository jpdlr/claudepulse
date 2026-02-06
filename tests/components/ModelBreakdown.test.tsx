import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelBreakdown } from '../../src/components/ModelBreakdown';
import type { ModelUsage } from '../../src/types';

const mockModels: ModelUsage[] = [
  {
    model: 'claude-sonnet-4-5-20250929',
    display_name: 'Sonnet 4.5',
    input_tokens: 50_000,
    output_tokens: 200_000,
    cache_read_tokens: 500_000,
    cache_creation_tokens: 10_000,
    message_count: 30,
  },
  {
    model: 'claude-opus-4-5-20251101',
    display_name: 'Opus 4.5',
    input_tokens: 10_000,
    output_tokens: 50_000,
    cache_read_tokens: 100_000,
    cache_creation_tokens: 5_000,
    message_count: 8,
  },
];

describe('ModelBreakdown', () => {
  it('renders model names', () => {
    render(<ModelBreakdown models={mockModels} />);
    expect(screen.getByText('Sonnet 4.5')).toBeInTheDocument();
    expect(screen.getByText('Opus 4.5')).toBeInTheDocument();
  });

  it('renders token counts', () => {
    render(<ModelBreakdown models={mockModels} />);
    expect(screen.getByText('200.0K')).toBeInTheDocument();
    expect(screen.getByText('50.0K')).toBeInTheDocument();
  });

  it('shows empty state when no models', () => {
    render(<ModelBreakdown models={[]} />);
    expect(screen.getByText('No model data in this window')).toBeInTheDocument();
  });

  it('renders correct number of model rows', () => {
    render(<ModelBreakdown models={mockModels} />);
    const rows = screen.getAllByText(/\d+\.\d+K/);
    expect(rows.length).toBe(2);
  });
});
