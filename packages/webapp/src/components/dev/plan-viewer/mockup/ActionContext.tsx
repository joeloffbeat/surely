'use client'

import { createContext, useContext } from 'react'
import type { UIAction } from '@/lib/plan-registry'

export interface SelectedAction {
  action: UIAction
  context: string // e.g. "Header", "Form: Login", "Row Action"
}

interface ActionContextValue {
  selected: SelectedAction | null
  onActionClick: (action: UIAction, context: string) => void
}

export const ActionContext = createContext<ActionContextValue>({
  selected: null,
  onActionClick: () => {},
})

export function useActionContext() {
  return useContext(ActionContext)
}
