import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, RefreshCw, ChevronRight, CheckCircle, XCircle, Eye, X } from 'lucide-react'
import { apiFetch } from '../../lib/apiFetch'

const CONTROL_OPTIONS = [
  { type: 'Jailbreak', label: 'Jailbreak Detection', desc: 'Block attempts to override model instructions', points: ['UserInput'], defaultAction: 'Block' },
  { type: 'IndirectAttack', label: 'Indirect Prompt Injection', desc: 'Block malicious instructions in documents and tool outputs', points: ['Documents'], defaultAction: 'Block' },
  { type: 'Spotlighting', label: 'Spotlighting (Preview)', desc: 'Distinguish trusted instructions from untrusted document content', points: ['Documents'], defaultAction: 'Block' },
  { type: 'PII', label: 'PII / Sensitive Data Leakage (Preview)', desc: 'Prevent personally identifiable information from leaking in outputs', points: ['Output'], defaultAction: 'Block' },
  { type: 'TaskAdherence', label: 'Task Adherence / Task Drift (Preview)', desc: 'Ensure the agent stays within its assigned role and does not execute unauthorized actions', points: ['UserInput', 'Output'], defaultAction: 'Block' },
  { type: 'ContentSafety', label: 'Content Safety - Hate', category: 'Hate', desc: 'Block hate speech and discriminatory content', points: ['UserInput', 'Output'], defaultAction: 'Block' },
  { type: 'ContentSafety', label: 'Content Safety - Sexual', category: 'Sexual', desc: 'Block sexually explicit content', points: ['UserInput', 'Output'], defaultAction: 'Block' },
  { type: 'ContentSafety', label: 'Content Safety - Self-Harm', category: 'SelfHarm', desc: 'Block self-harm and suicide content', points: ['UserInput', 'Output'], defaultAction: 'Block' },
  { type: 'ContentSafety', label: 'Content Safety - Violence', category: 'Violence', desc: 'Block violent threats and graphic violence', points: ['UserInput', 'Output'], defaultAction: 'Block' },
  { type: 'Blocklist', label: 'Blocklist', desc: 'Block terms from custom blocklists', points: ['UserInput', 'Output'], defaultAction: 'Block' },
  { type: 'ProtectedMaterial', label: 'Protected Material (Text)', category: 'Text', desc: 'Detect and block copyrighted text reproduction', points: ['Output'], defaultAction: 'Block' },
  { type: 'ProtectedMaterial', label: 'Protected Material (Code)', category: 'Code', desc: 'Detect and block licensed code reproduction', points: ['Output'], defaultAction: 'Block' },
]

const THRESHOLD_OPTIONS = ['Low', 'Medium', 'High']

function TypeBadge({ type, isSystem }) {
  const color = isSystem ? '#6b7280' : type === 'Agent' ? '#8b5cf6' : type === 'Model' ? '#3b82f6' : '#10b981'
  return (
    <span style={{
      padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600,
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>
      {isSystem ? 'System' : type || 'Custom'}
    </span>
  )
}

function ControlPill({ type }) {
  const colors = {
    Jailbreak: '#ef4444', IndirectAttack: '#8b5cf6', ContentSafety: '#3b82f6',
    TaskAdherence: '#f59e0b', ProtectedMaterial: '#06b6d4', PII: '#10b981', Blocklist: '#6b7280',
  }
  const c = colors[type] || '#6b7280'
  return (
    <span style={{
      padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.65rem', fontWeight: 600,
      background: `${c}18`, color: c, border: `1px solid ${c}35`,
    }}>
      {type}
    </span>
  )
}

function CreateForm({ deployments, agents, onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState({})
  const [thresholds, setThresholds] = useState({})
  const [associations, setAssociations] = useState({ models: [], agents: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)

  const toggleControl = (opt) => {
    const key = opt.category ? `${opt.type}_${opt.category}` : opt.type
    setSelected(p => {
      const next = { ...p }
      if (next[key]) delete next[key]
      else next[key] = { ...opt, action: 'Block' }
      return next
    })
  }

  const selectedKeys = Object.keys(selected)

  const buildPayload = () => {
    const controls = selectedKeys.map(k => {
      const c = selected[k]
      return {
        type: c.type,
        category: c.category || null,
        threshold: thresholds[k] || 'Medium',
        intervention_points: c.points,
        action: c.action,
      }
    })
    const assocList = [
      ...associations.models.map(id => ({ type: 'ModelDeployment', id })),
      ...associations.agents.map(id => ({ type: 'Agent', id })),
    ]
    return { name, controls, associations: assocList, streaming_mode: 'Default' }
  }

  const submit = async () => {
    if (!name.trim()) { setError('Guardrail name is required'); return }
    if (selectedKeys.length === 0) { setError('Select at least one control'); return }
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/content-filters/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.detail || 'Create failed'); return }
      onCreated(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= s ? '#3b82f6' : 'var(--bg-elevated)',
              border: `1px solid ${step >= s ? '#3b82f6' : 'var(--border)'}`,
              fontSize: '0.7rem', fontWeight: 700,
              color: step >= s ? '#fff' : 'var(--text-muted)',
            }}>{s}</div>
            <span style={{ fontSize: '0.72rem', color: step === s ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s ? 600 : 400 }}>
              {s === 1 ? 'Add Controls' : s === 2 ? 'Select Targets' : 'Review'}
            </span>
            {s < 3 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1 - Controls */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Select controls to add to this guardrail. Each control defines what to detect and how to respond.
          </div>
          {CONTROL_OPTIONS.map(opt => {
            const key = opt.category ? `${opt.type}_${opt.category}` : opt.type
            const isOn = !!selected[key]
            return (
              <div
                key={key}
                onClick={() => toggleControl(opt)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.75rem',
                  background: isOn ? 'rgba(59,130,246,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isOn ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                  background: isOn ? '#3b82f6' : 'transparent',
                  border: `2px solid ${isOn ? '#3b82f6' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isOn && <span style={{ width: 8, height: 8, background: '#fff', borderRadius: 1, display: 'block' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{opt.desc}</div>
                  {isOn && (opt.type === 'ContentSafety') && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                      {THRESHOLD_OPTIONS.map(t => (
                        <button
                          key={t}
                          onClick={e => { e.stopPropagation(); setThresholds(p => ({ ...p, [key]: t })) }}
                          style={{
                            padding: '0.15rem 0.5rem', fontSize: '0.65rem', fontWeight: 600,
                            borderRadius: 3, cursor: 'pointer',
                            background: (thresholds[key] || 'Medium') === t ? '#3b82f620' : 'transparent',
                            border: `1px solid ${(thresholds[key] || 'Medium') === t ? '#3b82f6' : 'var(--border)'}`,
                            color: (thresholds[key] || 'Medium') === t ? '#3b82f6' : 'var(--text-muted)',
                          }}
                        >{t}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                  {opt.points.join(' + ')}
                </div>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={() => setStep(2)} disabled={selectedKeys.length === 0}>
              Next: Select Targets
            </button>
          </div>
        </div>
      )}

      {/* Step 2 - Targets */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Select which model deployments and agents this guardrail will be applied to.
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Model Deployments
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {deployments.map(d => {
                const on = associations.models.includes(d.id)
                return (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--bg-elevated)', borderRadius: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={on} onChange={() => setAssociations(p => ({
                      ...p,
                      models: on ? p.models.filter(x => x !== d.id) : [...p.models, d.id],
                    }))} />
                    <span style={{ fontSize: '0.78rem' }}>{d.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.model}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Agents (Preview)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {agents.map(a => {
                const on = associations.agents.includes(a.id)
                return (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--bg-elevated)', borderRadius: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={on} onChange={() => setAssociations(p => ({
                      ...p,
                      agents: on ? p.agents.filter(x => x !== a.id) : [...p.agents, a.id],
                    }))} />
                    <span style={{ fontSize: '0.78rem' }}>{a.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{a.model}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Next: Review</button>
          </div>
        </div>
      )}

      {/* Step 3 - Review */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Guardrail Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. CapitalMarketsStrict"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Controls ({selectedKeys.length})</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {selectedKeys.map(k => <ControlPill key={k} type={selected[k].label || selected[k].type} />)}
            </div>
          </div>
          {(associations.models.length > 0 || associations.agents.length > 0) && (
            <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Applied To</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                {associations.models.length > 0 && <div>Models: {associations.models.join(', ')}</div>}
                {associations.agents.length > 0 && <div>Agents: {associations.agents.join(', ')}</div>}
              </div>
            </div>
          )}
          {error && (
            <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: '0.78rem', color: '#ef4444' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" onClick={submit} disabled={loading || !name.trim()}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Shield size={14} />}
              Create Guardrail
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailPanel({ guardrail, onClose }) {
  return (
    <div className="card fade-in" style={{ borderLeft: '3px solid #3b82f6' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={16} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '0.9rem' }}>{guardrail.name}</h3>
          <TypeBadge type={guardrail.type} isSystem={guardrail.is_system} />
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
          <X size={12} /> Close
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Controls</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {(guardrail.control_types || []).length > 0
              ? (guardrail.control_types || []).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: 4 }}>
                  <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem' }}>{t}</span>
                </div>
              ))
              : <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No controls defined</div>
            }
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Applied To</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {(guardrail.applied_to || []).length > 0
              ? (guardrail.applied_to || []).map((t, i) => (
                <div key={i} style={{ padding: '0.3rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: 4, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{t}</div>
              ))
              : <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Not assigned to any targets</div>
            }
          </div>
          {guardrail.last_modified && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Last modified: {new Date(guardrail.last_modified).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GuardrailManager() {
  const [guardrails, setGuardrails] = useState([])
  const [deployments, setDeployments] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = async (signal) => {
    setLoading(true)
    try {
      const [gr, dep, ag] = await Promise.all([
        apiFetch('/api/content-filters/guardrails', { signal }).then(r => r.json()),
        apiFetch('/api/content-filters/deployments', { signal }).then(r => r.json()),
        apiFetch('/api/content-filters/agents', { signal }).then(r => r.json()),
      ])
      if (signal && signal.aborted) return
      setGuardrails(Array.isArray(gr) ? gr : [])
      setDeployments(Array.isArray(dep) ? dep : [])
      setAgents(Array.isArray(ag) ? ag : [])
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    const ctrl = new AbortController()
    load(ctrl.signal)
    return () => ctrl.abort()
  }, [])

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete guardrail "${name}"? This cannot be undone.`)) return
    setDeleting(name)
    try {
      const r = await fetch(`/api/content-filters/guardrails/${name}`, { method: 'DELETE' })
      if (r.ok) {
        setGuardrails(p => p.filter(g => g.name !== name))
        if (selected?.name === name) setSelected(null)
      }
    } finally {
      setDeleting(null)
    }
  }

  const handleCreated = (data) => {
    setCreating(false)
    load()
  }

  const stats = {
    total: guardrails.length,
    agent: guardrails.filter(g => g.type === 'Agent').length,
    model: guardrails.filter(g => g.type === 'Model' || g.is_system).length,
    covered: new Set(guardrails.flatMap(g => g.applied_to || [])).size,
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
        padding: '1rem 1.25rem', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        marginBottom: '1.25rem', borderLeft: '3px solid #f59e0b',
      }}>
        <div className="feature-icon" style={{ background: '#f59e0b20', marginTop: 2 }}>
          <Shield size={18} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Guardrail Manager</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 680 }}>
            Create and manage content filter guardrails in your Azure AI Foundry project. Guardrails can be applied to both model deployments and agents, controlling what content is allowed in at the input layer and what is returned at the output layer.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Guardrails', value: stats.total, color: '#f59e0b' },
          { label: 'Agent Guardrails', value: stats.agent, color: '#8b5cf6' },
          { label: 'Model Guardrails', value: stats.model, color: '#3b82f6' },
          { label: 'Entities Covered', value: stats.covered, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: creating ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
        {/* Guardrails table */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> Guardrails
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={load} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                <RefreshCw size={12} /> Refresh
              </button>
              <button className="btn-primary" onClick={() => { setCreating(true); setSelected(null) }} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                <Plus size={12} /> New Guardrail
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ marginRight: 8 }} /> Loading guardrails...
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Controls</th>
                    <th>Applied To</th>
                    <th>Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guardrails.map(g => (
                    <tr
                      key={g.name}
                      style={{ cursor: 'pointer', background: selected?.name === g.name ? 'rgba(59,130,246,0.06)' : undefined }}
                      onClick={() => { setSelected(selected?.name === g.name ? null : g); setCreating(false) }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield size={12} style={{ color: g.is_system ? '#6b7280' : '#f59e0b', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{g.name}</span>
                        </div>
                      </td>
                      <td><TypeBadge type={g.type} isSystem={g.is_system} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {(g.control_types || []).slice(0, 3).map(t => <ControlPill key={t} type={t} />)}
                          {(g.control_types || []).length > 3 && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{g.control_types.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(g.applied_to || []).length === 0 ? '--' : (g.applied_to || []).length === 1 ? g.applied_to[0] : `${(g.applied_to || []).length} targets`}
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {g.last_modified ? new Date(g.last_modified).toLocaleDateString() : '--'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem' }}
                            onClick={() => { setSelected(g); setCreating(false) }}
                          >
                            <Eye size={10} />
                          </button>
                          {!g.is_system && (
                            <button
                              className="btn-danger"
                              style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem' }}
                              onClick={() => handleDelete(g.name)}
                              disabled={deleting === g.name}
                            >
                              {deleting === g.name ? <span className="spinner" style={{ width: 10, height: 10 }} /> : <Trash2 size={10} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {guardrails.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No guardrails found. Create your first guardrail above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create form */}
        {creating && (
          <div className="card fade-in" style={{ borderLeft: '3px solid #f59e0b' }}>
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Create Guardrail
              </h3>
              <button className="btn-secondary" onClick={() => setCreating(false)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
                <X size={12} />
              </button>
            </div>
            <CreateForm
              deployments={deployments}
              agents={agents}
              onCreated={handleCreated}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && !creating && (
        <div style={{ marginTop: '1.25rem' }}>
          <DetailPanel guardrail={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
