import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  refresh_interval_secs: 180,
  window_hours: 5.0,
  usage_limit_tokens: null,
  theme: 'system',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    invoke<AppSettings>('get_settings')
      .then(setSettings)
      .catch(() => {});
  }, []);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      await invoke('update_settings', { newSettings });
      setSettings(newSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, []);

  return { settings, updateSettings };
}
