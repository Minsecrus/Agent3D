import type { Agent, AgentState, GeometryType, MaterialType } from '../types'

export const stateGlow: Record<AgentState, string> = {
  IDLE: '#9fd8ff',
  THINKING: '#7f9cff',
  EXECUTING: '#35d0ac',
  AWAITING_APPROVAL: '#f0b84f',
  ERROR: '#ff5a5f',
  SLEEP: '#aeb5bd',
}

export type GeometrySpec = {
  type: GeometryType
  args: [number, ...number[]]
}

export type MaterialSpec = {
  color: string
  metalness: number
  roughness: number
  transmission: number
  thickness: number
  opacity: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  iridescence: number
  iridescenceIOR: number
  iridescenceThicknessRange: [number, number]
  emissiveIntensity: number
}

export type MotionSpec = {
  rotationSpeed: number
  floatIntensity: number
  glowIntensity: number
  glowDistance: number
  pulseScale: number
}

export function getGeometrySpec(type: GeometryType): GeometrySpec {
  switch (type) {
    case 'sphere':
      return { type, args: [0.34, 48, 48] }
    case 'tetrahedron':
      return { type, args: [0.43, 0] }
    case 'octahedron':
      return { type, args: [0.39, 1] }
    case 'torus':
      return { type, args: [0.29, 0.09, 24, 72] }
    case 'cube':
      return { type, args: [0.58, 0.58, 0.58, 6, 6, 6] }
  }
}

function getMaterialBase(type: MaterialType) {
  switch (type) {
    case 'liquid_chrome':
      return {
        color: '#fbfcff',
        metalness: 0.24,
        roughness: 0.22,
        transmission: 0.18,
        thickness: 0.34,
        opacity: 0.88,
        clearcoat: 0.96,
        clearcoatRoughness: 0.12,
        sheen: 0.12,
        iridescence: 0.08,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [80, 220] as [number, number],
      }
    case 'frosted_glass':
      return {
        color: '#f6f8fb',
        metalness: 0.02,
        roughness: 0.72,
        transmission: 0.26,
        thickness: 0.42,
        opacity: 0.82,
        clearcoat: 0.34,
        clearcoatRoughness: 0.62,
        sheen: 0.36,
        iridescence: 0.03,
        iridescenceIOR: 1.18,
        iridescenceThicknessRange: [70, 160] as [number, number],
      }
    case 'iridescent':
      return {
        color: '#fbfaf4',
        metalness: 0.04,
        roughness: 0.36,
        transmission: 0.22,
        thickness: 0.36,
        opacity: 0.86,
        clearcoat: 0.82,
        clearcoatRoughness: 0.2,
        sheen: 0.34,
        iridescence: 0.58,
        iridescenceIOR: 1.7,
        iridescenceThicknessRange: [120, 520] as [number, number],
      }
    case 'hologram':
      return {
        color: '#f7fbff',
        metalness: 0.01,
        roughness: 0.28,
        transmission: 0.34,
        thickness: 0.28,
        opacity: 0.76,
        clearcoat: 0.72,
        clearcoatRoughness: 0.18,
        sheen: 0.48,
        iridescence: 0.22,
        iridescenceIOR: 1.42,
        iridescenceThicknessRange: [90, 360] as [number, number],
      }
  }
}

export function getAgentMaterialSpec(agent: Agent, selected: boolean, isActive: boolean): MaterialSpec {
  const base = getMaterialBase(agent.materialType)
  const sleepFactor = agent.currentState === 'SLEEP' ? 0.58 : 1
  const activityBoost = selected ? 0.12 : isActive ? 0.08 : 0
  const fixedStateEmissive =
    agent.currentState === 'AWAITING_APPROVAL' || agent.currentState === 'ERROR' ? 1 : null

  return {
    ...base,
    color: agent.currentState === 'SLEEP' ? '#d6d8d9' : base.color,
    emissiveIntensity: fixedStateEmissive ?? (0.1 + activityBoost) * sleepFactor,
  }
}

export function getAgentMotionSpec(agent: Agent, selected: boolean): MotionSpec {
  const stateSpeed: Record<AgentState, number> = {
    IDLE: 0.16,
    THINKING: 0.45,
    EXECUTING: 0.9,
    AWAITING_APPROVAL: 0.08,
    ERROR: 0.28,
    SLEEP: 0,
  }
  const stateGlowBoost: Record<AgentState, number> = {
    IDLE: 1,
    THINKING: 2.6,
    EXECUTING: 3.4,
    AWAITING_APPROVAL: 1.35,
    ERROR: 2.4,
    SLEEP: 0.48,
  }

  return {
    rotationSpeed: stateSpeed[agent.currentState],
    floatIntensity: agent.currentState === 'SLEEP' ? 0.02 : 0.05 + agent.noiseScale * 0.05,
    glowIntensity: (selected ? 4.6 : 3.24) * stateGlowBoost[agent.currentState],
    glowDistance: agent.materialType === 'hologram' ? 1.45 : 1.15,
    pulseScale: agent.currentState === 'SLEEP' ? 0.004 : 0.028 + agent.noiseScale * 0.016,
  }
}
