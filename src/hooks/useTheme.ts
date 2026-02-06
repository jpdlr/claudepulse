import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';

export function useTheme(preference: 'light' | 'dark' | 'system') {
  const resolveTheme = useCallback((): Theme => {
    if (preference !== 'system') return preference;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }, [preference]);

  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    const resolved = resolveTheme();
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    if (preference === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const t: Theme = mql.matches ? 'dark' : 'light';
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
      };
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [preference, resolveTheme]);

  return theme;
}
