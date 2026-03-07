'use client'

import { useCallback } from 'react'
import { PlanTree } from './PlanTree'
import { PlanTreeSearch, type PlanFilters } from './PlanTreeSearch'
import { ScreenDetail } from './ScreenDetail'
import { EndpointDetail } from './EndpointDetail'
import { TableDetail } from './TableDetail'
import { FlowDetail } from './FlowDetail'
import { EmptyPlanState } from './EmptyPlanState'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { PlanRegistry, PlanItemType, PlanModule } from '@/lib/plan-registry'

interface PlanViewerLayoutProps {
  plan: PlanRegistry
  filteredPlan: PlanRegistry
  selectedItemId: string | null
  selectedItemType: PlanItemType | null
  onSelectItem: (id: string, type: PlanItemType) => void
  filters: PlanFilters
  onFiltersChange: (filters: PlanFilters) => void
}

function findItemContext(
  plan: PlanRegistry,
  itemId: string,
  itemType: PlanItemType
): { module: PlanModule; item: any } | null {
  if (itemType === 'flow') {
    const flow = plan.flows.find((f) => f.id === itemId)
    if (flow) return { module: { id: '', name: 'Flows', description: '', color: '#8b5cf6', icon: 'GitBranch', screens: [], apiEndpoints: [], dbTables: [] }, item: flow }
    return null
  }

  for (const mod of plan.modules) {
    if (itemType === 'screen') {
      const screen = mod.screens.find((s) => s.id === itemId)
      if (screen) return { module: mod, item: screen }
    }
    if (itemType === 'endpoint') {
      const endpoint = mod.apiEndpoints.find((e) => e.id === itemId)
      if (endpoint) return { module: mod, item: endpoint }
    }
    if (itemType === 'table') {
      const table = mod.dbTables.find((t) => t.id === itemId)
      if (table) return { module: mod, item: table }
    }
  }
  return null
}

function findScreenByRoute(plan: PlanRegistry, route: string): { id: string; type: PlanItemType } | null {
  for (const mod of plan.modules) {
    const screen = mod.screens.find((s) => s.route === route)
    if (screen) return { id: screen.id, type: 'screen' }
  }
  return null
}

export function PlanViewerLayout({
  plan,
  filteredPlan,
  selectedItemId,
  selectedItemType,
  onSelectItem,
  filters,
  onFiltersChange,
}: PlanViewerLayoutProps) {
  const ctx = selectedItemId && selectedItemType
    ? findItemContext(plan, selectedItemId, selectedItemType)
    : null

  const handleNavigate = useCallback((route: string) => {
    const target = findScreenByRoute(plan, route)
    if (target) {
      onSelectItem(target.id, target.type)
    }
  }, [plan, onSelectItem])

  const handleNavigateToItem = useCallback((itemId: string, type: string) => {
    onSelectItem(itemId, type as PlanItemType)
  }, [onSelectItem])

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Left panel -- tree */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col bg-card/50">
        <PlanTreeSearch
          filters={filters}
          onFiltersChange={onFiltersChange}
          plan={plan}
        />
        <div className="flex-1 overflow-hidden">
          <PlanTree
            plan={filteredPlan}
            selectedItemId={selectedItemId}
            selectedItemType={selectedItemType}
            onSelectItem={onSelectItem}
          />
        </div>
      </div>

      {/* Right panel -- detail */}
      <div className="flex-1 overflow-hidden">
        {ctx ? (
          <ScrollArea className="h-full">
            <div className="p-6">
              {selectedItemType === 'screen' && (
                <ScreenDetail
                  screen={ctx.item}
                  module={ctx.module}
                  plan={plan}
                  onNavigate={handleNavigate}
                />
              )}
              {selectedItemType === 'endpoint' && (
                <EndpointDetail endpoint={ctx.item} module={ctx.module} />
              )}
              {selectedItemType === 'table' && (
                <TableDetail table={ctx.item} module={ctx.module} />
              )}
              {selectedItemType === 'flow' && (
                <FlowDetail flow={ctx.item} onNavigate={handleNavigateToItem} />
              )}
            </div>
          </ScrollArea>
        ) : (
          <EmptyPlanState />
        )}
      </div>
    </div>
  )
}
