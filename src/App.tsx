import { useState } from 'react';
import { UsageHeader } from './components/UsageHeader';
import { WindowCard } from './components/WindowCard';
import { WeeklyCard } from './components/WeeklyCard';
import { ModelBreakdown } from './components/ModelBreakdown';
import { CostEstimate } from './components/CostEstimate';
import { SettingsPanel } from './components/SettingsPanel';
import { useUsageData } from './hooks/useUsageData';
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';
import './styles/global.css';

export default function App() {
  const { settings, updateSettings } = useSettings();
  const { data, loading, error, refresh } = useUsageData(
    settings.refresh_interval_secs,
  );
  useTheme(settings.theme);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading && !data) {
    return <div className="loading-state">Loading usage data...</div>;
  }

  if (error && !data) {
    return <div className="error-state">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="popover-wrapper">
      <div className="popover">
        <UsageHeader
          lastUpdated={data.last_updated}
          onRefresh={refresh}
          onSettingsClick={() => setSettingsOpen(true)}
        />
        <div className="content">
          <WindowCard
            usage={data.window}
            limit={settings.usage_limit_tokens}
          />
          <WeeklyCard usage={data.weekly} />
          <ModelBreakdown models={data.models} />
          <CostEstimate estimate={data.cost_estimate} />
        </div>
        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
