import { useState } from 'react';
import { formatRelativeTime } from '../../lib/format';
import styles from './UsageHeader.module.css';

interface UsageHeaderProps {
  lastUpdated: string;
  onRefresh: () => Promise<void>;
  onSettingsClick: () => void;
}

export function UsageHeader({
  lastUpdated,
  onRefresh,
  onSettingsClick,
}: UsageHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.title}>ClaudePulse</span>
        <span className={styles.updated}>{formatRelativeTime(lastUpdated)}</span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={handleRefresh}
          title="Refresh"
          aria-label="Refresh usage data"
        >
          <svg
            className={refreshing ? styles.spinning : undefined}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2v4h-4" />
            <path d="M2 14v-4h4" />
            <path d="M13.5 6A6 6 0 0 0 3.2 3.2L2 6" />
            <path d="M2.5 10a6 6 0 0 0 10.3 2.8L14 10" />
          </svg>
        </button>
        <button
          className={styles.iconBtn}
          onClick={onSettingsClick}
          title="Settings"
          aria-label="Open settings"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="2.5" />
            <path d="M13.3 10a1.2 1.2 0 0 0 .2 1.3l.1.1a1.5 1.5 0 1 1-2.1 2.1l-.1-.1a1.2 1.2 0 0 0-1.3-.2 1.2 1.2 0 0 0-.7 1.1v.2a1.5 1.5 0 0 1-3 0v-.1a1.2 1.2 0 0 0-.8-1.1 1.2 1.2 0 0 0-1.3.2l-.1.1a1.5 1.5 0 1 1-2.1-2.1l.1-.1a1.2 1.2 0 0 0 .2-1.3 1.2 1.2 0 0 0-1.1-.7h-.2a1.5 1.5 0 0 1 0-3h.1a1.2 1.2 0 0 0 1.1-.8 1.2 1.2 0 0 0-.2-1.3l-.1-.1a1.5 1.5 0 1 1 2.1-2.1l.1.1a1.2 1.2 0 0 0 1.3.2h.1a1.2 1.2 0 0 0 .7-1.1v-.2a1.5 1.5 0 0 1 3 0v.1a1.2 1.2 0 0 0 .7 1.1 1.2 1.2 0 0 0 1.3-.2l.1-.1a1.5 1.5 0 1 1 2.1 2.1l-.1.1a1.2 1.2 0 0 0-.2 1.3v.1a1.2 1.2 0 0 0 1.1.7h.2a1.5 1.5 0 0 1 0 3h-.1a1.2 1.2 0 0 0-1.1.7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
