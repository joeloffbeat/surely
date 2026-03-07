'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import type { UIWizardSection } from '@/lib/plan-registry'

interface MockupWizardProps {
  section: UIWizardSection
}

export function MockupWizard({ section }: MockupWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = section.steps[activeStep]

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {section.steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                i === activeStep
                  ? 'bg-primary/10 text-primary font-semibold'
                  : i < activeStep
                  ? 'text-success'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === activeStep
                    ? 'bg-primary text-primary-foreground'
                    : i < activeStep
                    ? 'bg-success text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < section.steps.length - 1 && (
              <div
                className={`w-8 h-px mx-1 ${
                  i < activeStep ? 'bg-success' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current step fields */}
      {currentStep && (
        <div className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Step {activeStep + 1}: {currentStep.label}
          </h4>
          <div className="space-y-4">
            {currentStep.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </label>
                <div className="h-9 w-full rounded-md border border-input bg-background px-3 flex items-center">
                  <span className="text-sm text-muted-foreground">
                    {field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setActiveStep(Math.min(section.steps.length - 1, activeStep + 1))}
          disabled={activeStep === section.steps.length - 1}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-30 transition-colors"
        >
          {activeStep === section.steps.length - 1 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  )
}
