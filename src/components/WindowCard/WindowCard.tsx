import { useMemo } from 'react';
import { UsageMeter } from '../UsageMeter';
import type { WindowUsage } from '../../types';
import { formatTokenCount } from '../../lib/format';
import styles from './WindowCard.module.css';

interface WindowCardProps {
  usage: WindowUsage;
  limit: number | null;
}

export function WindowCard({ usage, limit }: WindowCardProps) {
  const totalTokens = useMemo(
    () =>
      usage.total_input_tokens +
      usage.total_output_tokens +
      usage.total_cache_read_tokens +
      usage.total_cache_creation_tokens,
    [usage],
  );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>5-Hour Window</span>
        <span className={styles.badge}>{usage.message_count} msgs</span>
      </div>

      {limit != null && <UsageMeter current={totalTokens} limit={limit} />}

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Output</span>
          <span className={styles.metricValue}>
            {formatTokenCount(usage.total_output_tokens)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Input</span>
          <span className={styles.metricValue}>
            {formatTokenCount(usage.total_input_tokens)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Cache Read</span>
          <span className={styles.metricValue}>
            {formatTokenCount(usage.total_cache_read_tokens)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Sessions</span>
          <span className={styles.metricValue}>{usage.session_count}</span>
        </div>
      </div>
    </div>
  );
}
