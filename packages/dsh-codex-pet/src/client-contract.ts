import type * as React from 'react'
export type Point = { x: number; y: number }
export type LookDirection = number | Point | null | undefined
export type AnimationOptions = { mode?: string; then?: string | null }
export interface PetOptions {
  src?: string
  spriteVersionNumber?: number
  size?: number | string
  normalize?: Record<number, { s: number; cx: number; cy: number }>
  position?: Point
  pin?: string
  animation?: string
  draggable?: boolean
  dragRun?: boolean
  waveOnHover?: boolean
  jumpOnDoubleClick?: boolean
  onDragEnd?: (point: Point) => void
  onPositionClamped?: (point: Point) => void
}
export interface PetController {
  setAnimation(name: string, opts?: AnimationOptions): PetController
  play(name: string, opts?: AnimationOptions): PetController
  setLook(direction: LookDirection, deadzone?: number): PetController
  clearLook(): PetController
  setScale(scale: number): PetController
  setPin(pin: string): PetController
  setPosition(x: number, y: number): PetController
  clearPosition?(): PetController
  readonly animation: string
  readonly dragging: boolean
  readonly lookIndex: number | undefined
  readonly element: HTMLDivElement
  readonly box?: {
    left: number
    top: number
    width: number
    height: number
  } | null
  dispose(): void
}
export type Source<T> = {
  getSnapshot(): T
  subscribe(fn: () => void): () => void
}
export interface Block {
  kind?: string
  type?: string
  text?: string
  name?: string
  argsRaw?: string
  callId?: string
}
export interface Node {
  kind: string
  seq?: number
  turn?: number
  step?: number
  message?: string
  content?: Block[]
  blocks?: Block[]
  interrupted?: boolean
  isError?: boolean
  callId?: string
  data?: {
    kind: string
    node?: Node
    turn: number
    time: number
    error?: string
    errorCode?: string
  }
}
export interface Request {
  purpose: string
  status: string
  startSeq: number
  resultSeq?: number
  turn: number
  step: number
  error?: string
}
export interface Snapshot {
  sessionId?: string | null
  running?: boolean
  pending?: unknown[]
  runningCalls?: { name?: string }[]
  partial?: { blocks?: Block[] } | null
  openState?: string | null
  nodes?: Node[] | null
  eventNodes?: Node[]
  turnEnds?: Map<number, unknown> | null
  requests?: Request[] | null
  views?: { get(key: string): { requests?: Request[] } } | null
  legacy?: Snapshot
}
export interface Binding {
  key?: string
  props?: { sessionId?: string }
  hooks?: {
    session?: Source<Snapshot>
    trajectory?: Source<Snapshot>
    chat?: Source<Snapshot>
  }
}
export interface UiSession {
  adapter?: { current?: Source<Binding | undefined> }
  current?: Source<Binding | undefined>
  sessionStatus?: Source<
    Map<string | undefined, { pendingInteraction?: unknown }>
  >
}
export interface Sessions {
  currentProvideInfo?: Source<Binding | undefined>
}
export interface ClientContext {
  get?(key: string): UiSession | undefined
  uiSession?: UiSession
  sessions: Sessions
  effect(fn: () => unknown, label: string): unknown
  slots: {
    inject(name: string, fn: () => unknown): unknown
    register(spec: object, component: React.ComponentType<never>): unknown
  }
}
