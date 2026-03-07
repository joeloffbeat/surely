'use client'

import { Search, X } from 'lucide-react'
import type { PlanRegistry, PlanItemType } from '@/lib/plan-registry'

export interface PlanFilters {
  search: string
  module: string | null
  type: PlanItemType | null
}

export const defaultPlanFilters: PlanFilters = {
  search: '',
  module: null,
  type: null,
}

interface PlanTreeSearchProps {
  filters: PlanFilters
  onFiltersChange: (filters: PlanFilters) => void
  plan: PlanRegistry
}

export function PlanTreeSearch({ filters, onFiltersChange, plan }: PlanTreeSearchProps) {
  const hasFilters = filters.search || filters.module || filters.type

  const update = (partial: Partial<PlanFilters>) => {
    onFiltersChange({ ...filters, ...partial })
  }

  return (
    <div className="p-3 border-b border-border space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search plan items..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterSelect
          value={filters.module}
          onChange={(v) => update({ module: v })}
          placeholder="Module"
          options={plan.modules.map((m) => ({ value: m.id, label: m.name }))}
        />
        <FilterSelect
          value={filters.type}
          onChange={(v) => update({ type: v as PlanItemType | null })}
          placeholder="Type"
          options={[
            { value: 'screen', label: 'Screens' },
            { value: 'endpoint', label: 'Endpoints' },
            { value: 'table', label: 'Tables' },
            { value: 'flow', label: 'Flows' },
          ]}
        />
        {hasFilters && (
          <button
            onClick={() => onFiltersChange(defaultPlanFilters)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground rounded border border-border hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | null
  onChange: (v: string | null) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`px-2 py-1 text-[10px] rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer ${
        value ? 'border-primary/50 text-foreground' : 'text-muted-foreground'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
