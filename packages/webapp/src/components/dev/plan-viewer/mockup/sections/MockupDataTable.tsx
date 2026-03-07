'use client'

import { Badge } from '@/components/ui/badge'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { MockupAction } from '../MockupAction'
import type { UIDataTableSection } from '@/lib/plan-registry'

interface MockupDataTableProps {
  section: UIDataTableSection
  onNavigate?: (route: string) => void
}

export function MockupDataTable({ section, onNavigate }: MockupDataTableProps) {
  const visibleCols = section.columns.filter((c) => c.hiddenOn !== 'mobile')
  const sampleRows = 4

  return (
    <div className="px-6 py-4 space-y-3">
      {/* Filter bar */}
      {section.filters && section.filters.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {section.filters.map((filter, i) => (
            <div
              key={i}
              className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground"
            >
              {filter.type === 'search' ? (
                <Search className="h-4 w-4" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              {filter.label}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        {/* Header row */}
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `repeat(${visibleCols.length}, minmax(0, 1fr))` }}
        >
          {visibleCols.map((col) => (
            <div
              key={col.key}
              className="px-4 py-3 text-xs font-medium text-muted-foreground"
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: sampleRows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className={`grid border-b border-border last:border-b-0 transition-colors hover:bg-muted/50 ${
              rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted/30'
            }`}
            style={{ gridTemplateColumns: `repeat(${visibleCols.length}, minmax(0, 1fr))` }}
          >
            {visibleCols.map((col) => (
              <div key={col.key} className="px-4 py-3 flex items-center">
                <CellPlaceholder type={col.type} />
              </div>
            ))}
          </div>
        ))}

        {/* Empty state hint */}
        {section.emptyMessage && (
          <div className="px-4 py-2 text-xs text-muted-foreground italic text-center border-t border-border">
            Empty state: {section.emptyMessage}
          </div>
        )}
      </div>

      {/* Row actions + pagination */}
      <div className="flex items-center justify-between">
        {section.rowActions && section.rowActions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Row actions:</span>
            {section.rowActions.map((action, i) => (
              <MockupAction key={i} action={action} context="Row Action" onNavigate={onNavigate} size="xs" />
            ))}
          </div>
        )}
        {section.pagination && (
          <div className="flex items-center gap-2 ml-auto">
            <button className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-sm text-muted-foreground">Page 1 of n</span>
            <button className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CellPlaceholder({ type }: { type?: string }) {
  switch (type) {
    case 'badge':
      return (
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
          Active
        </Badge>
      )
    case 'currency':
      return <span className="text-sm text-foreground font-mono">$12,450</span>
    case 'date':
      return <span className="text-sm text-muted-foreground">Jan 15, 2026</span>
    case 'avatar':
      return (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">JD</span>
          </div>
          <span className="text-sm text-foreground">John Doe</span>
        </div>
      )
    case 'actions':
      return <span className="text-sm text-muted-foreground">...</span>
    case 'number':
      return <span className="text-sm text-foreground font-mono">1,234</span>
    case 'link':
      return <span className="text-sm text-primary hover:underline cursor-pointer">View Details</span>
    default:
      return (
        <div className="h-3 w-full max-w-[100px] rounded bg-muted-foreground/10" />
      )
  }
}
