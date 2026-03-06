/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PlanViewerLayout } from '@/components/dev/plan-viewer/PlanViewerLayout'
import { type PlanFilters, defaultPlanFilters } from '@/components/dev/plan-viewer/PlanTreeSearch'
import type { PlanRegistry, PlanItemType } from '@/lib/plan-registry'

export default function PlanViewerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading...</div>}>
      <PlanViewerInner />
    </Suspense>
  )
}

function PlanViewerInner() {
  const [plan, setPlan] = useState<PlanRegistry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PlanFilters>(defaultPlanFilters)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<PlanItemType | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const itemParam = searchParams.get('item')
    const typeParam = searchParams.get('type') as PlanItemType | null
    if (itemParam) {
      setSelectedItemId(itemParam)
      setSelectedItemType(typeParam || 'screen')
    }
  }, [searchParams])

  const handleSelectItem = useCallback((id: string, type: PlanItemType) => {
    setSelectedItemId(id)
    setSelectedItemType(type)
    const params = new URLSearchParams(searchParams.toString())
    params.set('item', id)
    params.set('type', type)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const fetchPlan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/plan')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPlan(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load plan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  // Auto-select first screen when plan loads and no URL param
  useEffect(() => {
    if (!plan || selectedItemId) return
    for (const mod of plan.modules) {
      if (mod.screens.length > 0) {
        handleSelectItem(mod.screens[0].id, 'screen')
        return
      }
    }
  }, [plan, selectedItemId, handleSelectItem])

  const filteredPlan = useMemo(() => {
    if (!plan) return null
    const searchLower = filters.search?.toLowerCase() || ''
    return {
      ...plan,
      modules: plan.modules
        .filter((mod) => !filters.module || mod.id === filters.module)
        .map((mod) => ({
          ...mod,
          screens: (!filters.type || filters.type === 'screen')
            ? mod.screens.filter((s) => !searchLower || s.name.toLowerCase().includes(searchLower) || s.route.toLowerCase().includes(searchLower))
            : [],
          apiEndpoints: (!filters.type || filters.type === 'endpoint')
            ? mod.apiEndpoints.filter((e) => !searchLower || e.path.toLowerCase().includes(searchLower) || e.description.toLowerCase().includes(searchLower))
            : [],
          dbTables: (!filters.type || filters.type === 'table')
            ? mod.dbTables.filter((t) => !searchLower || t.name.toLowerCase().includes(searchLower))
            : [],
        }))
        .filter((mod) => mod.screens.length > 0 || mod.apiEndpoints.length > 0 || mod.dbTables.length > 0),
      flows: (!filters.type || filters.type === 'flow')
        ? plan.flows.filter((f) => {
            const s = filters.search?.toLowerCase() || ''
            return !s || f.name.toLowerCase().includes(s)
          })
        : [],
    }
  }, [plan, filters])

  const totalCount = useMemo(() => {
    if (!plan) return 0
    return plan.modules.reduce((sum, m) => sum + m.screens.length + m.apiEndpoints.length + m.dbTables.length, 0) + plan.flows.length
  }, [plan])

  const filteredCount = useMemo(() => {
    if (!filteredPlan) return 0
    return filteredPlan.modules.reduce((sum, m) => sum + m.screens.length + m.apiEndpoints.length + m.dbTables.length, 0) + filteredPlan.flows.length
  }, [filteredPlan])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="flex h-[calc(100vh-8rem)]">
          <div className="w-72 border-r border-border p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="flex-1 p-6">
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">Failed to load plan</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={fetchPlan}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!plan || !filteredPlan) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div>
          <h1 className="text-base font-semibold text-foreground">Plan Viewer</h1>
          <p className="text-xs text-muted-foreground">
            {filteredCount === totalCount
              ? `${totalCount} items`
              : `${filteredCount} of ${totalCount} items`}
            {' · '}{plan.app} v{plan.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dev/tests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground hover:bg-muted transition-colors"
          >
            Tests
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/pitch"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:opacity-90 transition-opacity"
          >
            Pitch
            <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            onClick={fetchPlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Viewer */}
      <PlanViewerLayout
        plan={plan}
        filteredPlan={filteredPlan}
        selectedItemId={selectedItemId}
        selectedItemType={selectedItemType}
        onSelectItem={handleSelectItem}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
