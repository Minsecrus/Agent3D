import type { Agent, AgentTask } from '../types'

export function updateAgent(
  agents: Agent[],
  agentId: string,
  updater: (agent: Agent) => Agent,
) {
  return agents.map((agent) => (agent.id === agentId ? updater(agent) : agent))
}

export function makeTask(prompt: string): AgentTask {
  return {
    id: `task-${Date.now()}`,
    title: prompt.trim(),
    status: 'queued',
    progress: 0,
    trace: ['命令已进入 Agent runtime'],
  }
}

export function markTask(
  agent: Agent,
  taskId: string,
  patch: Partial<AgentTask>,
) {
  return {
    ...agent,
    tasks: agent.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
  }
}

export function pushAgentTrace(agent: Agent, taskId: string, message: string) {
  return {
    ...agent,
    aiStream: [...agent.aiStream, message],
    tasks: agent.tasks.map((task) =>
      task.id === taskId ? { ...task, trace: [...task.trace, message] } : task,
    ),
  }
}

export function completeTask(agent: Agent, taskId: string) {
  return {
    ...agent,
    currentState: 'IDLE' as const,
    corePulseHz: 1.4,
    noiseScale: 0.24,
    dailyCostAccumulated: Number((agent.dailyCostAccumulated + 0.42).toFixed(2)),
    ledgerRows: agent.ledgerRows.map((row, index) =>
      index === 0 ? { ...row, status: 'stable' as const, value: row.value.replace('active', 'done') } : row,
    ),
    tasks: agent.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: 'done' as const,
            progress: 100,
            trace: [...task.trace, 'mock AI 写回完成'],
          }
        : task,
    ),
    aiStream: [...agent.aiStream, '执行完成，投影数据已同步。'],
  }
}
