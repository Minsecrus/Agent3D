import { useEffect, useRef, useState } from 'react'
import { AgentPanel } from './components/AgentPanel'
import { AgentsScene } from './components/AgentsScene'
import { initialAgents, stateLabels } from './data/agents'
import {
  completeTask,
  makeTask,
  markTask,
  pushAgentTrace,
  updateAgent,
} from './runtime/agentRuntime'
import type { Agent, AgentCommand, AgentHoverPositionHandle, AgentTask } from './types'
import './styles/app.css'

function App() {
  const [agents, setAgents] = useState(initialAgents)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null)
  const [studioInfoOpen, setStudioInfoOpen] = useState(false)
  const timers = useRef<number[]>([])
  const calloutCircleRef = useRef<SVGCircleElement | null>(null)
  const calloutPathRef = useRef<SVGPathElement | null>(null)
  const hoverFloatRef = useRef<HTMLElement | null>(null)
  const hoverPositionRef = useRef<AgentHoverPositionHandle | null>(null)
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null
  const hoveredAgent = agents.find((agent) => agent.id === hoveredAgentId) ?? null

  hoverPositionRef.current = {
    update(position) {
      if (!calloutCircleRef.current || !calloutPathRef.current || !hoverFloatRef.current) return

      if (!position) {
        calloutCircleRef.current.style.opacity = '0'
        calloutPathRef.current.style.opacity = '0'
        hoverFloatRef.current.style.opacity = '0'
        return
      }

      const cardLeft = position.x + 112
      const cardTop = position.y - 82
      calloutCircleRef.current.style.opacity = '1'
      calloutPathRef.current.style.opacity = '1'
      hoverFloatRef.current.style.opacity = '1'
      calloutCircleRef.current.setAttribute('cx', String(position.anchorX))
      calloutCircleRef.current.setAttribute('cy', String(position.anchorY))
      calloutPathRef.current.setAttribute(
        'd',
        `M ${position.x + 12} ${position.y - 10} L ${position.x + 76} ${position.y - 66} L ${position.x + 122} ${position.y - 66}`,
      )
      hoverFloatRef.current.style.transform = `translate3d(${cardLeft}px, ${cardTop}px, 0)`
    },
  }

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  function schedule(step: () => void, delay: number) {
    const timer = window.setTimeout(step, delay)
    timers.current.push(timer)
  }

  function mutateAgent(agentId: string, updater: (agent: Agent) => Agent) {
    setAgents((current) => updateAgent(current, agentId, updater))
  }

  function finishTask(agentId: string, taskId: string) {
    mutateAgent(agentId, (agent) => completeTask(agent, taskId))
  }

  function runMockAI(agentId: string, task: AgentTask) {
    mutateAgent(agentId, (agent) => ({
      ...agent,
      currentState: 'THINKING',
      corePulseHz: 3.2,
      noiseScale: 0.86,
      tasks: [{ ...task, status: 'thinking', progress: 12 }, ...agent.tasks],
      aiStream: [...agent.aiStream, `收到任务：${task.title}`],
    }))

    schedule(() => {
      mutateAgent(agentId, (agent) => markTask(agent, task.id, { progress: 28 }))
      mutateAgent(agentId, (agent) => pushAgentTrace(agent, task.id, '正在读取绑定工具和账本快照'))
    }, 1600)

    schedule(() => {
      const needsApproval = task.title.includes('预算') || task.title.includes('删除')
      mutateAgent(agentId, (agent) => {
        const nextTask = {
          status: needsApproval ? ('approval' as const) : ('executing' as const),
          progress: needsApproval ? 48 : 58,
          trace: [
            ...(agent.tasks.find((agentTask) => agentTask.id === task.id)?.trace ?? []),
            needsApproval ? '触发审批口：高影响数据变更' : '开始调用 mock 工具执行',
          ],
        }

        return {
          ...markTask(agent, task.id, nextTask),
          currentState: needsApproval ? 'AWAITING_APPROVAL' : 'EXECUTING',
          corePulseHz: needsApproval ? 1.1 : 5.6,
          noiseScale: needsApproval ? 0.42 : 1.05,
          aiStream: [
            ...agent.aiStream,
            needsApproval
              ? '我需要人类确认后再写入这批数据。'
              : '我会先生成计划，再对投影数据做小范围更新。',
          ],
        }
      })
    }, 3600)

    if (!task.title.includes('预算') && !task.title.includes('删除')) {
      schedule(() => finishTask(agentId, task.id), 7600)
    }
  }

  function handleCommand(command: AgentCommand) {
    if (command.type === 'ASSIGN_TASK' || command.type === 'ASK_AGENT') {
      runMockAI(command.agentId, makeTask(command.prompt))
      return
    }

    if (command.type === 'APPROVE_RUN') {
      mutateAgent(command.agentId, (agent) => ({
        ...markTask(agent, command.taskId, {
          status: 'executing',
          progress: 72,
          trace: [
            ...(agent.tasks.find((task) => task.id === command.taskId)?.trace ?? []),
            '审批通过，开始执行',
          ],
        }),
        currentState: 'EXECUTING',
        corePulseHz: 5.2,
        noiseScale: 1,
        aiStream: [...agent.aiStream, '审批已通过，我开始执行写入。'],
      }))
      schedule(() => finishTask(command.agentId, command.taskId), 5200)
      return
    }

    mutateAgent(command.agentId, (agent) => ({
      ...agent,
      currentState: 'THINKING',
      corePulseHz: 4,
      noiseScale: 1.2,
      ledgerRows: agent.ledgerRows.map((row) =>
        row.id === command.rowId ? { ...row, status: 'watch', value: `${row.value}*` } : row,
      ),
      aiStream: [...agent.aiStream, '检测到人工改动，已把该行加入待同步快照。'],
    }))
    schedule(() => {
      mutateAgent(command.agentId, (agent) => ({
        ...agent,
        currentState: 'IDLE',
        corePulseHz: 1.2,
        noiseScale: 0.24,
      }))
    }, 2400)
  }

  return (
    <main className={`workspace ${selectedAgent ? 'is-focused' : ''}`}>
      <div className="scene-layer">
        <AgentsScene
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          onClearFocus={() => setSelectedAgentId(null)}
          onOpenStudioInfo={() => setStudioInfoOpen(true)}
          onHoverAgent={setHoveredAgentId}
          hoveredAgentId={hoveredAgentId}
          hoverPositionRef={hoverPositionRef}
        />
      </div>

      {selectedAgent && (
        <AgentPanel
          agent={selectedAgent}
          onCommand={handleCommand}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {studioInfoOpen && (
        <section className="studio-info-float">
          <button type="button" aria-label="关闭工作室信息" onClick={() => setStudioInfoOpen(false)}>
            ×
          </button>
          <p>XX工作室</p>
          <h2>几何体 Agent 后台</h2>
          <span>一个以几何体本体为中心的数字员工调度空间。</span>
        </section>
      )}

      {hoveredAgent && !selectedAgent && (
        <>
          <svg className="agent-callout-line" aria-hidden="true">
            <circle ref={calloutCircleRef} cx="0" cy="0" r="13" />
            <path ref={calloutPathRef} d="" />
          </svg>
          <section ref={hoverFloatRef} className="agent-hover-float">
            <p>{hoveredAgent.department}</p>
            <h2>{hoveredAgent.name}</h2>
            <span>{hoveredAgent.roleTitle}</span>
            <div>
              <b>{stateLabels[hoveredAgent.currentState]}</b>
              <i>{hoveredAgent.avgResponseLatency.toFixed(1)}s</i>
              <i>{hoveredAgent.satisfactionRate.toFixed(1)}</i>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default App
