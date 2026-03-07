'use client'

import { ChangeSidebar } from './ChangeSidebar'
import { ChangeDetail } from './ChangeDetail'
import type { Change } from './types'

interface ChangeViewerLayoutProps {
  changes: Change[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ChangeViewerLayout({ changes, selectedId, onSelect }: ChangeViewerLayoutProps) {
  const selectedChange = changes.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden">
      <ChangeSidebar
        changes={changes}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChange ? (
          <ChangeDetail change={selectedChange} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Select a change to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
