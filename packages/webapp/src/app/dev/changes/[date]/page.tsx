'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  RefreshCw,
  FlaskConical,
  GitBranch,
  CalendarDays,
  Layers,
  Globe,
} from 'lucide-react'
import { ChangeViewerLayout } from '@/components/dev/change-viewer/ChangeViewerLayout'
import type { ChangeSet } from '@/components/dev/change-viewer/types'

export default function ChangeViewerPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = use(params)
  const router = useRouter()
  const [changeSet, setChangeSet] = useState<ChangeSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchChanges = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dev/changes/${date}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data: ChangeSet = await res.json()
      setChangeSet(data)
      // Auto-select first change
      if (data.changes.length > 0 && !selectedId) {
        setSelectedId(data.changes[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load change set')
    } finally {
      setLoading(false)
    }
  }, [date, selectedId])

  useEffect(() => {
    fetchChanges()
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="flex h-[calc(100vh-12rem)]">
          <div className="w-80 border-r border-border p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
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
          <p className="text-destructive font-medium">Failed to load changes</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={fetchChanges}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!changeSet) return null

  const ecoCount = changeSet.changes.filter((c) => c.source?.type === 'ecosystem').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Change Viewer</h1>
              <p className="text-xs text-muted-foreground">
                {changeSet.summary}
              </p>
            </div>
          </div>
          <button
            onClick={fetchChanges}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatBadge icon={CalendarDays} label={date} />
          <StatBadge icon={Layers} label={`${changeSet.changes.length} changes`} />
          <StatBadge icon={FlaskConical} label={`${changeSet.totalTests} tests`} />
          <StatBadge icon={GitBranch} label={`${changeSet.executionOrder.length} phases`} />
          {ecoCount > 0 && (
            <StatBadge icon={Globe} label={`${ecoCount} ecosystem`} variant="info" />
          )}
          <Badge variant="secondary" className="text-[10px] h-6 px-2">
            {changeSet.status}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">
            {changeSet.app} v{changeSet.version}
          </span>
        </div>
      </div>

      {/* Viewer */}
      <ChangeViewerLayout
        changes={changeSet.changes}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  )
}

function StatBadge({
  icon: Icon,
  label,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  variant?: 'info'
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${
        variant === 'info'
          ? 'bg-info/5 border-info/20 text-info'
          : 'bg-card border-border text-muted-foreground'
      }`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  )
}
