export interface PetEntry {
  id: string
  displayName: string
  description: string
  spriteVersionNumber: number
  size: number
  pin: string
  source: string
  cell: { width: number; height: number }
  columns: number
  rows: number
  atlasUrl: string
  manifestUrl: string
  dir: string
  spritesheetPath: string
}
export type PetView = Omit<PetEntry, 'dir' | 'spritesheetPath'>
export interface Registry {
  entries: PetEntry[]
  warnings: string[]
  codexPetsDir?: string
  codexPets?: boolean
  byId(id: unknown): PetEntry | undefined
  defaultEntry(): PetEntry | undefined
  add(entry: PetEntry): void
}
export interface Display {
  visible: boolean
  size: number
  pin: string
  left: number | null
  top: number | null
  layoutRev: number
  bubbleTheme: string
  bubbleOpacity: number
  mouseTracking: boolean
  showModelWork: boolean
  rightClickHide: boolean
}
export interface Summary {
  enabled: boolean
  intervalRequests: number
  provider: string
  model: string
  maxChars: number
  bubbleSeconds: number
}
export interface Sound {
  enabled: boolean
  volume: number
  tracks: Record<string, { enabled: boolean; volume: number }>
}
export interface Persist {
  petId: string | null
  display: Display
  summary: Summary
  sound: Sound
  codexPets: { enabled: boolean }
}
export interface Journal {
  sessionId: string
  fromRequestSeq: number
  toRequestSeq: number
  requestCount: number
  provider: string
  model: string
  summary: string
  createdAt: string
}
export interface RequestRecord {
  requestSeq: number
  turn: number
  step: number
  user?: string
  assistant?: string
  error?: string
  actions?: { tool?: unknown; detail?: string; failed?: unknown }[]
}
export interface SummaryPayload {
  sessionId?: unknown
  fromRequestSeq: number
  toRequestSeq: number
  requests: RequestRecord[]
}
export interface ConfigPatch extends Partial<Omit<Display, 'layoutRev'>> {
  summary?: Partial<Summary>
  sound?: Partial<Sound>
  codexPets?: { enabled?: boolean }
}

export interface PetState extends Persist {
  codexPetsDir: string | null
  pet: PetView | null
  pets: PetView[]
  hasCustomSounds: Record<string, boolean>
  pulses: Record<'error' | 'interrupt', { at: number; sessionId: string }>
}
