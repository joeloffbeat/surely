'use client'

import { BarChart3, LineChart, PieChart, AreaChart, Circle } from 'lucide-react'
import type { UIChartSection } from '@/lib/plan-registry'

interface MockupChartProps {
  section: UIChartSection
}

const chartIcons: Record<string, React.ReactNode> = {
  line: <LineChart className="h-8 w-8 text-muted-foreground/40" />,
  bar: <BarChart3 className="h-8 w-8 text-muted-foreground/40" />,
  pie: <PieChart className="h-8 w-8 text-muted-foreground/40" />,
  area: <AreaChart className="h-8 w-8 text-muted-foreground/40" />,
  donut: <Circle className="h-8 w-8 text-muted-foreground/40" />,
}

export function MockupChart({ section }: MockupChartProps) {
  return (
    <div className="px-6 py-4">
      <div className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
            )}
          </div>
        </div>

        {/* Chart placeholder area */}
        <div className="flex items-center justify-center h-[200px] rounded-md bg-muted/30">
          <div className="flex flex-col items-center gap-2">
            {chartIcons[section.chartType] ?? chartIcons.bar}
            <span className="text-xs text-muted-foreground capitalize">
              {section.chartType} Chart
            </span>
          </div>
        </div>

        {/* Data keys legend */}
        {section.dataKeys && section.dataKeys.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-border">
            {section.dataKeys.map((key, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: i === 0 ? '#ef4444' : `hsl(${(i * 60 + 200) % 360}, 60%, 55%)`,
                  }}
                />
                <span className="text-xs text-muted-foreground">{key}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
