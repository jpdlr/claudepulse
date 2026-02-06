import type { CostEstimate as CostEstimateType } from '../../types';
import { formatCurrency } from '../../lib/format';
import styles from './CostEstimate.module.css';

interface CostEstimateProps {
  estimate: CostEstimateType;
}

export function CostEstimate({ estimate }: CostEstimateProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>Est. Cost</span>
      <div className={styles.costs}>
        <div className={styles.costItem}>
          <span className={styles.costLabel}>5-Hour Window</span>
          <span className={styles.costValue}>
            {formatCurrency(estimate.window_cost_usd)}
          </span>
        </div>
        <div className={styles.costItem}>
          <span className={styles.costLabel}>This Week</span>
          <span className={styles.costValue}>
            {formatCurrency(estimate.weekly_cost_usd)}
          </span>
        </div>
      </div>
    </div>
  );
}
