// ============================================================
// Flow Registry Schema — generic template
// ============================================================
// Structured flow data for coverage tracking, visualization,
// and the /flow skill. Every flow case maps to a real feature
// with concrete steps and pass criteria.
// ============================================================

// === Core Registry ===

export interface FlowRegistry {
  app: string // app identifier string
  version: string // schema version "1.0.0"
  generatedAt: string // ISO timestamp
  modules: FlowModule[]
}

export interface FlowModule {
  id: string // "auth" | "sales" | "hr" | "messaging" | "notifications"
  name: string // "Authentication"
  icon: string // Lucide icon name for visualization
  color: string // Hex color for charts
  features: FlowFeature[]
}

export interface FlowFeature {
  id: string // "auth.login"
  name: string // "User Login"
  description: string
  flows: FlowCase[]
}

export interface FlowCase {
  id: string // "auth.login.valid-credentials"
  name: string // "Login with valid credentials"
  type: "ui" | "api" | "e2e" // Flow type
  priority: "critical" | "high" | "medium" | "low"
  roles: string[] // ["admin","sales_lead","sales_member"] or ["*"]
  route?: string // "/auth/login" (UI flows)
  endpoint?: string // "/api/auth/me" (API flows)
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  dependencies?: string[] // Flow IDs that must pass first
  tags?: string[] // ["smoke","regression","crud","wizard"]
  steps: FlowStep[]
  passCriteria: PassCriterion[]
  // Runtime state (updated by /flow skill)
  status: FlowStatus
  lastRun?: FlowRunResult
}

export type FlowStatus = "untested" | "passing" | "failing" | "skipped" | "flaky"
export type FlowType = "ui" | "api" | "e2e"
export type Priority = "critical" | "high" | "medium" | "low"

export type StepAction =
  | "navigate"
  | "click"
  | "fill"
  | "select"
  | "upload"
  | "wait"
  | "assert"
  | "api_call"
  | "screenshot"
  | "drag"
  | "hover"
  | "keyboard"

export interface FlowStep {
  order: number
  action: StepAction
  target: string // CSS selector, URL, or API path
  value?: string // Input value or expected text
  description: string // Human-readable: "Enter email address"
}

export type CriterionType =
  | "url"
  | "visible"
  | "text"
  | "not_visible"
  | "status_code"
  | "response_body"
  | "response_property"
  | "toast"
  | "redirect"
  | "count"
  | "state"
  | "disabled"
  | "enabled"

export interface PassCriterion {
  id: string // "c1"
  description: string // "Redirects to /sales/dashboard"
  type: CriterionType
  expected: string // "/sales/dashboard" | "200" | "> 0"
}

export interface FlowRunResult {
  timestamp: string // ISO
  duration: number // ms
  status: "pass" | "fail" | "error" | "skipped"
  errorMessage?: string
  screenshotPath?: string
  failedCriteria?: string[] // IDs of criteria that failed
  role?: string // Which role ran this flow
}

// === Visualization Types (computed from registry) ===

export interface ModuleSummary {
  moduleId: string
  moduleName: string
  icon: string
  color: string
  total: number
  passing: number
  failing: number
  untested: number
  skipped: number
  flaky: number
  coverage: number // 0-100 percentage
}

export interface FeatureSummary {
  featureId: string
  featureName: string
  moduleId: string
  total: number
  passing: number
  failing: number
  untested: number
  coverage: number
}

export interface CoverageCell {
  featureId: string
  featureName: string
  moduleId: string
  role: string
  hasFlows: boolean
  flowCount: number
  passingCount: number
  failingCount: number
  untestedCount: number
  status: "passing" | "failing" | "untested" | "mixed" | "no_flows"
}

export interface DependencyEdge {
  from: string // flow ID
  to: string // depends-on flow ID
}

export interface PriorityDistribution {
  critical: number
  high: number
  medium: number
  low: number
}

export interface TypeDistribution {
  ui: number
  api: number
  e2e: number
}

// === Utility functions for computing visualization data ===

export function computeModuleSummaries(registry: FlowRegistry): ModuleSummary[] {
  return registry.modules.map((mod) => {
    const allFlows = mod.features.flatMap((f) => f.flows)
    const passing = allFlows.filter((t) => t.status === "passing").length
    const failing = allFlows.filter((t) => t.status === "failing").length
    const untested = allFlows.filter((t) => t.status === "untested").length
    const skipped = allFlows.filter((t) => t.status === "skipped").length
    const flaky = allFlows.filter((t) => t.status === "flaky").length
    const total = allFlows.length

    return {
      moduleId: mod.id,
      moduleName: mod.name,
      icon: mod.icon,
      color: mod.color,
      total,
      passing,
      failing,
      untested,
      skipped,
      flaky,
      coverage: total > 0 ? Math.round((passing / total) * 100) : 0,
    }
  })
}

export function computeFeatureSummaries(registry: FlowRegistry): FeatureSummary[] {
  return registry.modules.flatMap((mod) =>
    mod.features.map((feat) => {
      const total = feat.flows.length
      const passing = feat.flows.filter((t) => t.status === "passing").length
      const failing = feat.flows.filter((t) => t.status === "failing").length
      const untested = feat.flows.filter((t) => t.status === "untested").length

      return {
        featureId: feat.id,
        featureName: feat.name,
        moduleId: mod.id,
        total,
        passing,
        failing,
        untested,
        coverage: total > 0 ? Math.round((passing / total) * 100) : 0,
      }
    })
  )
}

export function computeCoverageMatrix(
  registry: FlowRegistry,
  roles: string[]
): CoverageCell[] {
  const cells: CoverageCell[] = []

  for (const mod of registry.modules) {
    for (const feat of mod.features) {
      for (const role of roles) {
        const roleFlows = feat.flows.filter(
          (t) => t.roles.includes("*") || t.roles.includes(role)
        )
        const passingCount = roleFlows.filter((t) => t.status === "passing").length
        const failingCount = roleFlows.filter((t) => t.status === "failing").length
        const untestedCount = roleFlows.filter((t) => t.status === "untested").length

        let status: CoverageCell["status"] = "no_flows"
        if (roleFlows.length > 0) {
          if (failingCount > 0) status = "failing"
          else if (untestedCount > 0 && passingCount > 0) status = "mixed"
          else if (passingCount === roleFlows.length) status = "passing"
          else status = "untested"
        }

        cells.push({
          featureId: feat.id,
          featureName: feat.name,
          moduleId: mod.id,
          role,
          hasFlows: roleFlows.length > 0,
          flowCount: roleFlows.length,
          passingCount,
          failingCount,
          untestedCount,
          status,
        })
      }
    }
  }

  return cells
}

export function computeDependencyEdges(registry: FlowRegistry): DependencyEdge[] {
  const edges: DependencyEdge[] = []

  for (const mod of registry.modules) {
    for (const feat of mod.features) {
      for (const flow of feat.flows) {
        if (flow.dependencies) {
          for (const dep of flow.dependencies) {
            edges.push({ from: flow.id, to: dep })
          }
        }
      }
    }
  }

  return edges
}

export function computePriorityDistribution(registry: FlowRegistry): PriorityDistribution {
  const allFlows = registry.modules.flatMap((m) => m.features.flatMap((f) => f.flows))
  return {
    critical: allFlows.filter((t) => t.priority === "critical").length,
    high: allFlows.filter((t) => t.priority === "high").length,
    medium: allFlows.filter((t) => t.priority === "medium").length,
    low: allFlows.filter((t) => t.priority === "low").length,
  }
}

export function computeTypeDistribution(registry: FlowRegistry): TypeDistribution {
  const allFlows = registry.modules.flatMap((m) => m.features.flatMap((f) => f.flows))
  return {
    ui: allFlows.filter((t) => t.type === "ui").length,
    api: allFlows.filter((t) => t.type === "api").length,
    e2e: allFlows.filter((t) => t.type === "e2e").length,
  }
}

export function getTotalStats(registry: FlowRegistry) {
  const allFlows = registry.modules.flatMap((m) => m.features.flatMap((f) => f.flows))
  const total = allFlows.length
  const passing = allFlows.filter((t) => t.status === "passing").length
  const failing = allFlows.filter((t) => t.status === "failing").length
  const untested = allFlows.filter((t) => t.status === "untested").length
  const skipped = allFlows.filter((t) => t.status === "skipped").length
  const flaky = allFlows.filter((t) => t.status === "flaky").length

  return {
    total,
    passing,
    failing,
    untested,
    skipped,
    flaky,
    coverage: total > 0 ? Math.round((passing / total) * 100) : 0,
  }
}
