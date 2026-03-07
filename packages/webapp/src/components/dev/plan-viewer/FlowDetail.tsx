'use client'

import { Badge } from '@/components/ui/badge'
import { GitBranch, Monitor, Server, ArrowDown, CheckCircle2, Zap, Link2, Blocks, Bot, FileCode } from 'lucide-react'
import type { PlanFlow } from '@/lib/plan-registry'
import { layerConfig } from './shared'

const priorityColors: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-warning',
  medium: 'text-info',
  low: 'text-muted-foreground',
}

const priorityBgColors: Record<string, string> = {
  critical: 'bg-destructive/10 border-destructive/20',
  high: 'bg-warning/10 border-warning/20',
  medium: 'bg-info/10 border-info/20',
  low: 'bg-muted border-border',
}

interface FlowDetailProps {
  flow: PlanFlow
  onNavigate?: (itemId: string, type: string) => void
}

export function FlowDetail({ flow, onNavigate }: FlowDetailProps) {
  const sorted = [...flow.steps].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-violet-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{flow.name}</h3>
              <Badge className={`text-[10px] ${priorityColors[flow.priority]} ${priorityBgColors[flow.priority]}`}>
                {flow.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{sorted.length} steps &middot; {flow.module}</p>
          </div>
        </div>
        {flow.description && (
          <p className="text-sm text-muted-foreground">{flow.description}</p>
        )}

        {/* Tags */}
        {flow.tags && flow.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {flow.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Trigger */}
      {flow.trigger && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 flex items-start gap-2">
            <Zap className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger</p>
              <p className="text-sm text-foreground mt-0.5">{flow.trigger}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Flow Steps</h4>
        </div>
        <div className="p-4">
          {sorted.map((step, i) => {
            const layer = layerConfig[step.layer] ?? { label: step.layer, color: 'text-muted-foreground', bg: 'bg-muted' }

            return (
              <div key={step.order}>
                <div className="flex items-start gap-3">
                  {/* Step number with layer color */}
                  <div className={`w-7 h-7 rounded-full ${layer.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-bold ${layer.color}`}>{step.order}</span>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-0.5">
                    {/* Layer badge + action text */}
                    <div className="flex items-start gap-2">
                      <Badge className={`${layer.bg} ${layer.color} border-transparent text-[10px] shrink-0`}>
                        {layer.label}
                      </Badge>
                      <p className="text-sm text-foreground">{step.action}</p>
                    </div>

                    {/* Reference badges */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {step.screen && (
                        <Badge
                          className="bg-info/10 text-info border-info/20 text-[10px] gap-1 cursor-pointer hover:bg-info/20"
                          onClick={() => onNavigate?.(step.screen!, 'screen')}
                        >
                          <Monitor className="h-2.5 w-2.5" />
                          {step.screen}
                        </Badge>
                      )}
                      {step.endpoint && (
                        <Badge
                          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-1 cursor-pointer hover:bg-emerald-500/20"
                          onClick={() => onNavigate?.(step.endpoint!, 'endpoint')}
                        >
                          <Server className="h-2.5 w-2.5" />
                          {step.endpoint}
                        </Badge>
                      )}
                      {step.contract && (
                        <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20 text-[10px] gap-1">
                          <FileCode className="h-2.5 w-2.5" />
                          {step.contract}
                        </Badge>
                      )}
                      {step.service && (
                        <Badge className="bg-purple-600/10 text-purple-600 border-purple-600/20 text-[10px] gap-1">
                          <Blocks className="h-2.5 w-2.5" />
                          {step.service}
                        </Badge>
                      )}
                    </div>

                    {/* Expected result */}
                    {step.expectedResult && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          {step.expectedResult}
                        </span>
                      </div>
                    )}

                    {/* Checks */}
                    {step.checks && step.checks.length > 0 && (
                      <div className="mt-1.5 pl-0.5 space-y-0.5">
                        {step.checks.map((check, ci) => (
                          <div key={ci} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm border border-border flex items-center justify-center">
                              <CheckCircle2 className="h-2 w-2 text-muted-foreground/50" />
                            </div>
                            <span className="text-[11px] text-muted-foreground">{check}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {i < sorted.length - 1 && (
                  <div className="flex items-center ml-3.5 my-1">
                    <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Outcome */}
      {flow.outcome && (
        <div className="rounded-xl border border-success/30 bg-success/5">
          <div className="px-4 py-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wider">Outcome</p>
              <p className="text-sm text-foreground mt-0.5">{flow.outcome}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
