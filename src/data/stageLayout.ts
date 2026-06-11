import type { Agent, GeometryType, StageTierId } from '../types'

export type StageTier = {
  id: StageTierId
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
}

export const stageTiers: StageTier[] = [
  { id: 'front', x: 0, y: -1.18, z: 1.05, width: 8, height: 0.34, depth: 1.04 },
  { id: 'middle', x: 0, y: -0.46, z: -0.12, width: 8, height: 0.34, depth: 1.06 },
  { id: 'back', x: 0, y: 0.24, z: -1.28, width: 8, height: 0.34, depth: 1.08 },
]

type GeometryBounds = {
  x: number
  y: number
  z: number
}

const geometryBounds: Record<GeometryType, GeometryBounds> = {
  sphere: { x: 0.34, y: 0.34, z: 0.34 },
  tetrahedron: { x: 0.39, y: 0.39, z: 0.39 },
  octahedron: { x: 0.39, y: 0.39, z: 0.39 },
  torus: { x: 0.38, y: 0.38, z: 0.09 },
  cube: { x: 0.29, y: 0.29, z: 0.29 },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function ratioToPosition(center: number, span: number, ratio: number) {
  return center + (span / 2) * clamp(ratio, -1, 1)
}

export function getTier(id: StageTierId) {
  const tier = stageTiers.find((item) => item.id === id)
  if (!tier) {
    throw new Error(`Unknown stage tier: ${id}`)
  }
  return tier
}

export function placeAgentOnTier(
  tierId: StageTierId,
  geometryType: GeometryType,
  xRatio = 0,
  zRatio = 0.24,
  hoverGap = 0.13,
): [number, number, number] {
  const tier = getTier(tierId)
  const bounds = geometryBounds[geometryType]
  const topY = tier.y + tier.height / 2
  const targetX = ratioToPosition(tier.x, tier.width - bounds.x * 2, xRatio)
  const targetZ = ratioToPosition(tier.z, tier.depth - bounds.z * 2, zRatio)
  const safeX = clamp(
    targetX,
    tier.x - tier.width / 2 + bounds.x,
    tier.x + tier.width / 2 - bounds.x,
  )
  const safeZ = clamp(
    targetZ,
    tier.z - tier.depth / 2 + bounds.z,
    tier.z + tier.depth / 2 - bounds.z,
  )

  return [safeX, topY + bounds.y + hoverGap, safeZ]
}

function autoXRatio(index: number, count: number) {
  if (count <= 1) return 0
  const range = 0.72
  return -range + (range * 2 * index) / (count - 1)
}

export type PositionedAgent = Agent & {
  position: [number, number, number]
}

export function resolveAgentPosition(
  agent: Agent,
  fallbackXRatio = 0,
) {
  const placement = agent.stage
  return placeAgentOnTier(
    placement.tierId,
    agent.geometryType,
    placement.xRatio ?? fallbackXRatio,
    placement.zRatio ?? 0.24,
    placement.hoverGap ?? (agent.currentState === 'SLEEP' ? 0 : 0.13),
  )
}

export function layoutAgentsOnStage(agents: Agent[]): PositionedAgent[] {
  const tierCounts = new Map<StageTierId, number>()
  const tierIndexes = new Map<StageTierId, number>()

  agents.forEach((agent) => {
    if (agent.stage.xRatio === undefined) {
      tierCounts.set(agent.stage.tierId, (tierCounts.get(agent.stage.tierId) ?? 0) + 1)
    }
  })

  return agents.map((agent) => {
    const tierId = agent.stage.tierId
    const shouldAutoPlace = agent.stage.xRatio === undefined
    const index = tierIndexes.get(tierId) ?? 0
    const count = tierCounts.get(tierId) ?? 1

    if (shouldAutoPlace) {
      tierIndexes.set(tierId, index + 1)
    }

    return {
      ...agent,
      position: resolveAgentPosition(
        agent,
        shouldAutoPlace ? autoXRatio(index, count) : 0,
      ),
    }
  })
}

export function isAgentAboveTier(
  tierId: StageTierId,
  geometryType: GeometryType,
  position: [number, number, number],
) {
  const tier = getTier(tierId)
  const bounds = geometryBounds[geometryType]
  const [x, y, z] = position
  const topY = tier.y + tier.height / 2

  return {
    xWithin:
      x - bounds.x >= tier.x - tier.width / 2 && x + bounds.x <= tier.x + tier.width / 2,
    yAbove: y - bounds.y > topY,
    zWithin:
      z - bounds.z >= tier.z - tier.depth / 2 && z + bounds.z <= tier.z + tier.depth / 2,
  }
}
