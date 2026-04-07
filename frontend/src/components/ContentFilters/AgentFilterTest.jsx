import { useState, useEffect } from 'react'
import { Users, Play, RefreshCw, Shield, ShieldOff, AlertTriangle, CheckCircle, Bot, MessageSquare, Clock } from 'lucide-react'
import { RawJsonView } from '../Common/FeaturePage'
import { apiFetch } from '../../lib/apiFetch'

const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS: { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
}

const CATEGORY_COLORS = {
  Jailbreak: '#ef4444', 'Indirect Attack': '#8b5cf6', Hate: '#f97316',
  Violence: '#dc2626', Sexual: '#ec4899', 'Self-Harm': '#f59e0b',
  'Protected Material (Text)': '#3b82f6', 'Protected Material (Code)': '#0ea5e9',
  PII: '#10b981', 'Task Adherence': '#6366f1', Groundedness: '#6366f1', Profanity: '#6b7280',
}
const SEV_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', safe: '#10b981' }

// Map scenario category string to filter_type key used by the backend
const CATEGORY_TO_FILTER_TYPE = {
  'Jailbreak': 'jailbreak',
  'Indirect Attack': 'xpia',
  'Task Adherence': 'task_adherence',
  'PII / Data Leakage': 'pii',
  'PII': 'pii',
  'Content Safety': 'content_safety',
}

function CategoryRow({ cat }) {
  const sevColor = SEV_COLORS[cat.severity] || '#6b7280'
  const catColor = CATEGORY_COLORS[cat.category] || '#6b7280'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.4rem 0.6rem',
      background: cat.filtered ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
      border: `1px solid ${cat.filtered ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
      borderRadius: 4,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 500 }}>{cat.category}</span>
      <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '0.08rem 0.3rem', borderRadius: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {cat.point === 'input' ? 'INPUT' : 'OUTPUT'}
      </span>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.4rem', borderRadius: 3, background: `${sevColor}20`, color: sevColor, border: `1px solid ${sevColor}40` }}>
        {(cat.severity || 'safe').toUpperCase()}
      </span>
      {cat.filtered
        ? <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>BLOCKED</span>
        : <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>PASS</span>
      }
    </div>
  )
}

const GUARDRAIL_COLORS = {
  'Guardrails472': '#8b5cf6',
  'Microsoft.Default': '#3b82f6',
  'Microsoft.DefaultV2': '#3b82f6',
  'None': '#6b7280',
}

function AgentCard({ agent, selected, onSelect }) {
  const gc = GUARDRAIL_COLORS[agent.guardrail] || '#6b7280'
  return (
    <button
      onClick={() => onSelect(agent)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        padding: '0.65rem 0.75rem', textAlign: 'left', cursor: 'pointer',
        background: selected ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
        border: `1px solid ${selected ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
        borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
        <span style={{ padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: `${gc}20`, color: gc, border: `1px solid ${gc}40`, flexShrink: 0 }}>
          {agent.guardrail}
        </span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Model: {agent.model || '--'}</div>
      {agent.instructions_preview && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {agent.instructions_preview}
        </div>
      )}
    </button>
  )
}

function RunStatusBadge({ status }) {
  const map = {
    completed: { color: '#10b981', label: 'Completed' },
    failed: { color: '#ef4444', label: 'Failed' },
    cancelled: { color: '#6b7280', label: 'Cancelled' },
    expired: { color: '#f59e0b', label: 'Expired' },
    in_progress: { color: '#3b82f6', label: 'Running' },
    queued: { color: '#6b7280', label: 'Queued' },
    unknown: { color: '#6b7280', label: 'Unknown' },
  }
  const s = map[status] || map.unknown
  return (
    <span style={{ padding: '0.2rem 0.5rem', borderRadius: 3, fontSize: '0.68rem', fontWeight: 700, background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
      {s.label}
    </span>
  )
}

function GuardrailInfoPanel({ agent }) {
  if (!agent) return null
  const gc = GUARDRAIL_COLORS[agent.guardrail] || '#6b7280'
  const controls = {
    'Guardrails472': ['Jailbreak', 'Content Safety', 'Task Adherence', 'Indirect Attack', 'PII'],
    'Microsoft.Default': ['Jailbreak', 'Content Safety', 'Protected Material'],
    'Microsoft.DefaultV2': ['Jailbreak', 'Content Safety', 'Protected Material', 'Indirect Attack'],
    'None': [],
  }
  const ctrl = controls[agent.guardrail] || []
  return (
    <div style={{
      padding: '0.65rem 0.75rem', background: `${gc}10`,
      border: `1px solid ${gc}30`, borderRadius: 6, marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <Shield size={13} style={{ color: gc }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: gc }}>Guardrail: {agent.guardrail}</span>
      </div>
      {ctrl.length > 0 ? (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {ctrl.map(c => (
            <span key={c} style={{ padding: '0.1rem 0.4rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 600, background: `${gc}20`, color: gc, border: `1px solid ${gc}35` }}>{c}</span>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No guardrail assigned - this agent is unprotected</span>
      )}
    </div>
  )
}

export default function AgentFilterTest() {
  const [agents, setAgents] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    const sig = ctrl.signal
    Promise.all([
      apiFetch('/api/content-filters/agents', { signal: sig }).then(r => r.json()),
      apiFetch('/api/content-filters/scenarios/agent', { signal: sig }).then(r => r.json()),
    ]).then(([ag, sc]) => {
      if (sig.aborted) return
      setAgents(Array.isArray(ag) ? ag : [])
      setScenarios(Array.isArray(sc) ? sc : [])
      if (ag.length > 0) setSelectedAgent(ag[0])
    }).catch(() => {})
    return () => ctrl.abort()
  }, [])

  const selectScenario = (s) => {
    setSelectedScenario(s)
    setMessage(s.message)
    setResult(null)
  }

  const runTest = async () => {
    if (!selectedAgent || !message.trim()) return
    setLoading(true); setResult(null)
    try {
      const filterType = CATEGORY_TO_FILTER_TYPE[selectedScenario?.category] || ''
      const body = {
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        message,
        filter_type: filterType,
      }
      const r = await fetch('/api/content-filters/test/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) { setResult({ error: data.detail || `HTTP ${r.status}` }); return }
      setResult(data)
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', borderLeft: '3px solid #f59e0b',
      }}>
        <div className="feature-icon" style={{ background: '#f59e0b20', marginTop: 2 }}>
          <Users size={18} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Agent Filter Test</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 720 }}>
            Test guardrail enforcement directly on Foundry agents. Creates a live thread, sends your message, runs the agent, and captures any guardrail block events. Demonstrates how agent-level guardrails stop task drift, jailbreaks, PII exfiltration, and social engineering in capital markets workflows.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left - agent selection + scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Agent list */}
          <div className="card">
            <div className="card-header">
              <h3>Select Agent</h3>
              <span className="badge badge-cyan">{agents.length} Available</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {agents.map(a => (
                <AgentCard key={a.id} agent={a} selected={selectedAgent?.id === a.id} onSelect={ag => { setSelectedAgent(ag); setResult(null) }} />
              ))}
            </div>
          </div>

          {/* Scenario list */}
          <div className="card">
            <div className="card-header">
              <h3>Attack Scenarios</h3>
              <span className="badge badge-cyan">{scenarios.length} Scenarios</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {scenarios.map(s => {
                const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
                return (
                  <button
                    key={s.id}
                    onClick={() => selectScenario(s)}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '0.2rem',
                      padding: '0.6rem 0.75rem', textAlign: 'left', cursor: 'pointer',
                      background: selectedScenario?.id === s.id ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
                      border: `1px solid ${selectedScenario?.id === s.id ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                      borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</span>
                      <span style={{ padding: '0.12rem 0.4rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text, flexShrink: 0 }}>{s.tag}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.category} - {s.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right - test area + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Test Message</h3>
              {selectedAgent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bot size={13} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedAgent.name}</span>
                </div>
              )}
            </div>

            {/* Guardrail info for selected agent */}
            {selectedAgent && <GuardrailInfoPanel agent={selectedAgent} />}

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message to send to the selected agent, or pick a scenario above..."
              rows={6}
              style={{ marginBottom: '0.75rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => { setMessage(''); setResult(null); setSelectedScenario(null) }} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                <RefreshCw size={12} /> Clear
              </button>
              <button className="btn-primary" onClick={runTest} disabled={loading || !message.trim() || !selectedAgent}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
                {loading ? 'Running Agent...' : 'Run Agent Test'}
              </button>
            </div>

            {loading && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={13} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.78rem', color: '#3b82f6' }}>Creating thread, running agent, polling for result (up to 30s)...</span>
              </div>
            )}
          </div>

          {/* Error */}
          {result?.error && (
            <div className="card fade-in" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '0.8rem', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>{result.error}</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !result.error && (
            <div className="card fade-in">
              {/* Verdict */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                background: result.guardrail_triggered ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${result.guardrail_triggered ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                borderRadius: 6, marginBottom: '1rem',
              }}>
                {result.guardrail_triggered
                  ? <ShieldOff size={20} style={{ color: '#ef4444' }} />
                  : <Shield size={20} style={{ color: '#10b981' }} />
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: result.guardrail_triggered ? '#ef4444' : '#10b981', fontSize: '0.95rem' }}>
                    {result.guardrail_triggered ? 'GUARDRAIL TRIGGERED' : 'REQUEST PROCESSED'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Agent: {result.agent_name} &bull; Run: {result.run_id?.slice(0, 16) || '--'}
                  </div>
                </div>
                <RunStatusBadge status={result.status} />
              </div>

              {/* Filter categories */}
              {(result.filter_categories || []).length > 0 && (() => {
                const cats = result.filter_categories
                const inputCats = cats.filter(c => c.point === 'input')
                const outputCats = cats.filter(c => c.point === 'output')
                return (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Filter Decisions ({cats.length} categories evaluated)
                    </div>
                    {inputCats.length > 0 && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>INPUT</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {inputCats.map((c, i) => <CategoryRow key={i} cat={c} />)}
                        </div>
                      </div>
                    )}
                    {outputCats.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>OUTPUT</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {outputCats.map((c, i) => <CategoryRow key={i} cat={c} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Filter events (fallback when no categories) */}
              {(result.filter_categories || []).length === 0 && (result.filter_events || []).length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Guardrail Events
                  </div>
                  {(result.filter_events || []).map((ev, i) => (
                    <div key={i} style={{ padding: '0.5rem 0.65rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                      <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '0.2rem' }}>{ev.type || 'guardrail_block'} - {ev.code}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{ev.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Run details */}
              {result.run_details?.last_error && Object.keys(result.run_details.last_error).length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Run Error
                  </div>
                  <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5 }}>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {JSON.stringify(result.run_details.last_error, null, 2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Assistant response */}
              {result.assistant_response && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Agent Response
                  </div>
                  <div style={{
                    padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 6, fontSize: '0.82rem', lineHeight: 1.7, maxHeight: 250, overflowY: 'auto',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <Bot size={13} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>{result.agent_name}</span>
                    </div>
                    {result.assistant_response}
                  </div>
                </div>
              )}

              {/* Thread info */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {[
                  { label: 'Thread ID', value: result.thread_id?.slice(0, 20) + '...' },
                  { label: 'Run ID', value: result.run_id?.slice(0, 20) + '...' },
                  { label: 'Status', value: result.status },
                ].filter(s => s.value && s.value !== 'undefined...').map(s => (
                  <div key={s.label} style={{ padding: '0.25rem 0.6rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <RawJsonView data={result} />
            </div>
          )}

          {/* Info card when no agent selected */}
          {!selectedAgent && (
            <div className="card" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <MessageSquare size={14} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Select an agent from the list to see its assigned guardrail, then pick a scenario or type a custom message to test how the guardrail enforces policy.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
