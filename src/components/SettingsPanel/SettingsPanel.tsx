import { useState } from 'react';
import type { AppSettings } from '../../types';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => Promise<void>;
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  onUpdate,
  onClose,
}: SettingsPanelProps) {
  const [local, setLocal] = useState(settings);

  const handleChange = (patch: Partial<AppSettings>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onUpdate(next);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Settings</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Refresh Interval</label>
          <select
            className={styles.select}
            value={local.refresh_interval_secs}
            onChange={(e) =>
              handleChange({ refresh_interval_secs: Number(e.target.value) })
            }
          >
            <option value={60}>1 minute</option>
            <option value={120}>2 minutes</option>
            <option value={180}>3 minutes</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Window Duration (hours)</label>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={24}
            step={0.5}
            value={local.window_hours}
            onChange={(e) =>
              handleChange({ window_hours: Number(e.target.value) })
            }
          />
          <span className={styles.fieldHint}>
            Claude Code uses a 5-hour rolling rate limit window
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>
            Token Limit (for usage meter)
          </label>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={100000}
            placeholder="None"
            value={local.usage_limit_tokens ?? ''}
            onChange={(e) =>
              handleChange({
                usage_limit_tokens: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
          />
          <span className={styles.fieldHint}>
            Set a token budget to show a progress meter on the 5-hour window
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Theme</label>
          <select
            className={styles.select}
            value={local.theme}
            onChange={(e) =>
              handleChange({
                theme: e.target.value as AppSettings['theme'],
              })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </>
  );
}
