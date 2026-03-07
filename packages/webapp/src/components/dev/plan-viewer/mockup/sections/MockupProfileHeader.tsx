'use client'

import { Badge } from '@/components/ui/badge'
import { MockupAction } from '../MockupAction'
import type { UIProfileHeaderSection } from '@/lib/plan-registry'

interface MockupProfileHeaderProps {
  section: UIProfileHeaderSection
  onNavigate?: (route: string) => void
}

export function MockupProfileHeader({ section, onNavigate }: MockupProfileHeaderProps) {
  return (
    <div className="space-y-0">
      {/* Banner */}
      <div
        className="h-24 rounded-t-lg"
        style={{
          backgroundColor: section.bannerColor
            ? `${section.bannerColor}30`
            : 'hsl(var(--muted))',
        }}
      />

      {/* Profile info */}
      <div className="px-6 pb-4 -mt-8 space-y-4">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full border-4 border-background bg-muted flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-lg font-bold text-muted-foreground">
              {section.title.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0 pt-8">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
              {section.badges?.map((badge, i) => (
                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
                  {badge.label}
                </Badge>
              ))}
            </div>
            {section.subtitle && (
              <p className="text-sm text-muted-foreground">{section.subtitle}</p>
            )}
          </div>

          {/* Actions */}
          {section.actions && section.actions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {section.actions.map((action, i) => (
                <MockupAction key={i} action={action} context="Profile" onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        {/* Stats row */}
        {section.stats && section.stats.length > 0 && (
          <div className="flex items-center gap-6 pt-2 border-t border-border">
            {section.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
