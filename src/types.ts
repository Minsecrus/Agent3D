export type AgentState =
  | 'IDLE'
  | 'THINKING'
  | 'EXECUTING'
  | 'AWAITING_APPROVAL'
  | 'ERROR'
  | 'SLEEP'

export type GeometryType = 'sphere' | 'tetrahedron' | 'octahedron' | 'torus' | 'cube'

export type StageTierId = 'front' | 'middle' | 'back'

export type AgentStagePlacement = {
  tierId: StageTierId
  xRatio?: number
  zRatio?: number
  hoverGap?: number
}

export type MaterialType =
  | 'liquid_chrome'
  | 'frosted_glass'
  | 'iridescent'
  | 'hologram'

export type TaskStatus = 'queued' | 'thinking' | 'approval' | 'executing' | 'done' | 'error'

export type LedgerRow = {
  id: string
  label: string
  metric: string
  value: string
  status: 'stable' | 'watch' | 'risk'
}

export type AgentTask = {
  id: string
  title: string
  status: TaskStatus
  progress: number
  trace: string[]
}

export type Agent = {
  id: string
  name: string
  roleTitle: string
  department: string
  geometryType: GeometryType
  materialType: MaterialType
  baseColor: string
  currentState: AgentState
  corePulseHz: number
  orbitRings: number
  noiseScale: number
  rigorLevel: number
  creativityLevel: number
  proactivityLevel: number
  conversationalStyle: string
  dailyBudgetLimit: number
  dailyCostAccumulated: number
  avgResponseLatency: number
  satisfactionRate: number
  tools: string[]
  ledgerRows: LedgerRow[]
  tasks: AgentTask[]
  aiStream: string[]
  stage: AgentStagePlacement
}

export type AgentCommand =
  | { type: 'ASSIGN_TASK'; agentId: string; prompt: string }
  | { type: 'APPROVE_RUN'; agentId: string; taskId: string }
  | { type: 'ASK_AGENT'; agentId: string; prompt: string }
  | { type: 'EDIT_LEDGER_CELL'; agentId: string; rowId: string }

export type AgentScreenPosition = {
  agentId: string
  x: number
  y: number
  anchorX: number
  anchorY: number
}

export type AgentHoverPositionHandle = {
  update(position: AgentScreenPosition | null): void
}
