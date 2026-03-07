'use client'

import { Badge } from '@/components/ui/badge'
import { Database, Key, Link2 } from 'lucide-react'
import type { PlanTable, PlanModule } from '@/lib/plan-registry'

interface TableDetailProps {
  table: PlanTable
  module: PlanModule
}

export function TableDetail({ table, module }: TableDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Database className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground font-mono">{table.name}</h3>
          </div>
        </div>
      </div>

      {/* Module */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: module.color }} />
        <span className="text-sm text-muted-foreground">{module.name}</span>
      </div>

      {/* Columns */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            Columns
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {table.columns.length}
            </span>
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Constraints</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((col) => (
                <tr key={col.name} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2 font-mono text-foreground">
                    {col.name}
                  </td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">
                    {col.type}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {col.primary && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                          PK
                        </Badge>
                      )}
                      {col.unique && (
                        <Badge className="bg-info/10 text-info border-info/20 text-[10px]">
                          UNIQUE
                        </Badge>
                      )}
                      {col.nullable && (
                        <Badge variant="secondary" className="text-[10px]">
                          NULL
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relations */}
      {table.relations.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Relations
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {table.relations.length}
              </span>
            </h4>
          </div>
          <div className="p-4 space-y-2">
            {table.relations.map((rel, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs"
              >
                <Badge variant="outline" className="text-[10px] font-mono">
                  {rel.type}
                </Badge>
                <span className="text-foreground font-mono">{rel.table}</span>
                <span className="text-muted-foreground">via</span>
                <span className="text-foreground font-mono">{rel.column}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
