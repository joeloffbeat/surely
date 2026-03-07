// Shared layer configuration for plan viewer components
// Used by both ScreenDetail (AppFlowSection) and EndpointDetail (ServerFlow)

export const layerConfig: Record<string, { label: string; color: string; bg: string }> = {
  // Screen flow layers
  ui: { label: 'UI', color: 'text-info', bg: 'bg-info/10' },
  api: { label: 'API', color: 'text-warning', bg: 'bg-warning/10' },
  server: { label: 'Server', color: 'text-primary', bg: 'bg-primary/10' },
  db: { label: 'DB', color: 'text-success', bg: 'bg-success/10' },
  external: { label: 'Ext', color: 'text-muted-foreground', bg: 'bg-muted' },
  blockchain: { label: 'BC', color: 'text-purple-600', bg: 'bg-purple-600/10' },
  ai: { label: 'AI', color: 'text-cyan-600', bg: 'bg-cyan-600/10' },
  contract: { label: 'SC', color: 'text-amber-600', bg: 'bg-amber-600/10' },
  // Endpoint-specific layers
  middleware: { label: 'MW', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  validation: { label: 'Val', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  auth: { label: 'Auth', color: 'text-destructive', bg: 'bg-destructive/10' },
  transform: { label: 'Xfm', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  response: { label: 'Res', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
}
