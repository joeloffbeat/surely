'use client'

import { Badge } from '@/components/ui/badge'
import { Server, Shield, ArrowRight, AlertTriangle, Monitor, Link2 } from 'lucide-react'
import type { PlanEndpoint, PlanModule, PlanRegistry } from '@/lib/plan-registry'
import { findScreenById } from '@/lib/plan-registry'
import { layerConfig } from './shared'

interface EndpointDetailProps {
  endpoint: PlanEndpoint
  module: PlanModule
  plan?: PlanRegistry
  onNavigate?: (route: string) => void
}

const methodColors: Record<string, string> = {
  GET: 'bg-success/10 text-success border-success/20',
  POST: 'bg-info/10 text-info border-info/20',
  PUT: 'bg-warning/10 text-warning border-warning/20',
  PATCH: 'bg-warning/10 text-warning border-warning/20',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function EndpointDetail({ endpoint, module, plan, onNavigate }: EndpointDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Server className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={methodColors[endpoint.method] || 'bg-muted text-muted-foreground'}>
                {endpoint.method}
              </Badge>
              <span className="text-sm font-mono text-foreground">{endpoint.path}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
      </div>

      {/* Module */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: module.color }} />
        <span className="text-sm text-muted-foreground">{module.name}</span>
      </div>

      {/* Auth & Roles */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Auth & Access</h4>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-24">Auth Required:</span>
            <Badge variant={endpoint.auth ? 'default' : 'secondary'} className="text-xs">
              {endpoint.auth ? 'Yes' : 'No'}
            </Badge>
          </div>
          {endpoint.roles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24">Roles:</span>
              <div className="flex flex-wrap gap-1">
                {endpoint.roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request / Response */}
      {(endpoint.request || endpoint.response) && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Schema</h4>
          </div>
          <div className="p-4 space-y-4">
            {endpoint.request && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Request Body</h5>
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
                  {Object.entries(endpoint.request).map(([key, type]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-foreground">{key}:</span>
                      <span className="text-muted-foreground">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {endpoint.response && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Response</h5>
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
                  {Object.entries(endpoint.response).map(([key, type]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-foreground">{key}:</span>
                      <span className="text-muted-foreground">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Server Flow Timeline */}
      {endpoint.serverFlow && endpoint.serverFlow.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Server Flow
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {endpoint.serverFlow.length} steps
              </span>
            </h4>
          </div>
          <div className="p-4">
            <div className="space-y-0">
              {endpoint.serverFlow
                .sort((a, b) => a.order - b.order)
                .map((step, i) => {
                  const layer = layerConfig[step.layer] ?? layerConfig.external
                  const isLast = i === endpoint.serverFlow!.length - 1
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full ${layer.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-[8px] font-bold ${layer.color}`}>{layer.label}</span>
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-border min-h-[12px]" />}
                      </div>
                      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-2'}`}>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Called By */}
      {endpoint.calledBy && endpoint.calledBy.length > 0 && plan && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Called By
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {endpoint.calledBy.length} screens
              </span>
            </h4>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {endpoint.calledBy.map((screenId) => {
              const screen = findScreenById(plan, screenId)
              return (
                <button
                  key={screenId}
                  onClick={() => screen && onNavigate?.(screen.route)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <Monitor className="h-3 w-3 text-info shrink-0" />
                  <span className="text-xs font-medium text-foreground">
                    {screen?.name ?? screenId}
                  </span>
                  {screen && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {screen.route}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Responses */}
      {endpoint.errorResponses && endpoint.errorResponses.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Error Responses
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {endpoint.errorResponses.length}
              </span>
            </h4>
          </div>
          <div className="divide-y divide-border">
            {endpoint.errorResponses.map((err, i) => {
              const isServerError = err.status >= 500
              return (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        isServerError
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }
                    >
                      {err.status}
                    </Badge>
                    {err.code && (
                      <span className="text-xs font-mono text-muted-foreground">{err.code}</span>
                    )}
                    <span className="text-xs text-foreground">{err.description}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-1">
                    When: {err.when}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
