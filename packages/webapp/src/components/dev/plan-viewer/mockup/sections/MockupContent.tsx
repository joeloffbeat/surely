'use client'

import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { UIContentSection } from '@/lib/plan-registry'

interface MockupContentProps {
  section: UIContentSection
}

const variantStyles: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  info: {
    icon: <Info className="h-4 w-4 text-info" />,
    bg: 'bg-info/10',
    border: 'border-info/30',
    text: 'text-info',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
  },
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
  },
}

export function MockupContent({ section }: MockupContentProps) {
  const variant = section.variant ? variantStyles[section.variant] : null

  if (variant) {
    return (
      <div className="px-6 py-4">
        <div className={`rounded-lg border ${variant.border} ${variant.bg} p-4 flex items-start gap-3`}>
          <div className="shrink-0 mt-0.5">{variant.icon}</div>
          <div className="min-w-0">
            {section.title && (
              <h4 className={`text-sm font-semibold ${variant.text}`}>
                {section.title}
              </h4>
            )}
            {section.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {section.description}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <div className="rounded-lg border border-border bg-card shadow-sm p-4">
        {section.title && (
          <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
        )}
        {section.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {section.description}
          </p>
        )}
      </div>
    </div>
  )
}
