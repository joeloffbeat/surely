'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import type { UIStatsGridSection } from '@/lib/plan-registry'

interface MockupStatsGridProps {
  section: UIStatsGridSection
}

export function MockupStatsGrid({ section }: MockupStatsGridProps) {
  const cols = section.columns ?? Math.min(section.stats.length, 4)

  return (
    <div className="px-6 py-4">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {section.stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            {stat.trend && (
              <div className="flex items-center gap-1 mt-1">
                {stat.trend.startsWith('+') ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className={`text-xs font-medium ${
                  stat.trend.startsWith('+') ? 'text-success' : 'text-destructive'
                }`}>
                  {stat.trend}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
