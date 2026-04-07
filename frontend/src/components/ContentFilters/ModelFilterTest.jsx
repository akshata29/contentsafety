import { useState, useEffect } from 'react'
import { Cpu, Play, RefreshCw, ShieldOff, Shield, AlertTriangle, CheckCircle, Info, ChevronDown } from 'lucide-react'
import { RawJsonView } from '../Common/FeaturePage'

const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS: { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
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
  Groundedness: '#6366f1',
  Profanity: '#6b7280',
}

const SEV_ORDER = { high: 3, medium: 2, low: 1, safe: 0 }
const SEV_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6', safe: '#10b981' }

function ScenarioCard({ s, selected, onSelect }) {
  const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
  return (
    <button
      onClick={() => onSelect(s)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
        padding: '0.65rem 0.75rem', textAlign: 'left', cursor: 'pointer',
        background: selected ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
        border: `1px solid ${selected ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
        borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>{s.label}</span>
        <span style={{ padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text, flexShrink: 0 }}>
          {s.tag}
        </span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</div>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>{s.category}</span>
    </button>
  )
}

function CategoryRow({ cat }) {
  const filtered = cat.filtered
  const sev = cat.severity || 'safe'
  const sevColor = SEV_COLORS[sev] || '#6b7280'
  const catColor = CATEGORY_COLORS[cat.category] || '#6b7280'
  const isInput = cat.point === 'input'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.45rem 0.65rem',
      background: filtered ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
      border: `1px solid ${filtered ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
      borderRadius: 5,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 500 }}>{cat.category}</span>
      <span style={{
        fontSize: '0.6rem', fontWeight: 600,
        padding: '0.1rem 0.35rem', borderRadius: 3,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}>
        {isInput ? 'INPUT' : 'OUTPUT'}
      </span>
      <span style={{
        fontSize: '0.68rem', fontWeight: 700,
        padding: '0.15rem 0.45rem', borderRadius: 3,
        background: `${sevColor}20`, color: sevColor, border: `1px solid ${sevColor}40`,
      }}>
        {sev.toUpperCase()}
      </span>
      {filtered
        ? <Shield size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
        : <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />
      }
    </div>
  )
}

export default function ModelFilterTest() {
  const [scenarios, setScenarios] = useState([])
  const [deployments, setDeployments] = useState([])
  const [selected, setSelected] = useState(null)
  const [deployment, setDeployment] = useState('')
  const [sysPrompt, setSysPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showSysPrompt, setShowSysPrompt] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/content-filters/scenarios/model').then(r => r.json()),
      fetch('/api/content-filters/deployments').then(r => r.json()),
    ]).then(([sc, dep]) => {
      setScenarios(Array.isArray(sc) ? sc : [])
      const deps = Array.isArray(dep) ? dep : []
      setDeployments(deps)
      if (deps.length > 0 && !deployment) setDeployment(deps[0].id)
    }).catch(() => {})
  }, [])

  const selectScenario = (s) => {
    setSelected(s)
    setMessage(s.message)
    setSysPrompt(s.system_prompt || '')
    setDeployment(s.deployment || deployment)
    setResult(null)
    setShowSysPrompt(true)
  }

  const runTest = async () => {
    if (!message.trim()) return
    setLoading(true); setResult(null)
    try {
      const body = {
        deployment: deployment || deployments[0]?.id || 'chat4o',
        messages: [{ role: 'user', content: message }],
        system_prompt: sysPrompt,
      }
      const r = await fetch('/api/content-filters/test/model', {
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

  const ANY_FILTERED = result && !result.error && (result.filter_categories || []).some(c => c.filtered)
  const inputCats = (result?.filter_categories || []).filter(c => c.point === 'input')
  const outputCats = (result?.filter_categories || []).filter(c => c.point === 'output')
  const maxSev = (result?.filter_categories || []).reduce((m, c) => Math.max(m, SEV_ORDER[c.severity] ?? 0), 0)

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', borderLeft: '3px solid #f59e0b',
      }}>
        <div className="feature-icon" style={{ background: '#f59e0b20', marginTop: 2 }}>
          <Cpu size={18} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Model Filter Test</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 720 }}>
            Send messages to deployed models and see exactly how content filters respond. Each result shows per-category filter decisions, severity ratings, and whether the response was blocked or allowed through - on both the input and output layers.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left - scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Financial Attack Scenarios</h3>
              <span className="badge badge-cyan">7 Scenarios</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {scenarios.map(s => (
                <ScenarioCard key={s.id} s={s} selected={selected?.id === s.id} onSelect={selectScenario} />
              ))}
            </div>
          </div>
        </div>

        {/* Right - input + result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Test Configuration</h3>
              {deployments.length > 0 && (
                <select
                  value={deployment}
                  onChange={e => setDeployment(e.target.value)}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {deployments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.model})</option>)}
                </select>
              )}
            </div>

            {/* System prompt collapsible */}
            <div style={{ marginBottom: '0.75rem' }}>
              <button
                onClick={() => setShowSysPrompt(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: 0, marginBottom: '0.35rem' }}
              >
                <ChevronDown size={12} style={{ transform: showSysPrompt ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                System Prompt (optional)
              </button>
              {showSysPrompt && (
                <textarea
                  value={sysPrompt}
                  onChange={e => setSysPrompt(e.target.value)}
                  placeholder="Define the model role and constraints..."
                  rows={3}
                  style={{ width: '100%', fontSize: '0.78rem' }}
                />
              )}
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>User Message</div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message or select a scenario above..."
                rows={6}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => { setMessage(''); setSysPrompt(''); setResult(null); setSelected(null) }} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                <RefreshCw size={12} /> Clear
              </button>
              <button className="btn-primary" onClick={runTest} disabled={loading || !message.trim()}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
                Run Filter Test
              </button>
            </div>
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

          {/* Results */}
          {result && !result.error && (
            <div className="card fade-in">
              {/* Verdict banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: result.blocked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${result.blocked ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                borderRadius: 6, marginBottom: '1rem',
              }}>
                {result.blocked
                  ? <ShieldOff size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  : <Shield size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: result.blocked ? '#ef4444' : '#10b981', fontSize: '0.95rem' }}>
                    {result.blocked ? 'REQUEST BLOCKED' : 'REQUEST PASSED'}
                  </div>
                  {result.block_reason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{result.block_reason}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {[
                    { label: 'Deployment', value: result.deployment },
                    { label: 'Max Severity', value: ['safe', 'low', 'medium', 'high'][maxSev], color: Object.values(SEV_COLORS)[maxSev] },
                    { label: 'Categories Flagged', value: (result.filter_categories || []).filter(c => c.filtered).length },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.72rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                      <div style={{ fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter categories */}
              {(result.filter_categories || []).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {inputCats.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                        Input Filter Results
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {inputCats.map((c, i) => <CategoryRow key={i} cat={c} />)}
                      </div>
                    </div>
                  )}
                  {outputCats.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                        Output Filter Results
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {outputCats.map((c, i) => <CategoryRow key={i} cat={c} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Model response */}
              {result.model_response && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Model Response
                  </div>
                  <div style={{
                    padding: '0.75rem', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-primary)',
                    maxHeight: 200, overflowY: 'auto',
                  }}>
                    {result.model_response}
                  </div>
                </div>
              )}

              {/* Usage stats */}
              {result.usage && Object.keys(result.usage).length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {Object.entries(result.usage).filter(([, v]) => typeof v !== 'object' || v === null).map(([k, v]) => (
                    <div key={k} style={{ padding: '0.25rem 0.6rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}: </span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <RawJsonView data={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
