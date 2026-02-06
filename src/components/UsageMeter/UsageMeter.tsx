import { formatTokenCount } from '../../lib/format';
import styles from './UsageMeter.module.css';

interface UsageMeterProps {
  current: number;
  limit: number;
}

export function UsageMeter({ current, limit }: UsageMeterProps) {
  const pct = Math.min((current / limit) * 100, 100);
  const level = pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'normal';

  return (
    <div className={styles.meter}>
      <div className={styles.track}>
        <div
          className={styles.fill}
          data-level={level}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={limit}
        />
      </div>
      <div className={styles.labels}>
        <span>{formatTokenCount(current)} / {formatTokenCount(limit)}</span>
        <span className={styles.percentage}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
