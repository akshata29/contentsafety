import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/apiFetch'
import { RawJsonView } from '../Common/FeaturePage'
import {
  GitBranch, Play, Bot, Shield, ShieldOff, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Zap, BarChart2,
} from 'lucide-react'

const COLOR = '#6366f1'

const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS:  { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
}

function ScenarioCard({ s, selected, onSelect }) {
  const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
  const tool = s.planned_tool_call
  return (
    <button
      onClick={() => onSelect(s)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.3rem',
        padding: '0.65rem 0.75rem', textAlign: 'left', cursor: 'pointer',
        background: selected ? `${COLOR}12` : 'var(--bg-elevated)',
        border: `1px solid ${selected ? COLOR + '60' : 'var(--border)'}`,
        borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{s.label}</span>
        <span style={{ padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text, flexShrink: 0 }}>{s.tag}</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</div>
      {tool && (
        <div style={{ fontSize: '0.67rem', fontFamily: 'var(--font-mono)', padding: '0.18rem 0.4rem', background: 'var(--bg-card)', border: `1px solid ${COLOR}30`, borderRadius: 3, color: COLOR, marginTop: '0.05rem' }}>
          {tool.name}(...)
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.05rem' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.category}</span>
        <span style={{ padding: '0.1rem 0.35rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 600, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>Agent</span>
      </div>
    </button>
  )
}

function StatusBanner({ status, onProvision, provisioning }) {
  if (!status) return null
  const gr = status.guardrail || {}
  const ag = status.agent || {}
  const allReady = gr.exists && ag.exists
  return (
    <div style={{
      padding: '0.75rem 1rem',
      background: allReady ? `${COLOR}0d` : 'rgba(245,158,11,0.06)',
      border: `1px solid ${allReady ? COLOR + '35' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 8, marginBottom: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: gr.exists ? `${COLOR}20` : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {gr.exists ? <Shield size={14} style={{ color: COLOR }} /> : <ShieldOff size={14} style={{ color: '#f59e0b' }} />}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: gr.exists ? COLOR : '#f59e0b' }}>{gr.name || 'CF-Demo-TaskAdherence'}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{gr.exists ? (gr.controls || []).join(' + ') : 'Not provisioned'}</div>
        </div>
        {gr.exists && <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 3, background: '#10b98120', color: '#10b981', border: '1px solid #10b98135' }}>LIVE</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: ag.exists ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={14} style={{ color: ag.exists ? '#8b5cf6' : '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: ag.exists ? '#8b5cf6' : '#f59e0b' }}>{ag.name || 'cf-demo-sar-specialist'}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{ag.exists ? `${ag.model || 'chat4o'} | Ready for testing` : 'Not provisioned'}</div>
        </div>
        {ag.exists && <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 3, background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf635' }}>LIVE</span>}
      </div>
      {!allReady && (
        <button onClick={onProvision} disabled={provisioning} style={{ padding: '0.4rem 0.9rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, background: COLOR, color: '#fff', border: 'none', cursor: provisioning ? 'not-allowed' : 'pointer', opacity: provisioning ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {provisioning ? <RefreshCw size={12} className="spin" /> : <Zap size={12} />}
          {provisioning ? 'Provisioning...' : 'Provision Demo Resources'}
        </button>
      )}
    </div>
  )
}

function ResultPanel({ result }) {
  const ev = result.task_adherence_eval
  const blocked = result.guardrail_triggered

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Task Adherence Signal */}
      {ev && !ev.error && (
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Task Adherence Signal
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: ev.taskRiskDetected ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${ev.taskRiskDetected ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
            borderRadius: 7,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: ev.taskRiskDetected ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ev.taskRiskDetected ? <XCircle size={18} style={{ color: '#ef4444' }} /> : <CheckCircle size={18} style={{ color: '#10b981' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: ev.taskRiskDetected ? '#ef4444' : '#10b981' }}>
                  taskRiskDetected: {ev.taskRiskDetected ? 'true' : 'false'}
                </span>
                {ev.violationType && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {ev.violationType}
                  </span>
                )}
                {ev.severity != null && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 3, background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}40` }}>
                    severity: {ev.severity}/5
                  </span>
                )}
              </div>
              {ev.details && (
                <div style={{ fontSize: '0.77rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {ev.details}
                </div>
              )}
            </div>
          </div>
          {'_raw_response' in ev && (
            <div style={{ marginTop: '0.5rem' }}>
              <RawJsonView data={ev._raw_response} />
            </div>
          )}
        </div>
      )}

      {ev?.error && (
        <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: '0.76rem', color: '#f59e0b' }}>
          Task Adherence evaluation error: {ev.error}
        </div>
      )}

      {/* Agent Guardrail Enforcement */}
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          Agent Guardrail Enforcement
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.65rem 0.9rem',
          background: blocked ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
          border: `1px solid ${blocked ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
          borderRadius: 7,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: blocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {blocked ? <XCircle size={14} style={{ color: '#ef4444' }} /> : <CheckCircle size={14} style={{ color: '#10b981' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: blocked ? '#ef4444' : '#10b981' }}>
              {blocked ? 'GUARDRAIL TRIGGERED' : 'PASSED - Agent Responded'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bot size={11} />
              {result.agent_name || result.agent_id}
              <span style={{ padding: '0.06rem 0.3rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 700, background: `${COLOR}12`, color: COLOR, border: `1px solid ${COLOR}35` }}>
                {result.status}
              </span>
            </div>
          </div>
        </div>
        {result.assistant_response && (
          <div style={{ marginTop: '0.4rem', padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `3px solid ${COLOR}`, borderRadius: 5, fontSize: '0.78rem', lineHeight: 1.6, maxHeight: 130, overflowY: 'auto' }}>
            {result.assistant_response.length > 350 ? result.assistant_response.slice(0, 350) + '...' : result.assistant_response}
          </div>
        )}
        {'_raw_response' in result && (
          <div style={{ marginTop: '0.5rem' }}>
            <RawJsonView data={result._raw_response} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function TaskAdherenceFilter() {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState(null)
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [message, setMessage] = useState('')
  const [plannedTool, setPlannedTool] = useState(null)
  const [loading, setLoading] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    const sig = ctrl.signal

    apiFetch('/api/content-filters/filter/task_adherence/scenarios', { signal: sig })
      .then(r => r.json()).catch(() => [])
      .then(sc => { if (!sig.aborted) setScenarios(Array.isArray(sc) ? sc : []) })

    Promise.all([
      apiFetch('/api/content-filters/agents', { signal: sig }).then(r => r.json()).catch(() => []),
      apiFetch('/api/content-filters/filter/task_adherence/status', { signal: sig }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([ag, st]) => {
      if (sig.aborted) return
      const agList = Array.isArray(ag) ? ag : []
      setAgents(agList)
      if (st) setStatus(st)
      const demoName = st?.agent?.name
      const demoAg = (demoName && agList.find(a => a.name === demoName)) || agList[0]
      if (demoAg) setAgentId(prev => prev || demoAg.id || demoAg.name)
    })

    return () => ctrl.abort()
  }, [])

  const selectScenario = (s) => {
    setSelected(s)
    setMessage(s.message || '')
    setPlannedTool(s.planned_tool_call || null)
    setResult(null)
    const demoName = status?.agent?.name
    const demoAg = (demoName && agents.find(a => a.name === demoName)) || agents[0]
    if (demoAg) setAgentId(demoAg.id || demoAg.name)
  }

  const runTest = async () => {
    if (!message.trim() || !agentId) return
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/content-filters/test/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, agent_name: agentId, message, filter_type: 'task_adherence', planned_tool_call: plannedTool }),
      })
      const data = await r.json()
      setResult(r.ok ? data : { error: data.detail || `HTTP ${r.status}` })
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const provisionDemo = async () => {
    setProvisioning(true)
    try {
      await fetch('/api/content-filters/provision-demo?filter_type=task_adherence', { method: 'POST' })
      const [ag, st] = await Promise.all([
        apiFetch('/api/content-filters/agents').then(r => r.json()).catch(() => []),
        apiFetch('/api/content-filters/filter/task_adherence/status').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setAgents(Array.isArray(ag) ? ag : [])
      if (st) setStatus(st)
    } catch (_) {}
    setProvisioning(false)
  }

  const blockCount = scenarios.filter(s => s.tag === 'BLOCK').length
  const passCount = scenarios.filter(s => s.tag === 'PASS').length

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', borderLeft: `3px solid ${COLOR}` }}>
        <div className="feature-icon" style={{ background: `${COLOR}20`, marginTop: 2 }}>
          <GitBranch size={18} style={{ color: COLOR }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
            <h2 style={{ margin: 0 }}>Task Adherence</h2>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: `${COLOR}18`, color: COLOR, border: `1px solid ${COLOR}35`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Drift Filter</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 780, margin: 0 }}>
            Detects when an agent plans a tool invocation that does not match the user intent. Evaluates alignment between what the user asked for and what the agent was about to do — blocking misaligned actions such as executing trades when the user asked for a balance check, or deleting records when the user only wanted to view them.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
            <AlertTriangle size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Specialized capital markets agents have privileged system access. An agent executing a trade when asked for a balance check, or sending data externally when asked for an internal analysis, creates direct regulatory and financial risk.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{blockCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attack</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{passCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Baseline</div>
          </div>
        </div>
      </div>

      <StatusBanner status={status} onProvision={provisionDemo} provisioning={provisioning} />

      <div className="grid-2">
        {/* LEFT: Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Capital Markets Scenarios</h3>
              <span className="badge badge-cyan">{scenarios.length} Scenarios</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Each card shows the user message and the tool call the agent plans to execute. Red cards have a misaligned planned action — the tool call does not match what the user actually asked for.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {scenarios.map(s => (
                <ScenarioCard key={s.id} s={s} selected={selected?.id === s.id} onSelect={selectScenario} />
              ))}
            </div>
          </div>

          {status?.guardrail?.controls && (
            <div className="card">
              <div className="card-header">
                <h3>Active Controls</h3>
                <Shield size={14} style={{ color: COLOR }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {status.guardrail.controls.map((ctrl, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: `${COLOR}0a`, border: `1px solid ${COLOR}25`, borderRadius: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{ctrl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Test config + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Test Configuration</h3>
              <span style={{ padding: '0.1rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Bot size={11} /> Agent
              </span>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Agent</div>
              <select
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
              >
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                {agents.length === 0 && <option value={agentId}>{agentId || 'No agents loaded'}</option>}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>User Intent (Agent Message)</div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {plannedTool && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Agent Planned Tool Call</div>
                <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: `1px solid ${COLOR}30`, borderLeft: `3px solid ${COLOR}`, borderRadius: 5 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLOR, fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                    {plannedTool.name}
                    {plannedTool.description && (
                      <span style={{ fontWeight: 400, fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontFamily: 'inherit' }}>
                        {' '}- {plannedTool.description}
                      </span>
                    )}
                  </div>
                  {plannedTool.parameters && (
                    <pre style={{ margin: 0, fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.55, overflow: 'auto', maxHeight: 110, fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(plannedTool.parameters, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={runTest}
              disabled={loading || !agentId || !message.trim()}
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 6, background: (loading || !agentId || !message.trim()) ? 'var(--bg-elevated)' : COLOR, color: (loading || !agentId || !message.trim()) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (loading || !agentId || !message.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (!agentId || !message.trim()) ? 0.5 : 1 }}
            >
              {loading ? <><RefreshCw size={14} className="spin" /> Running...</> : <><Play size={14} /> Run Filter Test</>}
            </button>
          </div>

          {result && (
            <div className="card">
              <div className="card-header">
                <h3>Filter Enforcement Result</h3>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>AGENT TEST</span>
              </div>
              {result.error && !result.task_adherence_eval ? (
                <div style={{ padding: '0.65rem 0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: '0.78rem', color: '#f59e0b' }}>
                  <strong>Error:</strong> {result.error}
                </div>
              ) : (
                <ResultPanel result={result} />
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <BarChart2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Select a scenario and click Run Filter Test to see the task adherence evaluation and guardrail enforcement result.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

