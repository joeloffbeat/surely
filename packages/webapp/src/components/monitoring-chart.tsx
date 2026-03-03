"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
interface MonitoringPoint {
  time: string;
  value: number;
}

interface MonitoringChartProps {
  data: MonitoringPoint[];
  threshold: number;
  comparison: "lt" | "gt" | "lte" | "gte";
  label?: string;
}

export default function MonitoringChart({
  data,
  threshold,
  comparison,
  label = "Value",
}: MonitoringChartProps) {
  const isBelow = comparison === "lt" || comparison === "lte";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-primary">
          Live Monitoring
        </span>
        <span className="text-xs text-dim">
          Trigger: {comparison.toUpperCase()} {threshold}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis
            dataKey="time"
            stroke="#555555"
            fontSize={10}
            tickLine={false}
          />
          <YAxis stroke="#555555" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid #1f1f1f",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#ededed",
            }}
          />
          <ReferenceLine
            y={threshold}
            stroke={isBelow ? "#ef4444" : "#f59e0b"}
            strokeDasharray="5 5"
            label={{
              value: `Threshold: ${threshold}`,
              position: "right",
              fill: "#888888",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            dot={false}
            name={label}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
