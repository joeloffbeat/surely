'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe, Shield } from 'lucide-react'
import { SectionRenderer } from './SectionRenderer'
import type { ScreenUI } from '@/lib/plan-registry'

interface ScreenMockupProps {
  ui: ScreenUI
  screenName: string
  route: string
  onNavigate?: (route: string) => void
}

function collectRoles(ui: ScreenUI): string[] {
  const roles = new Set<string>()
  for (const section of ui.sections) {
    if (section.condition?.role) {
      section.condition.role.forEach((r) => roles.add(r))
    }
    if (section.type === 'tabs') {
      for (const tab of section.tabs) {
        if (tab.condition?.role) {
          tab.condition.role.forEach((r) => roles.add(r))
        }
      }
    }
  }
  if (ui.dialogs) {
    for (const dialog of ui.dialogs) {
      if (dialog.sections) {
        for (const section of dialog.sections) {
          if (section.condition?.role) {
            section.condition.role.forEach((r) => roles.add(r))
          }
        }
      }
    }
  }
  return Array.from(roles).sort()
}

export function ScreenMockup({ ui, screenName, route, onNavigate }: ScreenMockupProps) {
  const allRoles = collectRoles(ui)
  const [activeRole, setActiveRole] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {/* Role toggle */}
      {allRoles.length > 0 && (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">View as:</span>
          <Select
            value={activeRole ?? '__all__'}
            onValueChange={(v) => setActiveRole(v === '__all__' ? null : v)}
          >
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All roles</SelectItem>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Browser frame */}
      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-warning/60" />
            <div className="w-3 h-3 rounded-full bg-success/60" />
          </div>
          <div className="flex-1 flex items-center gap-2 mx-4">
            <div className="flex-1 flex items-center gap-2 h-8 px-3 rounded-lg bg-background border border-border text-sm">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-mono text-xs truncate">
                localhost:3013{route}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs h-6 px-2 shrink-0">
            {ui.layout}
          </Badge>
        </div>

        {/* Page content */}
        <ScrollArea className="h-[600px]">
          <div className="bg-background">
            {ui.sections.map((section, i) => (
              <SectionRenderer
                key={i}
                section={section}
                onNavigate={onNavigate}
                activeRole={activeRole}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs list */}
      {ui.dialogs && ui.dialogs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Dialogs ({ui.dialogs.length})
          </h4>
          <div className="grid gap-3">
            {ui.dialogs.map((dialog) => (
              <DialogPreview
                key={dialog.id}
                dialog={dialog}
                onNavigate={onNavigate}
                activeRole={activeRole}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import type { UIDialog } from '@/lib/plan-registry'

function DialogPreview({
  dialog,
  onNavigate,
  activeRole,
}: {
  dialog: UIDialog
  onNavigate?: (route: string) => void
  activeRole: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
      >
        <div>
          <span className="text-sm font-medium text-foreground">{dialog.title}</span>
          {dialog.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{dialog.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="text-xs px-2 shrink-0">
          {dialog.id}
        </Badge>
      </button>
      {open && dialog.sections && (
        <div className="border-t border-border">
          {dialog.sections.map((section, i) => (
            <SectionRenderer
              key={i}
              section={section}
              onNavigate={onNavigate}
              activeRole={activeRole}
            />
          ))}
        </div>
      )}
    </div>
  )
}
