'use client'

import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Server,
  Database,
  GitBranch,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import type { PlanRegistry, PlanItemType } from '@/lib/plan-registry'

interface PlanTreeProps {
  plan: PlanRegistry
  selectedItemId: string | null
  selectedItemType: PlanItemType | null
  onSelectItem: (id: string, type: PlanItemType) => void
}

const typeIcons: Record<PlanItemType, typeof Monitor> = {
  screen: Monitor,
  endpoint: Server,
  table: Database,
  flow: GitBranch,
}

export function PlanTree({ plan, selectedItemId, selectedItemType, onSelectItem }: PlanTreeProps) {
  const defaultOpenModules = useMemo(
    () => plan.modules.map((m) => m.id),
    [plan]
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <Accordion type="multiple" defaultValue={[...defaultOpenModules, '_flows']}>
          {plan.modules.map((mod) => {
            const totalItems = mod.screens.length + mod.apiEndpoints.length + mod.dbTables.length

            return (
              <AccordionItem key={mod.id} value={mod.id} className="border-b-0">
                <AccordionTrigger className="py-2 px-2 text-sm hover:no-underline hover:bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: mod.color }}
                    />
                    <span className="font-medium text-foreground">{mod.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto mr-2">
                      {totalItems}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  {/* Screens */}
                  {mod.screens.length > 0 && (
                    <SectionGroup label="Screens" count={mod.screens.length}>
                      {mod.screens.map((screen) => (
                        <TreeItem
                          key={screen.id}
                          id={screen.id}
                          type="screen"
                          label={screen.name}
                          sublabel={screen.route}
                          isSelected={selectedItemId === screen.id && selectedItemType === 'screen'}
                          status={screen.status}
                          onSelect={onSelectItem}
                        />
                      ))}
                    </SectionGroup>
                  )}

                  {/* Endpoints */}
                  {mod.apiEndpoints.length > 0 && (
                    <SectionGroup label="Endpoints" count={mod.apiEndpoints.length}>
                      {mod.apiEndpoints.map((ep) => (
                        <TreeItem
                          key={ep.id}
                          id={ep.id}
                          type="endpoint"
                          label={`${ep.method} ${ep.path}`}
                          isSelected={selectedItemId === ep.id && selectedItemType === 'endpoint'}
                          onSelect={onSelectItem}
                        />
                      ))}
                    </SectionGroup>
                  )}

                  {/* Tables */}
                  {mod.dbTables.length > 0 && (
                    <SectionGroup label="Tables" count={mod.dbTables.length}>
                      {mod.dbTables.map((table) => (
                        <TreeItem
                          key={table.id}
                          id={table.id}
                          type="table"
                          label={table.name}
                          sublabel={`${table.columns.length} cols`}
                          isSelected={selectedItemId === table.id && selectedItemType === 'table'}
                          onSelect={onSelectItem}
                        />
                      ))}
                    </SectionGroup>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}

          {/* Flows section */}
          {plan.flows.length > 0 && (
            <AccordionItem value="_flows" className="border-b-0">
              <AccordionTrigger className="py-2 px-2 text-sm hover:no-underline hover:bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full shrink-0 bg-violet-500" />
                  <span className="font-medium text-foreground">Flows</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto mr-2">
                    {plan.flows.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="ml-5 space-y-0.5">
                  {plan.flows.map((flow) => (
                    <TreeItem
                      key={flow.id}
                      id={flow.id}
                      type="flow"
                      label={flow.name}
                      sublabel={`${flow.steps.length} steps`}
                      isSelected={selectedItemId === flow.id && selectedItemType === 'flow'}
                      onSelect={onSelectItem}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </ScrollArea>
  )
}

function SectionGroup({
  label,
  count,
  children,
}: {
  label: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="ml-3 mb-1">
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground">{count}</span>
      </div>
      <div className="ml-2 space-y-0.5">{children}</div>
    </div>
  )
}

function TreeItem({
  id,
  type,
  label,
  sublabel,
  isSelected,
  status,
  onSelect,
}: {
  id: string
  type: PlanItemType
  label: string
  sublabel?: string
  isSelected: boolean
  status?: string
  onSelect: (id: string, type: PlanItemType) => void
}) {
  const Icon = typeIcons[type]
  const StatusIcon = status === 'implemented' ? CheckCircle2 : Circle

  return (
    <button
      onClick={() => onSelect(id, type)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors text-left ${
        isSelected
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'hover:bg-muted/50 text-foreground border border-transparent'
      }`}
    >
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="truncate flex-1">{label}</span>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground shrink-0">{sublabel}</span>
      )}
      {status && (
        <StatusIcon
          className={`h-3 w-3 shrink-0 ${
            status === 'implemented' ? 'text-success' : 'text-muted-foreground'
          }`}
        />
      )}
    </button>
  )
}
