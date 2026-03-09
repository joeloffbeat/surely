'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Monitor, Server, Database, GitBranch, Layers, Rocket } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getTotalStats, getModuleSummaries } from '@/lib/plan-registry'
import type { PlanRegistry } from '@/lib/plan-registry'

export default function PitchPage() {
  const [plan, setPlan] = useState<PlanRegistry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchPlan = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/plan')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setPlan(await res.json())
    } catch (err: any) {
      setError(err.message || 'Failed to load plan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlan()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">Failed to load plan</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button onClick={fetchPlan} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!plan) return null

  const stats = getTotalStats(plan)
  const modules = getModuleSummaries(plan)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dev/plan')}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Back to Plan Viewer"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Project Pitch</h1>
            <p className="text-xs text-muted-foreground">{plan.app} v{plan.version}</p>
          </div>
        </div>
        <button
          onClick={fetchPlan}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Pitch Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 space-y-10">
          {/* Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
              <Rocket className="h-4 w-4" />
              Project Overview
            </div>
            <h2 className="text-3xl font-bold text-foreground">{plan.app}</h2>
            <p className="text-lg text-muted-foreground">{plan.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Layers} label="Modules" value={stats.modules} color="text-primary" />
            <StatCard icon={Monitor} label="Screens" value={stats.screens} color="text-info" />
            <StatCard icon={Server} label="Endpoints" value={stats.endpoints} color="text-emerald-500" />
            <StatCard icon={Database} label="Tables" value={stats.tables} color="text-amber-500" />
            <StatCard icon={GitBranch} label="Flows" value={stats.flows} color="text-violet-500" />
          </div>

          {/* Tech Stack */}
          {Object.keys(plan.techStack).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Tech Stack</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(plan.techStack).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground capitalize w-24">{key}</span>
                    <span className="text-sm text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((mod) => {
                const planMod = plan.modules.find((m) => m.id === mod.moduleId)
                return (
                  <div key={mod.moduleId} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: mod.color }}
                      />
                      <h4 className="font-semibold text-foreground">{mod.moduleName}</h4>
                    </div>
                    {planMod && (
                      <p className="text-sm text-muted-foreground mb-3">{planMod.description}</p>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{mod.screenCount} screens</span>
                      <span>{mod.endpointCount} endpoints</span>
                      <span>{mod.tableCount} tables</span>
                    </div>
                    {mod.implementedScreens > 0 && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{ width: `${(mod.implementedScreens / mod.screenCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {mod.implementedScreens}/{mod.screenCount} implemented
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Flows */}
          {plan.flows.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Key Flows</h3>
              <div className="space-y-3">
                {plan.flows.map((flow) => (
                  <div key={flow.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-4 w-4 text-violet-500" />
                      <h4 className="font-medium text-foreground">{flow.name}</h4>
                      <Badge variant="secondary" className="text-[10px]">{flow.steps.length} steps</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {flow.steps.map((step, i) => (
                        <span key={step.order} className="flex items-center gap-1">
                          {i > 0 && <span className="text-muted-foreground/40">→</span>}
                          <span>{step.action}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Ready to explore?</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/dev/plan"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
              >
                View Full Plan
              </Link>
              <Link
                href="/dev/flow-dashboard"
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted"
              >
                Test Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Monitor
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
