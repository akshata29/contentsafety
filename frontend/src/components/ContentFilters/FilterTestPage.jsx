import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/apiFetch'
import {
  Play, RefreshCw, Shield, ShieldOff, CheckCircle, XCircle,
  Bot, Cpu, Zap, AlertTriangle, ChevronDown, ChevronRight,
  Server, Info, Clock, BarChart2,
} from 'lucide-react'

/* =========================================================
 * Shared constants
 * ========================================================= */
const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS:  { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
}

const CATEGORY_COLORS = {
  Jailbreak: '#ef4444',
  'Indirect Attack': '#8b5cf6',
  Hate: '#f97316',
  Violence: '#dc2626',
  Sexual: '#ec4899',
  'Self-Harm': '#f59e0b',
  'Protected Material (Text)': '#3b82f6',
  'Protected Material (Code)': '#0ea5e9',
  PII: '#10b981',
  'Task Adherence': '#6366f1',
  Groundedness: '#6366f1',
  Profanity: '#6b7280',
  PolicyViolation: '#ef4444',
}

const SEV_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', safe: '#10b981' }

/* =========================================================
 * Sub-components
 * ========================================================= */

function ScenarioCard({ s, selected, onSelect, accentColor }) {
  const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
  const isSelected = selected
  return (
    <button
      onClick={() => onSelect(s)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
        padding: '0.65rem 0.75rem', textAlign: 'left', cursor: 'pointer',
        background: isSelected ? `${accentColor}12` : 'var(--bg-elevated)',
        border: `1px solid ${isSelected ? accentColor + '60' : 'var(--border)'}`,
        borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{s.label}</span>
        <span style={{
          padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700,
          background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text, flexShrink: 0,
        }}>{s.tag}</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {s.category}
        </span>
        <span style={{
          padding: '0.1rem 0.35rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 600,
          background: s.preferred_target === 'agent' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
          color: s.preferred_target === 'agent' ? '#8b5cf6' : '#3b82f6',
        }}>
          {s.preferred_target === 'agent' ? 'Agent' : 'Model'}
        </span>
      </div>
    </button>
  )
}

function GuardrailStatusBanner({ status, accentColor, onProvision, provisioning }) {
  if (!status) return null

  const gr = status.guardrail || {}
  const ag = status.agent || {}
  const grExists = gr.exists
  const agExists = ag.exists
  const allReady = grExists && agExists

  return (
    <div style={{
      padding: '0.75rem 1rem',
      background: allReady ? `${accentColor}0d` : 'rgba(245,158,11,0.06)',
      border: `1px solid ${allReady ? accentColor + '35' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 8, marginBottom: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      {/* Guardrail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: grExists ? `${accentColor}20` : 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {grExists
            ? <Shield size={14} style={{ color: accentColor }} />
            : <ShieldOff size={14} style={{ color: '#f59e0b' }} />
          }
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: grExists ? accentColor : '#f59e0b' }}>
            {gr.name || 'Demo Guardrail'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {grExists ? (gr.controls || []).join(' + ') : 'Not yet provisioned'}
          </div>
        </div>
        {grExists && (
          <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 3, background: '#10b98120', color: '#10b981', border: '1px solid #10b98135' }}>LIVE</span>
        )}
      </div>

      {/* Agent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: agExists ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={14} style={{ color: agExists ? '#8b5cf6' : '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: agExists ? '#8b5cf6' : '#f59e0b' }}>
            {ag.name || 'Demo Agent'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {agExists ? `${ag.model || 'chat4o'} | Ready for testing` : 'Not yet provisioned'}
          </div>
        </div>
        {agExists && (
          <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 3, background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf635' }}>LIVE</span>
        )}
      </div>

      {/* Provision button */}
      {!allReady && (
        <button
          onClick={onProvision}
          disabled={provisioning}
          style={{
            padding: '0.4rem 0.9rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600,
            background: accentColor, color: '#fff', border: 'none', cursor: provisioning ? 'not-allowed' : 'pointer',
            opacity: provisioning ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0,
          }}
        >
          {provisioning ? <RefreshCw size={12} className="spin" /> : <Zap size={12} />}
          {provisioning ? 'Provisioning...' : 'Provision Demo Resources'}
        </button>
      )}
    </div>
  )
}

function CategoryRow({ cat }) {
  const filtered = cat.filtered
  const sev = cat.severity || 'safe'
  const sevColor = SEV_COLORS[sev] || '#6b7280'
  const catColor = CATEGORY_COLORS[cat.category] || '#6b7280'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.4rem 0.6rem',
      background: filtered ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
      border: `1px solid ${filtered ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
      borderRadius: 4,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 500 }}>{cat.category}</span>
      <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '0.08rem 0.3rem', borderRadius: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {cat.point === 'input' ? 'INPUT' : 'OUTPUT'}
      </span>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.4rem', borderRadius: 3, background: `${sevColor}20`, color: sevColor, border: `1px solid ${sevColor}40` }}>
        {sev.toUpperCase()}
      </span>
      {filtered
        ? <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
        : <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
      }
    </div>
  )
}

function ModelResult({ result, accentColor }) {
  const blocked = result.blocked
  const cats = result.filter_categories || []
  const inputCats = cats.filter(c => c.point === 'input')
  const outputCats = cats.filter(c => c.point === 'output')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Verdict */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: blocked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${blocked ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
        borderRadius: 7,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: blocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {blocked
            ? <XCircle size={18} style={{ color: '#ef4444' }} />
            : <CheckCircle size={18} style={{ color: '#10b981' }} />
          }
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: blocked ? '#ef4444' : '#10b981' }}>
            {blocked ? 'BLOCKED BY CONTENT FILTER' : 'PASSED - Response Allowed'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {blocked ? (result.block_reason || 'Azure content filter policy violation') : `Model: ${result.deployment || 'chat4o'}`}
          </div>
        </div>
      </div>

      {/* Filter categories */}
      {cats.length > 0 && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.4rem' }}>
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
      )}

      {/* Model response */}
      {result.model_response && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.35rem' }}>
            Model Response (Passed Filter)
          </div>
          <div style={{
            padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${accentColor}`, borderRadius: 5,
            fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-primary)',
            maxHeight: 160, overflowY: 'auto',
          }}>
            {result.model_response.length > 400 ? result.model_response.slice(0, 400) + '...' : result.model_response}
          </div>
        </div>
      )}
    </div>
  )
}

function AgentResult({ result, accentColor }) {
  const triggered = result.guardrail_triggered
  const status = result.status

  const statusColors = {
    completed: '#10b981', failed: '#ef4444', cancelled: '#6b7280',
    expired: '#f59e0b', in_progress: '#3b82f6', unknown: '#6b7280',
  }
  const sc = statusColors[status] || '#6b7280'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Verdict */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: triggered ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${triggered ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
        borderRadius: 7,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: triggered ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {triggered
            ? <XCircle size={18} style={{ color: '#ef4444' }} />
            : <CheckCircle size={18} style={{ color: '#10b981' }} />
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: triggered ? '#ef4444' : '#10b981' }}>
            {triggered ? 'GUARDRAIL TRIGGERED' : 'PASSED - Agent Responded'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={11} />
            {result.agent_name || result.agent_id}
            <span style={{ padding: '0.08rem 0.3rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 700, background: `${sc}20`, color: sc, border: `1px solid ${sc}35` }}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Filter categories (same grid as ModelResult) */}
      {(result.filter_categories || []).length > 0 && (() => {
        const cats = result.filter_categories
        const inputCats = cats.filter(c => c.point === 'input')
        const outputCats = cats.filter(c => c.point === 'output')
        return (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.4rem' }}>
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

      {/* Filter events (fallback detail when no categories) */}
      {(result.filter_categories || []).length === 0 && (result.filter_events || []).length > 0 && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.4rem' }}>
            Guardrail Events
          </div>
          {result.filter_events.map((ev, i) => (
            <div key={i} style={{
              padding: '0.45rem 0.6rem', background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: 5,
              fontSize: '0.72rem', lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 700, color: '#ef4444' }}>{ev.code || ev.type}: </span>
              <span style={{ color: 'var(--text-muted)' }}>{ev.message || 'Request blocked by guardrail policy'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thread info */}
      {result.thread_id && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[['Thread', result.thread_id], ['Run', result.run_id]].map(([label, val]) => val && (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>{label} ID</div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent response */}
      {result.assistant_response && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.35rem' }}>
            Agent Response (Passed Guardrail)
          </div>
          <div style={{
            padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${accentColor}`, borderRadius: 5,
            fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-primary)',
            maxHeight: 160, overflowY: 'auto',
          }}>
            {result.assistant_response.length > 400 ? result.assistant_response.slice(0, 400) + '...' : result.assistant_response}
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================
 * Main FilterTestPage component
 * ========================================================= */

/**
 * Props:
 *   filterType  - string key: jailbreak | xpia | content_safety | task_adherence | pii | protected_material
 *   title       - display name
 *   subtitle    - sub-label shown in header
 *   description - paragraph describing this filter
 *   icon        - LucideIcon component
 *   color       - hex accent color
 *   guardRailLabel - short label describing what guardrail protects
 *   financialContext - one-sentence financial industry context
 */
export default function FilterTestPage({
  filterType, title, subtitle, description,
  icon: Icon, color, guardRailLabel, financialContext,
}) {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState(null)
  const [models, setModels] = useState([])
  const [agents, setAgents] = useState([])

  const [targetType, setTargetType] = useState('model')
  const [targetId, setTargetId] = useState('')
  const [message, setMessage] = useState('')
  const [sysPrompt, setSysPrompt] = useState('')
  const [showSys, setShowSys] = useState(false)

  const [loading, setLoading] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [result, setResult] = useState(null)

  const loadStatus = async (signal) => {
    try {
      const r = await apiFetch(`/api/content-filters/filter/${filterType}/status`, { signal })
      if (r.ok) setStatus(await r.json())
    } catch (_) {}
  }

  useEffect(() => {
    const ctrl = new AbortController()
    const sig = ctrl.signal

    // Scenarios load independently — don't block on slow deployment/agent API calls
    apiFetch(`/api/content-filters/filter/${filterType}/scenarios`, { signal: sig })
      .then(r => r.json()).catch(() => [])
      .then(sc => {
        if (sig.aborted) return
        setScenarios(Array.isArray(sc) ? sc : [])
      })

    // Deployments, agents, and status can take longer (Azure API calls)
    Promise.all([
      apiFetch('/api/content-filters/deployments', { signal: sig }).then(r => r.json()).catch(() => []),
      apiFetch('/api/content-filters/agents', { signal: sig }).then(r => r.json()).catch(() => []),
      apiFetch(`/api/content-filters/filter/${filterType}/status`, { signal: sig }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([dep, ag, st]) => {
      if (sig.aborted) return
      const depList = Array.isArray(dep) ? dep : []
      const agList = Array.isArray(ag) ? ag : []
      setModels(depList)
      setAgents(agList)
      // Only set a default targetId if the user hasn't already picked something
      // (e.g. by selecting a scenario before this slow API call resolved).
      // Use functional updater so we read the current value without a stale closure.
      if (depList.length > 0) setTargetId(prev => prev || depList[0].id)
      // If we're waiting in agent mode with no id yet, fill in the demo agent now
      setTargetType(prev => {
        if (prev === 'agent' && agList.length > 0) {
          setTargetId(cur => {
            if (cur) return cur
            const demoName = st?.agent?.name
            const demoAg = agList.find(a => a.name === demoName) || agList[0]
            return demoAg?.id || cur
          })
        }
        return prev
      })
      if (st) setStatus(st)
    })

    return () => ctrl.abort()
  }, [filterType])

  const selectScenario = (s) => {
    setSelected(s)
    setMessage(s.message || '')
    setSysPrompt(s.system_prompt || '')
    setResult(null)
    const pref = s.preferred_target || 'model'
    setTargetType(pref)
    if (pref === 'agent') {
      // prefer the demo agent for this filter type
      const demoAgName = status?.agent?.name
      const demoAg = agents.find(a => a.name === demoAgName) || agents[0]
      if (demoAg) setTargetId(demoAg.id)
    } else {
      const dep = s.deployment || (models[0]?.id)
      if (dep) setTargetId(dep)
    }
    setShowSys(true)
  }

  const runTest = async () => {
    if (!message.trim() || !targetId) return
    setLoading(true); setResult(null)
    try {
      if (targetType === 'model') {
        const r = await fetch('/api/content-filters/test/model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deployment: targetId, messages: [{ role: 'user', content: message }], system_prompt: sysPrompt, filter_type: filterType }),
        })
        const data = await r.json()
        setResult(r.ok ? { ...data, _mode: 'model' } : { error: data.detail || `HTTP ${r.status}`, _mode: 'model' })
      } else {
        const agent = agents.find(a => a.id === targetId)
        const r = await fetch('/api/content-filters/test/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: targetId, agent_name: agent?.name || targetId, message, filter_type: filterType }),
        })
        const data = await r.json()
        setResult(r.ok ? { ...data, _mode: 'agent' } : { error: data.detail || `HTTP ${r.status}`, _mode: 'agent' })
      }
    } catch (e) {
      setResult({ error: e.message, _mode: targetType })
    } finally {
      setLoading(false)
    }
  }

  const provisionDemo = async () => {
    setProvisioning(true)
    try {
      const r = await fetch(`/api/content-filters/provision-demo?filter_type=${filterType}`, { method: 'POST' })
      if (r.ok) {
        await loadStatus()
        const ag = await apiFetch('/api/content-filters/agents').then(res => res.json()).catch(() => [])
        setAgents(Array.isArray(ag) ? ag : [])
      }
    } catch (_) {}
    setProvisioning(false)
  }

  const totalScenarios = scenarios.length
  const blockScens = scenarios.filter(s => s.tag === 'BLOCK').length
  const passScens = scenarios.filter(s => s.tag === 'PASS').length

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '1rem', borderLeft: `3px solid ${color}`,
      }}>
        <div className="feature-icon" style={{ background: `${color}20`, marginTop: 2 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: `${color}18`, color, border: `1px solid ${color}35`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {subtitle}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 780, margin: 0 }}>{description}</p>
          {financialContext && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
              <AlertTriangle size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>{financialContext}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{blockScens}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attack</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{passScens}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Baseline</div>
          </div>
        </div>
      </div>

      {/* Demo Guardrail + Agent status banner */}
      <GuardrailStatusBanner
        status={status}
        accentColor={color}
        onProvision={provisionDemo}
        provisioning={provisioning}
      />

      <div className="grid-2">
        {/* LEFT: Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Capital Markets Scenarios</h3>
              <span className="badge badge-cyan">{totalScenarios} Scenarios</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Select a scenario to pre-populate the test input. Red cards are expected to be blocked by the {guardRailLabel || title} filter.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {scenarios.map(s => (
                <ScenarioCard
                  key={s.id}
                  s={s}
                  selected={selected?.id === s.id}
                  onSelect={selectScenario}
                  accentColor={color}
                />
              ))}
            </div>
          </div>

          {/* Guardrail info box */}
          {status?.guardrail?.controls && (
            <div className="card">
              <div className="card-header">
                <h3>Active Controls</h3>
                <Shield size={14} style={{ color }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {status.guardrail.controls.map((ctrl, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 0.6rem', background: `${color}0a`,
                    border: `1px solid ${color}25`, borderRadius: 5,
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{ctrl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Test configuration + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Test Configuration</h3>
              {/* Target type toggle */}
              <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {[{ val: 'model', label: 'Model', Icon: Cpu }, { val: 'agent', label: 'Agent', Icon: Bot }].map(opt => {
                  const lockedTo = selected?.preferred_target
                  const isLocked = lockedTo && lockedTo !== opt.val
                  return (
                    <button
                      key={opt.val}
                      disabled={isLocked}
                      onClick={() => {
                        setTargetType(opt.val)
                        setResult(null)
                        if (opt.val === 'model' && models.length > 0) setTargetId(models[0].id)
                        if (opt.val === 'agent' && agents.length > 0) {
                          const demoName = status?.agent?.name
                          const demoAg = agents.find(a => a.name === demoName) || agents[0]
                          setTargetId(demoAg?.id || '')
                        }
                      }}
                      title={isLocked ? `This scenario is designed for ${lockedTo} testing` : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.65rem', fontSize: '0.73rem', fontWeight: 600,
                        background: targetType === opt.val ? color : 'transparent',
                        border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer',
                        color: targetType === opt.val ? '#fff' : isLocked ? 'var(--border)' : 'var(--text-muted)',
                        opacity: isLocked ? 0.4 : 1,
                        transition: 'all 0.12s',
                      }}
                    >
                      <opt.Icon size={12} /> {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target selector */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
                {targetType === 'model' ? 'Model Deployment' : 'Agent'}
              </label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {(targetType === 'model' ? models : agents).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.id}
                    {item.model ? ` (${item.model})` : ''}
                    {item.name === status?.agent?.name ? ' [Demo]' : ''}
                  </option>
                ))}
                {(targetType === 'model' ? models : agents).length === 0 && (
                  <option value="">No {targetType}s available</option>
                )}
              </select>
            </div>

            {/* System prompt (model only, collapsible) */}
            {targetType === 'model' && (
              <div style={{ marginBottom: '0.75rem' }}>
                <button
                  onClick={() => setShowSys(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                    background: 'none', border: 'none', padding: 0, marginBottom: showSys ? '0.35rem' : 0,
                  }}
                >
                  {showSys ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  System Prompt
                </button>
                {showSys && (
                  <textarea
                    value={sysPrompt}
                    onChange={e => setSysPrompt(e.target.value)}
                    rows={3}
                    placeholder="Optional system prompt..."
                    style={{ width: '100%', resize: 'vertical', padding: '0.5rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}
                  />
                )}
              </div>
            )}

            {/* Message input */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
                {targetType === 'model' ? 'User Message' : 'Agent Message'}
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                placeholder={`Enter a ${targetType === 'model' ? 'message for the model' : 'message for the agent'}...`}
                style={{ width: '100%', resize: 'vertical', padding: '0.5rem 0.65rem', fontSize: '0.78rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', lineHeight: 1.6 }}
              />
            </div>

            <button
              onClick={runTest}
              disabled={loading || !message.trim() || !targetId}
              style={{
                width: '100%', padding: '0.6rem', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700,
                background: loading || !message.trim() || !targetId ? 'var(--bg-elevated)' : color,
                color: loading || !message.trim() || !targetId ? 'var(--text-muted)' : '#fff',
                border: `1px solid ${loading || !message.trim() || !targetId ? 'var(--border)' : color}`,
                cursor: loading || !message.trim() || !targetId ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.12s',
              }}
            >
              {loading ? <><RefreshCw size={14} className="spin" /> Running Filter Test...</> : <><Play size={14} /> Run Filter Test</>}
            </button>

            {loading && targetType === 'agent' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 5 }}>
                <Clock size={11} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>Agent run in progress - polling for completion (up to 30s)</span>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="card" style={{ borderLeft: `3px solid ${result.error ? '#f59e0b' : result.blocked || result.guardrail_triggered ? '#ef4444' : '#10b981'}` }}>
              <div className="card-header">
                <h3>Filter Enforcement Result</h3>
                {result._mode === 'model' && <span className="badge badge-cyan">Model Test</span>}
                {result._mode === 'agent' && <span className="badge badge-cyan">Agent Test</span>}
              </div>
              {/* Mismatch warning: expected BLOCK but passed */}
              {!result.error && selected?.tag === 'BLOCK' && !result.blocked && !result.guardrail_triggered && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.55rem 0.75rem', marginBottom: '0.75rem',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 6,
                }}>
                  <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', lineHeight: 1.5 }}>
                    <strong>Expected: BLOCK</strong> - This attack scenario is designed to be blocked when
                    the {guardRailLabel || title} filter is active and properly configured on this deployment.
                    The model responded without restriction, which may indicate the filter policy is not
                    applied or the attack is too subtle for the current threshold.
                  </span>
                </div>
              )}
              {result.error && !result.filter_categories ? (
                <div style={{ padding: '0.65rem 0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: '0.78rem', color: '#f59e0b' }}>
                  <strong>Error:</strong> {result.error}
                </div>
              ) : result._mode === 'agent' ? (
                <AgentResult result={result} accentColor={color} />
              ) : (
                <ModelResult result={result} accentColor={color} />
              )}
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <BarChart2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Select a scenario and click Run Filter Test to see live filter enforcement results.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
