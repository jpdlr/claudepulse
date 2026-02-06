import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { UsageSnapshot } from '../types';

export function useUsageData(refreshIntervalSecs: number) {
  const [data, setData] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await invoke<UsageSnapshot>('get_usage_snapshot');
      setData(snapshot);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, refreshIntervalSecs * 1000);

    const unlisten = listen('usage-data-changed', () => {
      refresh();
    });

    return () => {
      clearInterval(interval);
      unlisten.then((fn) => fn());
    };
  }, [refresh, refreshIntervalSecs]);

  return { data, loading, error, refresh };
}
