'use client'

import { MockupAction } from '../MockupAction'
import type { UIFormSection } from '@/lib/plan-registry'

interface MockupFormProps {
  section: UIFormSection
  onNavigate?: (route: string) => void
}

export function MockupForm({ section, onNavigate }: MockupFormProps) {
  const cols = section.columns ?? 1
  const formContext = section.title ? `Form: ${section.title}` : 'Form'

  return (
    <div className="px-6 py-4 space-y-4">
      {section.title && (
        <div>
          <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
          )}
        </div>
      )}

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {section.fields.map((field) => (
          <div
            key={field.name}
            className={field.gridCols ? `col-span-${field.gridCols}` : ''}
            style={field.gridCols ? { gridColumn: `span ${field.gridCols}` } : undefined}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </label>
              <FieldPlaceholder type={field.type} placeholder={field.placeholder} options={field.options} />
              {field.helperText && (
                <p className="text-xs text-muted-foreground">{field.helperText}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <MockupAction action={section.submitAction} context={formContext} onNavigate={onNavigate} />
        {section.cancelAction && (
          <MockupAction action={section.cancelAction} context={formContext} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  )
}

function FieldPlaceholder({
  type,
  placeholder,
  options,
}: {
  type: string
  placeholder?: string
  options?: string[]
}) {
  const inputBase = 'w-full rounded-md border border-input bg-background text-sm text-muted-foreground'

  switch (type) {
    case 'textarea':
      return (
        <div className={`${inputBase} px-3 py-2 min-h-[80px]`}>
          {placeholder ?? 'Enter text...'}
        </div>
      )
    case 'select':
      return (
        <div className={`${inputBase} h-9 px-3 flex items-center justify-between`}>
          <span>{placeholder ?? options?.[0] ?? 'Select an option...'}</span>
          <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )
    case 'checkbox':
    case 'toggle':
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-input bg-background" />
          <span className="text-sm text-muted-foreground">{placeholder ?? ''}</span>
        </div>
      )
    case 'checkbox-grid':
      return (
        <div className="flex flex-wrap gap-3">
          {(options ?? ['Option 1', 'Option 2']).slice(0, 4).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-input bg-background" />
              <span className="text-sm text-muted-foreground">{opt}</span>
            </div>
          ))}
        </div>
      )
    case 'file':
      return (
        <div className={`${inputBase} h-9 px-3 flex items-center gap-2`}>
          <div className="h-6 px-2 rounded bg-secondary text-secondary-foreground text-xs flex items-center">
            Choose file
          </div>
          <span>{placeholder ?? 'No file chosen'}</span>
        </div>
      )
    case 'date':
      return (
        <div className={`${inputBase} h-9 px-3 flex items-center`}>
          <span>{placeholder ?? 'Pick a date...'}</span>
        </div>
      )
    default:
      return (
        <div className={`${inputBase} h-9 px-3 flex items-center`}>
          <span>{placeholder ?? `Enter ${type}...`}</span>
        </div>
      )
  }
}
