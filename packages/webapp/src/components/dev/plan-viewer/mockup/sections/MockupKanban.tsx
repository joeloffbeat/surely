'use client'

import { GripVertical } from 'lucide-react'
import type { UIKanbanSection } from '@/lib/plan-registry'

interface MockupKanbanProps {
  section: UIKanbanSection
}

export function MockupKanban({ section }: MockupKanbanProps) {
  return (
    <div className="px-6 py-4">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {section.columns.map((col) => (
          <div
            key={col.id}
            className="min-w-[180px] flex-1 rounded-lg border border-border bg-muted/30 p-3"
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-sm font-semibold text-foreground truncate">
                {col.label}
              </span>
              {col.count != null && (
                <span className="text-xs text-muted-foreground ml-auto bg-muted rounded-full px-2 py-0.5">
                  {col.count}
                </span>
              )}
            </div>

            {/* Sample cards */}
            <div className="space-y-2">
              {[0, 1].map((cardIdx) => (
                <div
                  key={cardIdx}
                  className={`rounded-md border border-border bg-card p-3 shadow-sm space-y-1.5 ${
                    section.draggable ? 'cursor-grab' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {section.draggable && (
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      {section.cardFields.slice(0, 2).map((field, fi) => (
                        <div
                          key={fi}
                          className={`h-3 rounded ${
                            fi === 0 ? 'w-3/4 bg-foreground/15' : 'w-1/2 bg-muted-foreground/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
