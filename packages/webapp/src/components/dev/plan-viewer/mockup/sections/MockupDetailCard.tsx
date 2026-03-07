'use client'

import { Badge } from '@/components/ui/badge'
import type { UIDetailCardSection } from '@/lib/plan-registry'

interface MockupDetailCardProps {
  section: UIDetailCardSection
}

export function MockupDetailCard({ section }: MockupDetailCardProps) {
  return (
    <div className="px-6 py-4">
      <div className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
        {section.title && (
          <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
        )}
        <div className="space-y-3">
          {section.fields.map((field, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {field.label}
              </span>
              <DetailValue type={field.type} value={field.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailValue({ type, value }: { type?: string; value: string }) {
  switch (type) {
    case 'badge':
      return (
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
          {value}
        </Badge>
      )
    case 'currency':
      return <span className="text-sm font-mono font-semibold text-foreground">{value}</span>
    case 'link':
      return <span className="text-sm text-primary hover:underline cursor-pointer">{value}</span>
    case 'email':
      return <span className="text-sm text-primary">{value}</span>
    case 'phone':
      return <span className="text-sm font-mono text-foreground">{value}</span>
    case 'date':
      return <span className="text-sm text-muted-foreground">{value}</span>
    default:
      return <span className="text-sm font-medium text-foreground text-right">{value}</span>
  }
}
