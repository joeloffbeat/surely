'use client'

import { Button } from '@/components/ui/button'
import {
  ArrowRight, MessageSquare, Send, Trash2, Download, ToggleLeft,
  MousePointerClick, ExternalLink
} from 'lucide-react'
import { useActionContext } from './ActionContext'
import type { UIAction } from '@/lib/plan-registry'

interface MockupActionProps {
  action: UIAction
  context?: string
  onNavigate?: (route: string) => void
  size?: 'sm' | 'xs'
}

const actionIcons: Record<string, React.ReactNode> = {
  navigate: <ArrowRight className="h-3 w-3" />,
  dialog: <MessageSquare className="h-3 w-3" />,
  submit: <Send className="h-3 w-3" />,
  'api-call': <ExternalLink className="h-3 w-3" />,
  'confirm-delete': <Trash2 className="h-3 w-3" />,
  download: <Download className="h-3 w-3" />,
  toggle: <ToggleLeft className="h-3 w-3" />,
}

const variantMap: Record<string, 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'> = {
  primary: 'default',
  outline: 'outline',
  ghost: 'ghost',
  destructive: 'destructive',
  secondary: 'secondary',
}

export function MockupAction({ action, context = 'Action', onNavigate, size = 'sm' }: MockupActionProps) {
  const { selected, onActionClick } = useActionContext()
  const variant = variantMap[action.variant ?? 'outline'] ?? 'outline'
  const isSelected = selected?.action.label === action.label && selected?.context === context

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onActionClick(action, context)
  }

  return (
    <Button
      variant={variant}
      size={size === 'xs' ? 'sm' : 'sm'}
      className={`gap-1.5 transition-all cursor-pointer ${
        size === 'xs' ? 'h-6 text-[10px] px-2' : 'h-7 text-xs px-2.5'
      } ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-1 ring-offset-background shadow-md'
          : 'hover:ring-2 hover:ring-primary/20'
      }`}
      onClick={handleClick}
    >
      {actionIcons[action.action] ?? <MousePointerClick className="h-3 w-3" />}
      {action.label}
    </Button>
  )
}
