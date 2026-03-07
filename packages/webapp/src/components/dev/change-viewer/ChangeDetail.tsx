'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FlaskConical,
  Globe,
  Home,
  ListOrdered,
  Link2,
  Monitor,
  Server,
  Eye,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { ChangeMockup } from './ChangeMockup'
import type { Change, ChangeTest } from './types'
import { changeTypeColors, priorityColors } from './types'

interface ChangeDetailProps {
  change: Change
}

export function ChangeDetail({ change }: ChangeDetailProps) {
  const typeColor = changeTypeColors[change.type] ?? changeTypeColors['fix']
  const priorityCls = priorityColors[change.priority] ?? priorityColors['low']
  const isEcosystem = change.source?.type === 'ecosystem'

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-foreground">{change.title}</h2>
            <div className="flex items-center gap-1.5 shrink-0">
              {isEcosystem ? (
                <Badge variant="outline" className="text-[9px] h-5 px-2 gap-1 bg-info/5 text-info border-info/20">
                  <Globe className="h-3 w-3" />
                  Ecosystem
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] h-5 px-2 gap-1">
                  <Home className="h-3 w-3" />
                  App Only
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[9px] h-5 px-2 ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
            >
              {typeColor.label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[9px] h-5 px-2 ${priorityCls}`}
            >
              {change.priority}
            </Badge>
            <Badge variant="secondary" className="text-[9px] h-5 px-2">
              {change.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">{change.id}</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {change.description}
          </p>
        </div>

        {/* Affected areas */}
        <AffectedAreas change={change} />

        {/* UI Mockup */}
        {change.ui && <MockupSection change={change} />}

        {/* Tests */}
        {change.tests.length > 0 && <TestsSection tests={change.tests} />}

        {/* Instructions */}
        {change.instructions.length > 0 && <InstructionsSection instructions={change.instructions} />}

        {/* Dependencies */}
        {change.dependsOn.length > 0 && <DependenciesSection deps={change.dependsOn} />}
      </div>
    </ScrollArea>
  )
}

function AffectedAreas({ change }: { change: Change }) {
  const hasScreens = change.affectedScreens.length > 0
  const hasEndpoints = change.affectedEndpoints.length > 0
  if (!hasScreens && !hasEndpoints) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {change.affectedScreens.map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Monitor className="h-3 w-3" />
          {s}
        </span>
      ))}
      {change.affectedEndpoints.map((e) => (
        <span key={e} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Server className="h-3 w-3" />
          {e}
        </span>
      ))}
    </div>
  )
}

function MockupSection({ change }: { change: Change }) {
  const [view, setView] = useState<'after' | 'before'>('after')
  const ui = change.ui!
  const hasBefore = !!ui.before
  const hasHighlights = ui.highlights && ui.highlights.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          UI Preview
        </h3>
        {hasBefore && (
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView('before')}
              className={`px-3 py-1 text-[10px] font-medium transition-colors ${
                view === 'before'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setView('after')}
              className={`px-3 py-1 text-[10px] font-medium transition-colors ${
                view === 'after'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              After
            </button>
          </div>
        )}
      </div>

      {view === 'before' && ui.before ? (
        <ChangeMockup mockup={ui.before} title={`${change.title} (Before)`} />
      ) : (
        <ChangeMockup mockup={ui.after} title={change.title} />
      )}

      {hasHighlights && (
        <div className="flex items-start gap-2 flex-wrap">
          <Sparkles className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
          {ui.highlights!.map((h, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[9px] h-5 px-2 bg-warning/5 text-warning border-warning/20"
            >
              {h}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function TestsSection({ tests }: { tests: ChangeTest[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-muted-foreground" />
        Tests ({tests.length})
      </h3>
      <div className="space-y-2">
        {tests.map((test) => {
          const isExpanded = expandedId === test.id
          const prCls = priorityColors[test.priority] ?? priorityColors['low']
          return (
            <div
              key={test.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : test.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
              >
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-foreground">{test.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className={`text-[8px] h-4 px-1.5 ${prCls}`}>
                    {test.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-[8px] h-4 px-1.5">
                    {test.type}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">
                    {test.steps.length} steps
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border px-3 py-2.5 bg-muted/20">
                  <div className="space-y-1.5">
                    {test.steps.map((step) => (
                      <div key={step.order} className="flex items-start gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground w-4 shrink-0 text-right">
                          {step.order}.
                        </span>
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 shrink-0">
                          {step.action}
                        </Badge>
                        <span className="text-[10px] text-foreground">
                          {step.description}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono truncate">
                          {step.target}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InstructionsSection({ instructions }: { instructions: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ListOrdered className="h-4 w-4 text-muted-foreground" />
        Build Instructions
      </h3>
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        {instructions.map((inst, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-[10px] font-mono font-semibold text-primary w-5 shrink-0 text-right">
              {i + 1}.
            </span>
            <span className="text-xs text-foreground leading-relaxed">{inst}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DependenciesSection({ deps }: { deps: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        Dependencies
      </h3>
      <div className="flex items-center gap-2 flex-wrap">
        {deps.map((dep) => (
          <Badge key={dep} variant="secondary" className="text-[10px] h-5 px-2 font-mono">
            {dep}
          </Badge>
        ))}
      </div>
    </div>
  )
}
