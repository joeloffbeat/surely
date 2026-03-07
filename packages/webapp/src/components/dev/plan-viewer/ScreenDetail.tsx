'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Monitor, CheckCircle2, Circle, Shield, Layers, FlaskConical,
  Link2, ArrowRight, X, MousePointerClick, ExternalLink, Send,
  Trash2, MessageSquare, Download, ToggleLeft, AlertTriangle,
  ArrowRightLeft, Eye, FormInput, Maximize2, Minimize2,
  Smartphone, Tablet, MonitorIcon
} from 'lucide-react'
import { ScreenMockup } from './mockup/ScreenMockup'
import { ActionContext, type SelectedAction } from './mockup/ActionContext'
import type { PlanScreen, PlanModule, PlanRegistry, PlanTest, UIAction, UIDialog, UISection, AppFlow } from '@/lib/plan-registry'
import { hasPreview } from '@/lib/preview-registry'
import { layerConfig } from './shared'

interface ScreenDetailProps {
  screen: PlanScreen
  module: PlanModule
  plan?: PlanRegistry
  onNavigate?: (route: string) => void
}

const priorityColors: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  medium: 'bg-info/10 text-info border-info/20',
  low: 'bg-muted text-muted-foreground border-border',
}

const testPriorityColors: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-warning',
  medium: 'text-info',
  low: 'text-muted-foreground',
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  navigate: <ArrowRight className="h-4 w-4" />,
  dialog: <MessageSquare className="h-4 w-4" />,
  submit: <Send className="h-4 w-4" />,
  'api-call': <ExternalLink className="h-4 w-4" />,
  'confirm-delete': <Trash2 className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  toggle: <ToggleLeft className="h-4 w-4" />,
}

export function ScreenDetail({ screen, module, plan, onNavigate }: ScreenDetailProps) {
  const isImplemented = screen.status === 'implemented'
  const [selected, setSelected] = useState<SelectedAction | null>(null)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Always show live preview when available, mockup as fallback
  const showPreview = hasPreview(screen.route)

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }

  const toggleFullscreen = () => {
    if (!previewContainerRef.current) return
    if (!isFullscreen) {
      previewContainerRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Sync fullscreen state when user exits via Esc
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const handleActionClick = (action: UIAction, context: string) => {
    // Toggle off if clicking same action
    if (selected?.action.label === action.label && selected?.context === context) {
      setSelected(null)
    } else {
      setSelected({ action, context })
    }
  }

  // Collect all UIActions from the screen for matching postMessage clicks
  const allActions = useMemo(() => {
    if (!screen.ui) return [] as { action: UIAction; context: string }[]
    const actions: { action: UIAction; context: string }[] = []
    const collectFrom = (sections: UISection[] | undefined, ctx: string) => {
      sections?.forEach((section) => {
        const sectionActions = (section as any).actions as UIAction[] | undefined
        sectionActions?.forEach((a) => actions.push({ action: a, context: ctx }))
      })
    }
    collectFrom(screen.ui.sections, screen.name)
    screen.ui.dialogs?.forEach((d) => {
      if (d.submitAction) actions.push({ action: d.submitAction, context: d.title })
    })
    return actions
  }, [screen.ui, screen.name])

  // Listen for postMessage from iframe
  useEffect(() => {
    if (!showPreview) return

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'preview-action') return

      const label = (e.data.label as string)?.trim()
      if (!label) return

      // Try to match the clicked label to a UIAction in plan.json
      const match = allActions.find((entry) => {
        const actionLabel = entry.action.label?.toLowerCase() ?? ''
        const clickedLabel = label.toLowerCase()
        return actionLabel === clickedLabel || actionLabel.includes(clickedLabel) || clickedLabel.includes(actionLabel)
      })

      if (match) {
        setSelected({ action: match.action, context: match.context })
      } else {
        // Show a helpful "unmatched" action panel
        setSelected({
          action: {
            label,
            action: 'navigate',
            description: `This element ("${label}") is interactive in the live app but doesn't have a matching action defined in plan.json yet. Run /x1 enrich to add it.`,
          },
          context: screen.name,
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [showPreview, allActions])

  // Reset selection when screen changes
  useEffect(() => {
    setSelected(null)
  }, [screen.route])

  // Find dialog when action targets one
  const targetDialog = useMemo(() => {
    if (!selected || selected.action.action !== 'dialog' || !selected.action.target) return null
    return screen.ui?.dialogs?.find((d) => d.id === selected.action.target) ?? null
  }, [selected, screen.ui?.dialogs])

  // Find target screen when action navigates
  const targetScreen = useMemo(() => {
    if (!selected || selected.action.action !== 'navigate' || !selected.action.target || !plan) return null
    const target = selected.action.target
    for (const mod of plan.modules) {
      const s = mod.screens.find((s) => s.route === target || s.id === target)
      if (s) return { screen: s, module: mod }
    }
    return null
  }, [selected, plan])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
            <Monitor className="h-4 w-4 text-info" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{screen.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{screen.route}</p>
          </div>
          <Badge className={priorityColors[screen.priority]}>
            {screen.priority}
          </Badge>
          <Badge className={isImplemented
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-muted text-muted-foreground border-border'
          }>
            {isImplemented ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Circle className="h-3 w-3 mr-1" />}
            {screen.status || 'planned'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{screen.description}</p>
      </div>

      {/* Module */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: module.color }} />
        <span className="text-sm text-muted-foreground">{module.name}</span>
      </div>

      {/* Live Preview (iframe) — shown by default when available */}
      {showPreview && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Live preview — click any button to see its workflow
            </span>
          </div>
          <div ref={previewContainerRef} className={`rounded-xl border border-border bg-card overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}>
            {/* Browser chrome with viewport controls */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              </div>

              {/* URL bar */}
              <div className="flex-1 bg-background rounded-md px-3 py-0.5 text-[10px] font-mono text-muted-foreground">
                localhost:3013/preview{screen.route}
              </div>

              {/* Viewport controls */}
              <div className="flex items-center gap-0.5 p-0.5 bg-background rounded-md border border-border">
                {([
                  { key: 'mobile' as const, icon: Smartphone, label: '375px' },
                  { key: 'tablet' as const, icon: Tablet, label: '768px' },
                  { key: 'desktop' as const, icon: MonitorIcon, label: '100%' },
                ]).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setViewport(key)}
                    title={`${key} (${label})`}
                    className={`p-1 rounded transition-colors ${
                      viewport === key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {isFullscreen
                  ? <Minimize2 className="h-3.5 w-3.5" />
                  : <Maximize2 className="h-3.5 w-3.5" />
                }
              </button>
            </div>

            {/* iframe with viewport sizing */}
            <div className={`bg-muted/30 flex justify-center ${isFullscreen ? 'h-[calc(100vh-36px)]' : ''}`}>
              <iframe
                ref={iframeRef}
                src={`/preview${screen.route}`}
                className="border-0 bg-background transition-all duration-300"
                style={{
                  width: viewportWidths[viewport],
                  height: isFullscreen ? '100%' : '600px',
                  maxWidth: '100%',
                  ...(viewport !== 'desktop' ? { boxShadow: '0 0 0 1px var(--border)' } : {}),
                }}
                title={`Preview: ${screen.name}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schema-based Mockup (fallback) */}
      {!showPreview && (
        <ActionContext.Provider value={{ selected, onActionClick: handleActionClick }}>
          {screen.ui ? (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Click any button to see its complete workflow
                </span>
              </div>
              <ScreenMockup
                ui={screen.ui}
                screenName={screen.name}
                route={screen.route}
                onNavigate={onNavigate}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Monitor className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No UI data defined — run /x1 enrich to generate mockup
              </p>
            </div>
          )}
        </ActionContext.Provider>
      )}

      {/* Workflow Panel — shows when an action is selected */}
      {selected && (
        <WorkflowPanel
          selected={selected}
          targetDialog={targetDialog}
          targetScreen={targetScreen}
          screen={screen}
          onClose={() => setSelected(null)}
          onNavigate={onNavigate}
        />
      )}

      {/* Dependencies */}
      {screen.dependsOn && screen.dependsOn.length > 0 && plan && (
        <DependenciesSection dependsOn={screen.dependsOn} plan={plan} onNavigate={onNavigate} />
      )}

      {/* Components */}
      {screen.components.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Components
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {screen.components.length}
              </span>
            </h4>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {screen.components.map((comp) => (
              <Badge key={comp} variant="secondary" className="font-mono text-xs">
                {comp}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Roles */}
      {screen.roles.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Allowed Roles</h4>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {screen.roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* App Flow Logic */}
      {screen.appFlows && screen.appFlows.length > 0 && (
        <AppFlowSection flows={screen.appFlows} />
      )}

      {/* Legacy Tests (shown only if no appFlows exist) */}
      {(!screen.appFlows || screen.appFlows.length === 0) && screen.tests && screen.tests.length > 0 && (
        <TestsSection tests={screen.tests} />
      )}
    </div>
  )
}

// =========================================================
// WORKFLOW PANEL — The detailed strategy view for an action
// =========================================================

function WorkflowPanel({
  selected,
  targetDialog,
  targetScreen,
  screen,
  onClose,
  onNavigate,
}: {
  selected: SelectedAction
  targetDialog: UIDialog | null
  targetScreen: { screen: PlanScreen; module: PlanModule } | null
  screen: PlanScreen
  onClose: () => void
  onNavigate?: (route: string) => void
}) {
  const { action, context } = selected

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary">
            {actionTypeIcons[action.action] ?? <MousePointerClick className="h-3.5 w-3.5" />}
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">{action.label}</span>
            <span className="text-xs text-muted-foreground ml-2">in {context}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Step 1: What happens on click */}
        <WorkflowStep
          number={1}
          title="On Click"
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
        >
          <p className="text-sm text-foreground">
            {action.action === 'navigate' && (action.target ? `Navigates to ${action.target}` : 'Navigates to another page')}
            {action.action === 'dialog' && `Opens "${targetDialog?.title ?? action.target ?? 'a'}" dialog`}
            {action.action === 'api-call' && (action.endpoint ? `Makes API call to ${action.endpoint}` : (action.description || 'Triggers an action'))}
            {action.action === 'submit' && (action.endpoint ? `Submits form to ${action.endpoint}` : 'Submits form data')}
            {action.action === 'confirm-delete' && 'Shows confirmation prompt before deleting'}
            {action.action === 'download' && 'Downloads the file'}
            {action.action === 'toggle' && 'Toggles the state'}
          </p>
          {action.condition?.role && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield className="h-3 w-3 text-warning" />
              <span className="text-xs text-warning">
                Only visible to: {action.condition.role.join(', ')}
              </span>
            </div>
          )}
        </WorkflowStep>

        {/* Step 2: Validation / Pre-conditions (for forms/api-calls) */}
        {(action.action === 'submit' || action.action === 'api-call' || action.action === 'confirm-delete') && (
          <WorkflowStep
            number={2}
            title="Validation"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          >
            {action.action === 'confirm-delete' ? (
              <p className="text-sm text-foreground">
                User sees a confirmation dialog: &quot;Are you sure?&quot; with Cancel and Confirm buttons.
              </p>
            ) : (
              <p className="text-sm text-foreground">
                All required fields are validated. Invalid fields show inline error messages. Form submission is blocked until validation passes.
              </p>
            )}
          </WorkflowStep>
        )}

        {/* Step 3: API Call details */}
        {(action.endpoint || action.action === 'submit') && (
          <WorkflowStep
            number={action.action === 'confirm-delete' || action.action === 'submit' ? 3 : 2}
            title="API Call"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
          >
            {action.endpoint && (
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="text-[10px] font-mono h-5">
                  {inferMethod(action)}
                </Badge>
                <code className="text-xs font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                  {action.endpoint}
                </code>
              </div>
            )}
            {action.description && (
              <p className="text-sm text-muted-foreground">{action.description}</p>
            )}
          </WorkflowStep>
        )}

        {/* Step for navigate actions: where it goes */}
        {action.action === 'navigate' && (
          <WorkflowStep
            number={2}
            title="Destination"
            icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
          >
            {targetScreen ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: targetScreen.module.color }} />
                  <span className="text-sm font-medium text-foreground">{targetScreen.screen.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{targetScreen.screen.description}</p>
                <code className="text-[10px] font-mono text-muted-foreground">{targetScreen.screen.route}</code>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(targetScreen.screen.route)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    View this screen <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div>
                <code className="text-xs font-mono text-foreground">{action.target}</code>
                {action.description && (
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                )}
              </div>
            )}
          </WorkflowStep>
        )}

        {/* Dialog details: fields and submit */}
        {action.action === 'dialog' && targetDialog && (
          <WorkflowStep
            number={2}
            title="Dialog Content"
            icon={<FormInput className="h-3.5 w-3.5" />}
          >
            <div className="space-y-3">
              {targetDialog.description && (
                <p className="text-sm text-muted-foreground">{targetDialog.description}</p>
              )}

              {/* Dialog fields */}
              {targetDialog.fields && targetDialog.fields.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Form Fields
                  </p>
                  <div className="rounded-lg border border-border bg-background overflow-hidden">
                    {targetDialog.fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center gap-2 px-3 py-1.5 border-b border-border last:border-b-0 text-xs"
                      >
                        <span className="font-mono text-foreground flex-1">{field.label || field.name}</span>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                          {field.type}
                        </Badge>
                        {field.required && (
                          <span className="text-destructive text-[9px] font-medium">required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dialog submit action */}
              {targetDialog.submitAction && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Send className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-foreground">{targetDialog.submitAction.label}</span>
                  </div>
                  {targetDialog.submitAction.endpoint && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono h-5">
                        {inferMethod(targetDialog.submitAction)}
                      </Badge>
                      <code className="text-[10px] font-mono text-muted-foreground">
                        {targetDialog.submitAction.endpoint}
                      </code>
                    </div>
                  )}
                  {targetDialog.submitAction.description && (
                    <p className="text-xs text-muted-foreground">{targetDialog.submitAction.description}</p>
                  )}
                </div>
              )}
            </div>
          </WorkflowStep>
        )}

        {/* UI Transition — what changes on screen */}
        <WorkflowStep
          number="→"
          title="UI Transition"
          icon={<Eye className="h-3.5 w-3.5" />}
        >
          <p className="text-sm text-muted-foreground">
            {action.action === 'navigate' && 'Page transitions to the target route. Current screen unloads.'}
            {action.action === 'dialog' && 'A modal dialog slides in from center. Background is dimmed. User fills the form and submits or cancels.'}
            {action.action === 'submit' && 'Loading spinner shows on the submit button. On success: toast notification appears and data refreshes. On error: inline error messages display.'}
            {action.action === 'api-call' && 'Loading state activates on the button. On success: data refreshes and toast notification shows. On error: error toast displays.'}
            {action.action === 'confirm-delete' && 'Confirmation dialog appears. If confirmed: item is removed from the list with animation. Success toast shows. If cancelled: dialog closes, no changes.'}
            {action.action === 'download' && 'Browser download starts. No page transition.'}
            {action.action === 'toggle' && 'The toggle switches state immediately. An API call saves the new state in the background.'}
          </p>
        </WorkflowStep>

        {/* Description — the enriched description from plan.json */}
        {action.description && !action.endpoint && action.action !== 'navigate' && (
          <WorkflowStep
            number="ℹ"
            title="Details"
            icon={<Monitor className="h-3.5 w-3.5" />}
          >
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </WorkflowStep>
        )}
      </div>
    </div>
  )
}

function WorkflowStep({
  number,
  title,
  icon,
  children,
}: {
  number: number | string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

function inferMethod(action: UIAction): string {
  if (!action.endpoint) return 'POST'
  const ep = action.endpoint.toLowerCase()
  if (action.action === 'confirm-delete') return 'DELETE'
  if (ep.includes('{id}') && action.action === 'submit') return 'PUT'
  if (action.label?.toLowerCase().includes('delete')) return 'DELETE'
  if (action.label?.toLowerCase().includes('update') || action.label?.toLowerCase().includes('save')) return 'PUT'
  return 'POST'
}

// =========================================================
// SUB-COMPONENTS
// =========================================================

function AppFlowSection({ flows }: { flows: AppFlow[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">
          App Flow Logic
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {flows.length} flows
          </span>
        </h4>
      </div>
      <div className="divide-y divide-border">
        {flows.map((flow) => {
          const isOpen = openIds.has(flow.id)
          return (
            <div key={flow.id}>
              {/* Flow header — click to expand */}
              <button
                onClick={() => toggle(flow.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
              >
                <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{flow.name}</span>
                  <p className="text-xs text-muted-foreground truncate">{flow.trigger}</p>
                </div>
                <span className={`text-[10px] shrink-0 ${testPriorityColors[flow.priority]}`}>
                  {flow.priority}
                </span>
              </button>

              {/* Flow detail — expanded */}
              {isOpen && (
                <div className="px-4 pb-4 pl-10 animate-in slide-in-from-top-1 duration-150">
                  {/* Steps with layer indicators */}
                  <div className="space-y-0">
                    {flow.steps.map((step, i) => {
                      const layer = layerConfig[step.layer] ?? layerConfig.external
                      const isLast = i === flow.steps.length - 1
                      return (
                        <div key={i} className="flex gap-3">
                          {/* Timeline */}
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full ${layer.bg} flex items-center justify-center shrink-0`}>
                              <span className={`text-[8px] font-bold ${layer.color}`}>{layer.label}</span>
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border min-h-[12px]" />}
                          </div>
                          {/* Content */}
                          <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-2'}`}>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Outcome */}
                  <div className="mt-3 rounded-lg border border-success/20 bg-success/5 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                      <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Outcome</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{flow.outcome}</p>
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

function TestsSection({ tests }: { tests: PlanTest[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Categorize steps into flow phases for natural language display
  const categorizeStep = (action: string): { icon: React.ReactNode; color: string } => {
    const a = action.toLowerCase()
    if (a.includes('assert') || a.includes('verify') || a.includes('check'))
      return { icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-success' }
    if (a.includes('api') || a.includes('fetch') || a.includes('request'))
      return { icon: <ExternalLink className="h-3 w-3" />, color: 'text-info' }
    if (a.includes('click') || a.includes('submit') || a.includes('trigger'))
      return { icon: <MousePointerClick className="h-3 w-3" />, color: 'text-primary' }
    if (a.includes('navigate') || a.includes('load') || a.includes('visit'))
      return { icon: <ArrowRight className="h-3 w-3" />, color: 'text-muted-foreground' }
    if (a.includes('wait') || a.includes('observe'))
      return { icon: <Eye className="h-3 w-3" />, color: 'text-warning' }
    return { icon: <Circle className="h-3 w-3" />, color: 'text-muted-foreground' }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">
          App Flow Logic
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {tests.length}
          </span>
        </h4>
      </div>
      <div className="divide-y divide-border">
        {tests.map((test) => {
          const isOpen = openIds.has(test.id)
          return (
            <div key={test.id}>
              <button
                onClick={() => toggle(test.id)}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted/30 transition-colors text-left"
              >
                <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                <span className="text-sm font-medium text-foreground flex-1">{test.name}</span>
                <span className={`text-[10px] ${testPriorityColors[test.priority]}`}>
                  {test.priority}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 pl-6 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  {test.steps.map((step) => {
                    const { icon, color } = categorizeStep(step.action)
                    return (
                      <div key={step.order} className="flex items-start gap-2 text-xs">
                        <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
                        <span className="text-muted-foreground">{step.description}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DependenciesSection({
  dependsOn,
  plan,
  onNavigate,
}: {
  dependsOn: string[]
  plan: PlanRegistry
  onNavigate?: (route: string) => void
}) {
  const deps = dependsOn.map((depId) => {
    for (const mod of plan.modules) {
      const screen = mod.screens.find((s) => s.id === depId)
      if (screen) return { screen, module: mod }
    }
    return null
  }).filter(Boolean) as { screen: PlanScreen; module: PlanModule }[]

  if (deps.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">
          Dependencies
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {deps.length}
          </span>
        </h4>
      </div>
      <div className="divide-y divide-border">
        {deps.map(({ screen: dep, module: depMod }) => (
          <button
            key={dep.id}
            onClick={() => onNavigate?.(dep.route)}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: depMod.color }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-foreground">{dep.name}</span>
              <p className="text-xs text-muted-foreground font-mono">{dep.route}</p>
            </div>
            <Badge className={priorityColors[dep.priority]}>
              {dep.priority}
            </Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  )
}
