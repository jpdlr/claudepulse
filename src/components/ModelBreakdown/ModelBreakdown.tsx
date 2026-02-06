import type { ModelUsage } from '../../types';
import { formatTokenCount } from '../../lib/format';
import styles from './ModelBreakdown.module.css';

interface ModelBreakdownProps {
  models: ModelUsage[];
}

function modelKey(displayName: string): string {
  const lower = displayName.toLowerCase();
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('sonnet')) return 'sonnet';
  if (lower.includes('haiku')) return 'haiku';
  return 'sonnet';
}

export function ModelBreakdown({ models }: ModelBreakdownProps) {
  const maxTokens = Math.max(...models.map((m) => m.output_tokens), 1);

  if (models.length === 0) {
    return (
      <div className={styles.card}>
        <span className={styles.label}>Model Breakdown</span>
        <div className={styles.empty}>No model data in this window</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.label}>Model Breakdown</span>
      <div className={styles.list}>
        {models.map((model) => {
          const key = modelKey(model.display_name);
          return (
            <div key={model.model} className={styles.row}>
              <div className={styles.modelInfo}>
                <span className={styles.dot} data-model={key} />
                <span className={styles.modelName}>{model.display_name}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  data-model={key}
                  style={{
                    width: `${(model.output_tokens / maxTokens) * 100}%`,
                  }}
                />
              </div>
              <span className={styles.tokenCount}>
                {formatTokenCount(model.output_tokens)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
