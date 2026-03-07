'use client'

import { Badge } from '@/components/ui/badge'
import { MockupAction } from '../MockupAction'
import type { UICardsGridSection } from '@/lib/plan-registry'

interface MockupCardsGridProps {
  section: UICardsGridSection
  onNavigate?: (route: string) => void
}

export function MockupCardsGrid({ section, onNavigate }: MockupCardsGridProps) {
  const cols = section.columns ?? Math.min(section.cards.length, 3)

  return (
    <div className="px-6 py-4">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {section.cards.map((card, i) => (
          <div
            key={i}
            className={`rounded-lg border border-border bg-card p-4 shadow-sm space-y-3 transition-all ${
              card.navigateTo ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : ''
            }`}
            onClick={() => card.navigateTo && onNavigate?.(card.navigateTo)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {card.title}
                </h4>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{card.subtitle}</p>
                )}
              </div>
              {card.badge && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 shrink-0 bg-primary/10 text-primary border-primary/30">
                  {card.badge.label}
                </Badge>
              )}
            </div>

            {card.fields && card.fields.length > 0 && (
              <div className="space-y-1.5">
                {card.fields.slice(0, 3).map((field, fi) => (
                  <div key={fi} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{field.label}</span>
                    <span className="text-foreground font-medium">{field.value}</span>
                  </div>
                ))}
              </div>
            )}

            {card.actions && card.actions.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                {card.actions.map((action, ai) => (
                  <MockupAction key={ai} action={action} context={`Card: ${card.title}`} onNavigate={onNavigate} size="xs" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
