import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WindowCard } from '../../src/components/WindowCard';
import type { WindowUsage } from '../../src/types';

const mockUsage: WindowUsage = {
  total_input_tokens: 5000,
  total_output_tokens: 150_000,
  total_cache_read_tokens: 2_000_000,
  total_cache_creation_tokens: 50_000,
  message_count: 42,
  session_count: 3,
  window_start: '2026-02-06T10:00:00Z',
  window_end: '2026-02-06T15:00:00Z',
};

describe('WindowCard', () => {
  it('renders message count', () => {
    render(<WindowCard usage={mockUsage} limit={null} />);
    expect(screen.getByText('42 msgs')).toBeInTheDocument();
  });

  it('renders formatted token counts', () => {
    render(<WindowCard usage={mockUsage} limit={null} />);
    expect(screen.getByText('150.0K')).toBeInTheDocument();
    expect(screen.getByText('5.0K')).toBeInTheDocument();
    expect(screen.getByText('2.0M')).toBeInTheDocument();
  });

  it('renders session count', () => {
    render(<WindowCard usage={mockUsage} limit={null} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows usage meter when limit is set', () => {
    render(<WindowCard usage={mockUsage} limit={5_000_000} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('hides usage meter when no limit', () => {
    render(<WindowCard usage={mockUsage} limit={null} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
