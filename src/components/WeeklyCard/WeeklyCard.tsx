import type { WeeklyUsage } from '../../types';
import { formatTokenCount } from '../../lib/format';
import styles from './WeeklyCard.module.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeeklyCardProps {
  usage: WeeklyUsage;
}

export function WeeklyCard({ usage }: WeeklyCardProps) {
  const maxOutput = Math.max(
    ...usage.daily_breakdown.map((d) => d.output_tokens),
    1,
  );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>This Week</span>
        <span className={styles.stats}>
          {usage.message_count} msgs &middot; {usage.session_count} sessions
        </span>
      </div>

      <div className={styles.chart}>
        {DAY_NAMES.map((day, i) => {
          const dayData = usage.daily_breakdown[i];
          const height = dayData
            ? (dayData.output_tokens / maxOutput) * 100
            : 0;
          return (
            <div key={day} className={styles.barCol}>
              <div
                className={styles.bar}
                style={{ height: `${Math.max(height, 3)}%` }}
                title={
                  dayData
                    ? `${day}: ${formatTokenCount(dayData.output_tokens)} output`
                    : `${day}: no data`
                }
              />
              <span className={styles.dayLabel}>{day[0]}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.totals}>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Output</span>
          <span className={styles.totalValue}>
            {formatTokenCount(usage.total_output_tokens)}
          </span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Input</span>
          <span className={styles.totalValue}>
            {formatTokenCount(usage.total_input_tokens)}
          </span>
        </div>
        <div className={styles.totalItem}>
          <span className={styles.totalLabel}>Cache</span>
          <span className={styles.totalValue}>
            {formatTokenCount(usage.total_cache_read_tokens)}
          </span>
        </div>
      </div>
    </div>
  );
}
