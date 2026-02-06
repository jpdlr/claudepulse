import { describe, it, expect } from 'vitest';
import { formatTokenCount, formatCurrency, formatRelativeTime } from '../../src/lib/format';

describe('formatTokenCount', () => {
  it('formats millions', () => {
    expect(formatTokenCount(1_500_000)).toBe('1.5M');
    expect(formatTokenCount(2_000_000)).toBe('2.0M');
  });

  it('formats thousands', () => {
    expect(formatTokenCount(1_234)).toBe('1.2K');
    expect(formatTokenCount(150_000)).toBe('150.0K');
    expect(formatTokenCount(999)).toBe('999');
  });

  it('formats small numbers directly', () => {
    expect(formatTokenCount(0)).toBe('0');
    expect(formatTokenCount(42)).toBe('42');
  });

  it('handles boundary at 1000', () => {
    expect(formatTokenCount(1000)).toBe('1.0K');
    expect(formatTokenCount(999)).toBe('999');
  });

  it('handles boundary at 1M', () => {
    expect(formatTokenCount(1_000_000)).toBe('1.0M');
    expect(formatTokenCount(999_999)).toBe('1000.0K');
  });
});

describe('formatCurrency', () => {
  it('formats standard amounts', () => {
    expect(formatCurrency(4.52)).toBe('$4.52');
    expect(formatCurrency(0.15)).toBe('$0.15');
    expect(formatCurrency(18.0)).toBe('$18.00');
  });

  it('shows <$0.01 for tiny amounts', () => {
    expect(formatCurrency(0.005)).toBe('<$0.01');
    expect(formatCurrency(0.001)).toBe('<$0.01');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatRelativeTime', () => {
  it('shows "just now" for very recent times', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('shows minutes for recent times', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('shows hours for longer times', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('shows days for very old times', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});
