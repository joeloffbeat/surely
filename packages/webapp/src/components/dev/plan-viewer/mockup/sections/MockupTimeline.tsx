'use client'

import type { UITimelineSection } from '@/lib/plan-registry'

interface MockupTimelineProps {
  section: UITimelineSection
}

export function MockupTimeline({ section }: MockupTimelineProps) {
  const items = section.items ?? [
    { label: 'Event 1', description: 'Description', time: '10:00 AM' },
    { label: 'Event 2', description: 'Description', time: '2:00 PM' },
    { label: 'Event 3', description: 'Description', time: '5:00 PM' },
  ]

  return (
    <div className="px-6 py-4 space-y-3">
      {section.title && (
        <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
      )}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="relative flex items-start gap-3">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-primary bg-background z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  {item.time && (
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
