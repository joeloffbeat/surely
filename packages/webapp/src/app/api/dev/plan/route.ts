/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

// GET — Serve the plan, supporting split-format (manifest + modules/*.json)
// Checks repo-root docs/plan/ first (rich data), falls back to local docs/plan/
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    // Try repo-root docs/plan/ first (packages/webapp/../../docs/plan)
    const repoRoot = path.join(process.cwd(), '..', '..')
    const rootPlanDir = path.join(repoRoot, 'docs', 'plan')
    const localPlanDir = path.join(process.cwd(), 'docs', 'plan')

    let planDir = localPlanDir
    try {
      await readFile(path.join(rootPlanDir, 'plan.json'), 'utf-8')
      planDir = rootPlanDir
    } catch {
      // fall back to local
    }

    const raw = await readFile(path.join(planDir, 'plan.json'), 'utf-8')
    const manifest = JSON.parse(raw)

    // Support split format: modules/*.json
    const modulesDir = path.join(planDir, 'modules')
    let mergedModules = manifest.modules || []

    try {
      const moduleFiles = await readdir(modulesDir)
      const moduleData = await Promise.all(
        moduleFiles
          .filter((f: string) => f.endsWith('.json'))
          .map(async (f: string) => {
            const content = await readFile(path.join(modulesDir, f), 'utf-8')
            return JSON.parse(content)
          })
      )

      // Sort to match manifest order
      const manifestOrder = (manifest.modules || []).map((m: any) => m.id)
      moduleData.sort((a: any, b: any) => {
        const ai = manifestOrder.indexOf(a.id)
        const bi = manifestOrder.indexOf(b.id)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })

      mergedModules = moduleData.map((mod: any) => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        color: mod.color,
        icon: mod.icon,
        screens: (mod.screens || []).map((s: any) => ({
          ...s,
          components: s.components || [],
          roles: s.roles || [],
          priority: s.priority || 'medium',
          ui: normalizeUI(s.screenUI || s.ui),
          states: s.states,
        })),
        apiEndpoints: (mod.apiEndpoints || []).map((e: any) => ({
          ...e,
          path: e.route || e.path,
          auth: e.auth !== 'none' && e.auth !== false,
          roles: e.roles || [],
        })),
        dbTables: (mod.dbTables || []).map((t: any) => ({
          ...t,
          columns: (t.columns || []).map((c: any) =>
            typeof c === 'string' ? { name: c, type: 'unknown' } : c
          ),
          relations: t.relations || [],
        })),
      }))
    } catch {
      // No modules dir — use inline modules
    }

    function normalizeAction(a: any): any {
      if (!a || typeof a !== 'object') return a
      const n = { ...a }
      if (a.navigateTo && !a.action) { n.action = 'navigate'; n.target = a.navigateTo; delete n.navigateTo }
      if (a.triggers && !a.action) {
        const parts = a.triggers.split(' ')
        n.action = 'submit'
        n.endpoint = parts.length > 1 ? parts.slice(1).join(' ') : a.triggers
        delete n.triggers
      }
      if (!n.action) n.action = n.target ? 'navigate' : 'api-call'
      return n
    }

    function normalizeUI(ui: any): any {
      if (!ui) return ui
      const n = { ...ui }
      if (ui.actions) n.actions = ui.actions.map(normalizeAction)
      if (ui.sections) {
        n.sections = ui.sections.map((s: any) => {
          const ns = { ...s }
          if (s.actions) ns.actions = s.actions.map(normalizeAction)
          if (s.rowActions) ns.rowActions = s.rowActions.map(normalizeAction)
          if (s.submitAction) ns.submitAction = normalizeAction(s.submitAction)
          if (s.cancelAction) ns.cancelAction = normalizeAction(s.cancelAction)
          if (s.cards) ns.cards = s.cards.map((c: any) => ({ ...c, actions: c.actions?.map(normalizeAction) }))
          if (s.type === 'tabs' && s.tabs) {
            ns.tabs = s.tabs.map((t: any) => ({
              ...t,
              content: t.content ? normalizeUI({ sections: t.content }).sections : t.content,
            }))
          }
          return ns
        })
      }
      if (ui.dialogs) {
        n.dialogs = ui.dialogs.map((d: any) => ({
          ...d,
          submitAction: d.submitAction ? normalizeAction(d.submitAction) : undefined,
        }))
      }
      return n
    }

    const plan = {
      app: typeof manifest.app === 'object' ? manifest.app.name : manifest.app,
      version: typeof manifest.app === 'object' ? manifest.app.version : (manifest.version || '0.1.0'),
      generatedAt: manifest.generatedAt || new Date().toISOString(),
      description: typeof manifest.app === 'object' ? manifest.app.description : (manifest.description || ''),
      techStack: typeof manifest.app === 'object' ? manifest.app.techStack : (manifest.techStack || {}),
      modules: mergedModules,
      flows: manifest.flows || [],
      infrastructure: manifest.infrastructure,
      fileStructure: manifest.fileStructure || {},
    }

    return NextResponse.json(plan)
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'plan.json not found. Run /x1.5 or /z1 to generate it.' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to read plan', details: error?.message },
      { status: 500 }
    )
  }
}
