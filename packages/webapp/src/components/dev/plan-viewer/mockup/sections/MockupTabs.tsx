'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { SectionRenderer } from '../SectionRenderer'
import type { UITabsSection } from '@/lib/plan-registry'

interface MockupTabsProps {
  section: UITabsSection
  onNavigate?: (route: string) => void
  activeRole?: string | null
}

export function MockupTabs({ section, onNavigate, activeRole }: MockupTabsProps) {
  const visibleTabs = section.tabs.filter((tab) => {
    if (!activeRole || !tab.condition?.role) return true
    return tab.condition.role.includes(activeRole)
  })

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id ?? '')
  const currentTab = visibleTabs.find((t) => t.id === activeTab)

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border px-6 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.condition?.role && (
              <Shield className="inline h-3 w-3 ml-1.5 text-muted-foreground/50" />
            )}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {currentTab && (
        <div>
          {currentTab.content.map((childSection, i) => (
            <SectionRenderer
              key={i}
              section={childSection}
              onNavigate={onNavigate}
              activeRole={activeRole}
            />
          ))}
        </div>
      )}
    </div>
  )
}
