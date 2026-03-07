'use client'

import { Shield } from 'lucide-react'
import { MockupHeader } from './sections/MockupHeader'
import { MockupStatsGrid } from './sections/MockupStatsGrid'
import { MockupDataTable } from './sections/MockupDataTable'
import { MockupForm } from './sections/MockupForm'
import { MockupTabs } from './sections/MockupTabs'
import { MockupCardsGrid } from './sections/MockupCardsGrid'
import { MockupKanban } from './sections/MockupKanban'
import { MockupCalendar } from './sections/MockupCalendar'
import { MockupDetailCard } from './sections/MockupDetailCard'
import { MockupChart } from './sections/MockupChart'
import { MockupTimeline } from './sections/MockupTimeline'
import { MockupProfileHeader } from './sections/MockupProfileHeader'
import { MockupWizard } from './sections/MockupWizard'
import { MockupContent } from './sections/MockupContent'
import type { UISection } from '@/lib/plan-registry'

interface SectionRendererProps {
  section: UISection
  onNavigate?: (route: string) => void
  activeRole?: string | null
}

export function SectionRenderer({ section, onNavigate, activeRole }: SectionRendererProps) {
  // Filter by role condition
  if (activeRole && section.condition?.role) {
    if (!section.condition.role.includes(activeRole)) {
      return null
    }
  }

  return (
    <div className="relative group/section">
      {/* Role indicator badge */}
      {section.condition?.role && (
        <div className="absolute -right-1 -top-1 z-10 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <div className="flex items-center gap-0.5 bg-popover border border-border rounded px-1 py-0.5 shadow-sm">
            <Shield className="h-2 w-2 text-muted-foreground" />
            <span className="text-[7px] text-muted-foreground">
              {section.condition.role.join(', ')}
            </span>
          </div>
        </div>
      )}

      <SectionContent section={section} onNavigate={onNavigate} activeRole={activeRole} />
    </div>
  )
}

function SectionContent({ section, onNavigate, activeRole }: SectionRendererProps) {
  switch (section.type) {
    case 'header':
      return <MockupHeader section={section} onNavigate={onNavigate} />
    case 'stats-grid':
      return <MockupStatsGrid section={section} />
    case 'data-table':
      return <MockupDataTable section={section} onNavigate={onNavigate} />
    case 'form':
      return <MockupForm section={section} onNavigate={onNavigate} />
    case 'tabs':
      return <MockupTabs section={section} onNavigate={onNavigate} activeRole={activeRole} />
    case 'cards-grid':
      return <MockupCardsGrid section={section} onNavigate={onNavigate} />
    case 'kanban':
      return <MockupKanban section={section} />
    case 'calendar':
      return <MockupCalendar section={section} onNavigate={onNavigate} />
    case 'detail-card':
      return <MockupDetailCard section={section} />
    case 'chart':
      return <MockupChart section={section} />
    case 'timeline':
      return <MockupTimeline section={section} />
    case 'profile-header':
      return <MockupProfileHeader section={section} onNavigate={onNavigate} />
    case 'wizard':
      return <MockupWizard section={section} />
    case 'content':
      return <MockupContent section={section} />
    default:
      return (
        <div className="px-4 py-2">
          <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-2 text-center">
            <span className="text-[9px] text-destructive">
              Unknown section type: {(section as any).type}
            </span>
          </div>
        </div>
      )
  }
}
