"use client";

interface TriggerConfig {
  metric: string;
  comparison: string;
  threshold: string;
  duration: string;
  cadence: string;
}

interface StepTriggerProps {
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

export default function StepTrigger({ config, onChange }: StepTriggerProps) {
  const update = (field: keyof TriggerConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted-fg">Metric Name</label>
        <input
          type="text"
          value={config.metric}
          onChange={(e) => update("metric", e.target.value)}
          placeholder="e.g., BTC Price (USD)"
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-muted-fg">Comparison</label>
          <select
            value={config.comparison}
            onChange={(e) => update("comparison", e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary outline-none"
          >
            <option value="lt">Less Than (LT)</option>
            <option value="gt">Greater Than (GT)</option>
            <option value="lte">Less Than or Equal (LTE)</option>
            <option value="gte">Greater Than or Equal (GTE)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-fg">Threshold</label>
          <input
            type="text"
            inputMode="decimal"
            value={config.threshold}
            onChange={(e) =>
              update("threshold", e.target.value.replace(/[^0-9.]/g, ""))
            }
            placeholder="e.g., 20"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-muted-fg">
            Duration (ticks)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={config.duration}
            onChange={(e) =>
              update("duration", e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="e.g., 12"
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-fg">Cadence</label>
          <select
            value={config.cadence}
            onChange={(e) => update("cadence", e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary outline-none"
          >
            <option value="1m">Every 1 minute</option>
            <option value="5m">Every 5 minutes</option>
            <option value="15m">Every 15 minutes</option>
            <option value="1h">Every 1 hour</option>
            <option value="1d">Every 1 day</option>
          </select>
        </div>
      </div>
    </div>
  );
}
