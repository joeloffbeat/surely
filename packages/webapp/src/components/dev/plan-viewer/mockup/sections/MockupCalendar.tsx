'use client'

import { Badge } from '@/components/ui/badge'
import { MockupAction } from '../MockupAction'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { UICalendarSection } from '@/lib/plan-registry'

interface MockupCalendarProps {
  section: UICalendarSection
  onNavigate?: (route: string) => void
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MockupCalendar({ section, onNavigate }: MockupCalendarProps) {
  return (
    <div className="px-6 py-4 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground px-2">February 2026</span>
          <button className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {section.views.map((view) => (
            <button
              key={view}
              className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                view === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells (4 weeks) */}
        {[0, 1, 2, 3].map((week) => (
          <div key={week} className="grid grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const dayNum = week * 7 + day + 1
              const hasEvent = dayNum === 5 || dayNum === 12 || dayNum === 18
              return (
                <div
                  key={day}
                  className="h-16 border-b border-r border-border last:border-r-0 p-1.5 relative hover:bg-muted/30 transition-colors"
                >
                  <span className={`text-xs ${
                    hasEvent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}>
                    {dayNum <= 28 ? dayNum : ''}
                  </span>
                  {hasEvent && dayNum <= 28 && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <div className="h-4 rounded bg-primary/15 text-primary text-[10px] px-1 flex items-center truncate">
                        Event
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Event types legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {section.eventTypes.map((type) => (
          <div key={type.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: type.color }}
            />
            <span className="text-xs text-muted-foreground">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {section.actions && section.actions.length > 0 && (
        <div className="flex items-center gap-2">
          {section.actions.map((action, i) => (
            <MockupAction key={i} action={action} context="Calendar" onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}
