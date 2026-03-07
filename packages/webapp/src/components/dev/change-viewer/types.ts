// Types for change set data

export interface ChangeSet {
  date: string
  app: string
  version: string
  createdAt: string
  status: string
  summary: string
  changes: Change[]
  executionOrder: string[]
  totalTests: number
}

export interface Change {
  id: string
  type: ChangeType
  title: string
  description: string
  affectedScreens: string[]
  affectedEndpoints: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: string
  source?: ChangeSource
  ui?: ChangeUI
  tests: ChangeTest[]
  dependsOn: string[]
  instructions: string[]
}

export type ChangeType =
  | 'fix'
  | 'new-feature'
  | 'modify-screen'
  | 'new-screen'
  | 'new-endpoint'
  | 'modify-endpoint'
  | 'new-flow'

export interface ChangeSource {
  type: 'ecosystem' | 'app-only'
  rootChangeSet?: string
  ecosystemChangeId?: string
}

export interface ChangeUI {
  before?: ChangeUIMockup
  after: ChangeUIMockup
  highlights?: string[]
}

export interface ChangeUIMockup {
  sections: ChangeUISection[]
}

export interface ChangeUISection {
  type: string
  title: string
  fields?: ChangeUIField[]
}

export interface ChangeUIField {
  label: string
  type: string
  description?: string
}

export interface ChangeTest {
  id: string
  name: string
  type: 'ui' | 'api' | 'integration'
  priority: 'critical' | 'high' | 'medium' | 'low'
  steps: ChangeTestStep[]
}

export interface ChangeTestStep {
  order: number
  action: string
  target: string
  value?: string
  description: string
}

// Color maps

export const changeTypeColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'fix': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', label: 'Fix' },
  'new-feature': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', label: 'Feature' },
  'modify-screen': { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', label: 'Modify' },
  'new-screen': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'New Screen' },
  'new-endpoint': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Endpoint' },
  'modify-endpoint': { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', label: 'Modify EP' },
  'new-flow': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', label: 'Flow' },
}

export const priorityColors: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  medium: 'bg-info/10 text-info border-info/20',
  low: 'bg-muted text-muted-foreground border-border',
}
