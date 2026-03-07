'use client'

import { ScreenMockup } from '@/components/dev/plan-viewer/mockup/ScreenMockup'
import type { ScreenUI, UISection, UIFormField } from '@/lib/plan-registry'
import type { ChangeUIMockup, ChangeUISection, ChangeUIField } from './types'

interface ChangeMockupProps {
  mockup: ChangeUIMockup
  title: string
}

/**
 * Adapts the simplified change UI format into the full ScreenUI
 * format that ScreenMockup understands, then renders it.
 */
export function ChangeMockup({ mockup, title }: ChangeMockupProps) {
  const screenUI = adaptToScreenUI(mockup)

  if (!screenUI) {
    return <SimplifiedMockup mockup={mockup} title={title} />
  }

  return (
    <ScreenMockup
      ui={screenUI}
      screenName={title}
      route={`/changes`}
    />
  )
}

function adaptToScreenUI(mockup: ChangeUIMockup): ScreenUI | null {
  if (!mockup.sections || mockup.sections.length === 0) return null

  const sections: UISection[] = []
  let layout: ScreenUI['layout'] = 'page-with-header'

  for (const section of mockup.sections) {
    const adapted = adaptSection(section)
    if (adapted) {
      sections.push(adapted)
      // Infer layout from first section type
      if (section.type === 'form') layout = 'form'
      else if (section.type === 'detail') layout = 'detail'
    }
  }

  if (sections.length === 0) return null

  return { layout, sections }
}

function adaptSection(section: ChangeUISection): UISection | null {
  switch (section.type) {
    case 'form':
      return adaptFormSection(section)
    case 'detail':
      return adaptDetailSection(section)
    case 'data-table':
      return adaptTableSection(section)
    case 'timeline':
      return adaptTimelineSection(section)
    default:
      // For unknown types, try to render as detail card
      if (section.fields && section.fields.length > 0) {
        return adaptDetailSection(section)
      }
      return null
  }
}

function adaptFormSection(section: ChangeUISection): UISection {
  const fields: UIFormField[] = (section.fields ?? []).map((f) => ({
    name: f.label.toLowerCase().replace(/\s+/g, '_'),
    label: f.label,
    type: mapFieldType(f.type),
    placeholder: f.description,
  }))

  return {
    type: 'form',
    title: section.title,
    fields,
    submitAction: {
      label: 'Save',
      variant: 'primary',
      action: 'submit',
    },
  }
}

function adaptDetailSection(section: ChangeUISection): UISection {
  return {
    type: 'detail-card',
    title: section.title,
    fields: (section.fields ?? []).map((f) => ({
      label: f.label,
      value: f.description ?? f.type,
      type: mapDetailFieldType(f.type),
    })),
  }
}

function adaptTableSection(section: ChangeUISection): UISection {
  return {
    type: 'data-table',
    columns: (section.fields ?? []).map((f) => ({
      key: f.label.toLowerCase().replace(/\s+/g, '_'),
      label: f.label,
      type: 'text' as const,
    })),
    pagination: true,
  }
}

function adaptTimelineSection(section: ChangeUISection): UISection {
  return {
    type: 'timeline',
    title: section.title,
    items: (section.fields ?? []).map((f) => ({
      label: f.label,
      description: f.description,
    })),
  }
}

function mapFieldType(type: string): UIFormField['type'] {
  const mapping: Record<string, UIFormField['type']> = {
    text: 'text',
    email: 'email',
    password: 'password',
    textarea: 'textarea',
    select: 'select',
    date: 'date',
    number: 'number',
    currency: 'currency',
    checkbox: 'checkbox',
    file: 'file',
    phone: 'phone',
    toggle: 'toggle',
    button: 'text',
    badge: 'text',
    timeline: 'text',
  }
  return mapping[type] ?? 'text'
}

function mapDetailFieldType(type: string): 'text' | 'badge' | 'currency' | 'date' | 'link' | 'email' | 'phone' {
  const mapping: Record<string, 'text' | 'badge' | 'currency' | 'date' | 'link' | 'email' | 'phone'> = {
    badge: 'badge',
    currency: 'currency',
    date: 'date',
    link: 'link',
    email: 'email',
    phone: 'phone',
  }
  return mapping[type] ?? 'text'
}

/**
 * Fallback renderer when change data is too simplified for ScreenMockup.
 */
function SimplifiedMockup({ mockup, title }: { mockup: ChangeUIMockup; title: string }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        {mockup.sections.map((section, i) => (
          <div key={i} className="rounded-lg border border-dashed border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground">{section.title}</h4>
            {section.fields && (
              <div className="space-y-1.5">
                {section.fields.map((field, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    <span className="text-[10px] font-medium text-foreground">{field.label}</span>
                    <span className="text-[9px] text-muted-foreground">({field.type})</span>
                    {field.description && (
                      <span className="text-[9px] text-muted-foreground/70 truncate">
                        — {field.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
