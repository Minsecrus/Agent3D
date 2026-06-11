import { useState } from 'react'
import type { FormEvent } from 'react'
import { stateLabels, taskLabels } from '../data/agents'
import type { Agent, AgentCommand, AgentTask } from '../types'
import './AgentPanel.css'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="agent-stat">
      <b>{value}</b>
      <i>{label}</i>
    </span>
  )
}

function DetailMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="detail-meter">
      <span>{label}</span>
      <div>
        <i style={{ width: `${value * 100}%` }} />
      </div>
      <b>{Math.round(value * 100)}</b>
    </div>
  )
}

function TaskRecord({
  task,
  onApprove,
}: {
  task: AgentTask
  onApprove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showTrace, setShowTrace] = useState(false)

  return (
    <article className="task-record">
      <button type="button" className="task-summary" onClick={() => setOpen((value) => !value)}>
        <span>
          <b>{task.title}</b>
          <i>{taskLabels[task.status]}</i>
        </span>
        <em>{task.progress}%</em>
      </button>
      {open && (
        <div className="task-levels">
          <div className="stage-row">
            {(['thinking', 'approval', 'executing', 'done'] as const).map((stage) => (
              <span key={stage} className={task.status === stage ? 'active' : ''}>
                {taskLabels[stage]}
              </span>
            ))}
          </div>
          {task.status === 'approval' && (
            <button type="button" className="approve-button" onClick={onApprove}>
              批准
            </button>
          )}
          <button type="button" className="trace-toggle" onClick={() => setShowTrace((value) => !value)}>
            {showTrace ? '收起记录' : '展开记录'}
          </button>
          {showTrace && (
            <ol className="trace-list">
              {task.trace.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </article>
  )
}

export function AgentPanel({
  agent,
  onCommand,
  onClose,
}: {
  agent: Agent
  onCommand: (command: AgentCommand) => void
  onClose: () => void
}) {
  const [taskPrompt, setTaskPrompt] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const budgetRatio = Math.min(agent.dailyCostAccumulated / agent.dailyBudgetLimit, 1)

  function submitTask(event: FormEvent) {
    event.preventDefault()
    if (!taskPrompt.trim()) return
    onCommand({ type: 'ASSIGN_TASK', agentId: agent.id, prompt: taskPrompt })
    setTaskPrompt('')
  }

  return (
    <>
      <section className="agent-info-float">
        <div className="agent-title">
          <p>{agent.department}</p>
          <h1>{agent.name}</h1>
          <span>{agent.roleTitle}</span>
        </div>
        <div className="agent-status-line">
          <span>{stateLabels[agent.currentState]}</span>
          <button type="button" onClick={onClose} aria-label="关闭" title="关闭">
            ×
          </button>
        </div>
        <div className="agent-stats">
          <Stat label="预算" value={`${Math.round(budgetRatio * 100)}%`} />
          <Stat label="延迟" value={`${agent.avgResponseLatency.toFixed(1)}s`} />
          <Stat label="满意" value={agent.satisfactionRate.toFixed(1)} />
        </div>
        <button type="button" className="details-link" onClick={() => setDetailsOpen((open) => !open)}>
          {detailsOpen ? '收起' : '更多'}
        </button>
        {detailsOpen && (
          <div className="left-detail-view">
            <DetailMeter label="严谨" value={agent.rigorLevel} />
            <DetailMeter label="创造" value={agent.creativityLevel} />
            <DetailMeter label="主动" value={agent.proactivityLevel} />
            <div className="detail-group">
              <h2>工具</h2>
              {agent.tools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
            <div className="detail-group">
              <h2>数据投影</h2>
              {agent.ledgerRows.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  onDoubleClick={() =>
                    onCommand({ type: 'EDIT_LEDGER_CELL', agentId: agent.id, rowId: row.id })
                  }
                >
                  {row.label} · {row.metric} · {row.value}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="agent-side-float">
        <div className="task-records">
          {agent.tasks.map((task) => (
            <TaskRecord
              key={task.id}
              task={task}
              onApprove={() =>
                onCommand({ type: 'APPROVE_RUN', agentId: agent.id, taskId: task.id })
              }
            />
          ))}
        </div>
      </section>

      <form className="agent-command-float" onSubmit={submitTask}>
        <input
          value={taskPrompt}
          onChange={(event) => setTaskPrompt(event.target.value)}
          placeholder="指派新任务"
        />
        <button type="submit" aria-label="发送任务" title="发送任务">
          →
        </button>
      </form>
    </>
  )
}
