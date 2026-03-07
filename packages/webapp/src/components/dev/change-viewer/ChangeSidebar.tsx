'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FlaskConical, Globe, Home } from 'lucide-react'
import type { Change } from './types'
import { changeTypeColors, priorityColors } from './types'

interface ChangeSidebarProps {
  changes: Change[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ChangeSidebar({ changes, selectedId, onSelect }: ChangeSidebarProps) {
  // Group by priority
  const groups = groupByPriority(changes)

  return (
    <div className="w-80 border-r border-border flex flex-col bg-card/50">
      <div className="px-3 py-3 border-b border-border">
        <h3 className="text-xs font-semibold text-foreground">
          Changes ({changes.length})
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
            const items = groups[priority]
            if (!items || items.length === 0) return null
            return (
              <div key={priority}>
                <div className="px-2 py-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${getPriorityTextColor(priority)}`}>
                    {priority} priority
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((change) => (
                    <ChangeItem
                      key={change.id}
                      change={change}
                      isSelected={selectedId === change.id}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function ChangeItem({
  change,
  isSelected,
  onSelect,
}: {
  change: Change
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const typeColor = changeTypeColors[change.type] ?? changeTypeColors['fix']
  const isEcosystem = change.source?.type === 'ecosystem'

  return (
    <button
      onClick={() => onSelect(change.id)}
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
        isSelected
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/50 border border-transparent'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Type dot */}
        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${typeColor.bg} border ${typeColor.border}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground truncate">
            {change.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[8px] h-4 px-1.5 ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
            >
              {typeColor.label}
            </Badge>
            {change.tests.length > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <FlaskConical className="h-2.5 w-2.5" />
                {change.tests.length}
              </span>
            )}
            {isEcosystem ? (
              <span className="flex items-center gap-0.5 text-[9px] text-info">
                <Globe className="h-2.5 w-2.5" />
                eco
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Home className="h-2.5 w-2.5" />
                app
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function groupByPriority(changes: Change[]): Record<string, Change[]> {
  const groups: Record<string, Change[]> = {}
  for (const change of changes) {
    if (!groups[change.priority]) groups[change.priority] = []
    groups[change.priority].push(change)
  }
  return groups
}

function getPriorityTextColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-destructive'
    case 'high': return 'text-warning'
    case 'medium': return 'text-info'
    default: return 'text-muted-foreground'
  }
}
