'use client'

import { ArrowLeft } from 'lucide-react'
import { MockupAction } from '../MockupAction'
import type { UIHeaderSection } from '@/lib/plan-registry'

interface MockupHeaderProps {
  section: UIHeaderSection
  onNavigate?: (route: string) => void
}

export function MockupHeader({ section, onNavigate }: MockupHeaderProps) {
  return (
    <div className="px-6 py-4 bg-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {section.backLink && (
            <button
              onClick={() => onNavigate?.(section.backLink!)}
              className="shrink-0 w-8 h-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {section.subtitle}
              </p>
            )}
          </div>
        </div>
        {section.actions && section.actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {section.actions.map((action, i) => (
              <MockupAction key={i} action={action} context="Header" onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
