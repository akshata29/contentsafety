import { useState, useEffect } from 'react'
import {
  Layers, Play, RefreshCw, ShieldOff, Shield, CheckCircle, XCircle,
  ChevronDown, Info, AlertTriangle, Lock, Unlock, Eye, EyeOff,
  GitBranch, Copyright, FileWarning, AlertOctagon, ShieldAlert,
  BarChart2, Zap, ArrowRight,
} from 'lucide-react'
import { apiFetch } from '../../lib/apiFetch'

/* =========================================================
 * Constants
 * ========================================================= */

const CATEGORY_META = {
  'Hate':                     { color: '#f97316', layer: 'INPUT',  icon: AlertOctagon  },
  'Violence':                 { color: '#dc2626', layer: 'INPUT',  icon: AlertOctagon  },
  'Sexual':                   { color: '#ec4899', layer: 'INPUT',  icon: AlertOctagon  },
  'Self-Harm':                { color: '#f59e0b', layer: 'INPUT',  icon: AlertOctagon  },
  'Jailbreak':                { color: '#ef4444', layer: 'INPUT',  icon: ShieldAlert   },
  'Indirect Attack':          { color: '#8b5cf6', layer: 'INPUT',  icon: FileWarning   },
  'Protected Material (Text)':{ color: '#3b82f6', layer: 'OUTPUT', icon: Copyright     },
  'Protected Material (Code)':{ color: '#0ea5e9', layer: 'OUTPUT', icon: Copyright     },
  'PII':                      { color: '#10b981', layer: 'OUTPUT', icon: EyeOff        },
  'Task Adherence':           { color: '#6366f1', layer: 'INPUT',  icon: GitBranch     },
  'Groundedness':             { color: '#6366f1', layer: 'OUTPUT', icon: GitBranch     },
}

const SEV_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#84cc16', safe: '#10b981' }

const SCENARIO_CATEGORY_META = {
  'Content Safety':   { color: '#f97316', dot: '#f97316' },
  'Jailbreak':        { color: '#ef4444', dot: '#ef4444' },
  'Indirect Attack':  { color: '#8b5cf6', dot: '#8b5cf6' },
  'PII':              { color: '#10b981', dot: '#10b981' },
  'Task Adherence':   { color: '#6366f1', dot: '#6366f1' },
  'Protected Material':{ color: '#0ea5e9', dot: '#0ea5e9' },
  'Baseline':         { color: '#10b981', dot: '#10b981' },
}

const EXPECTED_META = {
  block:   { bg: '#ef444418', border: '#ef444450', color: '#ef4444', label: 'BLOCK',    dot: '#ef4444' },
  partial: { bg: '#f59e0b18', border: '#f59e0b50', color: '#f59e0b', label: 'PARTIAL',  dot: '#f59e0b' },
  pass:    { bg: '#10b98118', border: '#10b98150', color: '#10b981', label: 'PASS',     dot: '#10b981' },
}

const CONFIG_META = {
  'No Guardrail (Permissive)': {
    icon: Unlock,
    headerColor: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.3)',
    bgColor: 'rgba(245,158,11,0.05)',
    tag: 'UNPROTECTED',
    tagColor: '#f59e0b',
    desc_short: 'No active content filter',
  },
  'Microsoft.Default': {
    icon: Shield,
    headerColor: '#3b82f6',
    borderColor: 'rgba(59,130,246,0.3)',
    bgColor: 'rgba(59,130,246,0.05)',
    tag: 'STANDARD',
    tagColor: '#3b82f6',
    desc_short: 'Balanced - Default controls',
  },
  'Capital Markets Strict': {
    icon: Lock,
    headerColor: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.3)',
    bgColor: 'rgba(139,92,246,0.05)',
    tag: 'STRICT',
    tagColor: '#8b5cf6',
    desc_short: 'Maximum protection - All controls',
  },
}

const ALL_CONTROLS = [
  { key: 'Hate',                      label: 'Hate Speech',          layer: 'I/O', color: '#f97316' },
  { key: 'Violence',                  label: 'Violence',             layer: 'I/O', color: '#dc2626' },
  { key: 'Sexual',                    label: 'Sexual Content',       layer: 'I/O', color: '#ec4899' },
  { key: 'Self-Harm',                 label: 'Self-Harm',            layer: 'I/O', color: '#f59e0b' },
  { key: 'Jailbreak',                 label: 'Jailbreak',            layer: 'IN',  color: '#ef4444' },
  { key: 'Indirect Attack',           label: 'XPIA / Indirect',      layer: 'IN',  color: '#8b5cf6' },
  { key: 'Protected Material (Text)', label: 'Protected Text',       layer: 'OUT', color: '#3b82f6' },
  { key: 'Protected Material (Code)', label: 'Protected Code',       layer: 'OUT', color: '#0ea5e9' },
  { key: 'PII',                       label: 'PII Leakage',          layer: 'OUT', color: '#10b981' },
  { key: 'Task Adherence',            label: 'Task Drift',           layer: 'I/O', color: '#6366f1' },
]

const CONFIG_COVERAGE = {
  'No Guardrail (Permissive)': [],
  'Microsoft.Default': [
    'Hate', 'Violence', 'Sexual', 'Self-Harm',
    'Jailbreak', 'Indirect Attack',
    'Protected Material (Text)', 'Protected Material (Code)',
  ],
  'Capital Markets Strict': [
    'Hate', 'Violence', 'Sexual', 'Self-Harm',
    'Jailbreak', 'Indirect Attack',
    'Protected Material (Text)', 'Protected Material (Code)',
    'PII', 'Task Adherence',
  ],
}

/* =========================================================
 * Sub-components
 * ========================================================= */

function CoverageMatrix({ configs }) {
  if (!configs) return null
  const configLabels = configs.map(c => c.label)
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <BarChart2 size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          Guardrail Coverage Matrix
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Which controls are active in each configuration
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '40%' }}>
                Filter Control
              </th>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: 'var(--text-muted)', fontWeight: 600, width: '8%' }}>
                Layer
              </th>
              {configLabels.map((lbl, i) => {
                const meta = CONFIG_META[lbl] || CONFIG_META['Microsoft.Default']
                const IconComp = meta.icon
                return (
                  <th key={i} style={{ textAlign: 'center', padding: '0.3rem 0.5rem', width: '17%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <IconComp size={11} style={{ color: meta.headerColor }} />
                      <span style={{ color: meta.headerColor, fontSize: '0.62rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {meta.tag}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {ALL_CONTROLS.map((ctrl, ri) => {
              return (
                <tr key={ctrl.key} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ctrl.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ctrl.label}</span>
                  </td>
                  <td style={{ padding: '0.35rem 0.4rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.08rem 0.3rem', borderRadius: 2, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {ctrl.layer}
                    </span>
                  </td>
                  {configLabels.map((lbl, ci) => {
                    const covered = (CONFIG_COVERAGE[lbl] || []).includes(ctrl.key)
                    const configResult = configs[ci]
                    const catResult = (configResult?.categories || []).find(c => c.category === ctrl.key)
                    const triggered = covered && catResult?.filtered
                    const notCovered = catResult?.not_covered
                    return (
                      <td key={ci} style={{ textAlign: 'center', padding: '0.35rem 0.5rem' }}>
                        {notCovered ? (
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>not covered</span>
                        ) : covered ? (
                          triggered ? (
                            <XCircle size={14} style={{ color: '#ef4444' }} />
                          ) : (
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                          )
                        ) : (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--border)', margin: '0 auto' }} />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
        {[
          [CheckCircle, '#10b981', 'Active - No violation'],
          [XCircle, '#ef4444', 'Active - TRIGGERED / BLOCKED'],
          ['circle', 'var(--border)', 'Not in this guardrail'],
        ].map(([Ic, col, lbl], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {typeof Ic === 'string' ? (
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: col, flexShrink: 0 }} />
            ) : (
              <Ic size={12} style={{ color: col, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{lbl}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>not covered</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Control absent from guardrail</span>
        </div>
      </div>
    </div>
  )
}

function SeverityBar({ severity }) {
  const pct = { high: 90, medium: 55, low: 25, safe: 0 }[severity] || 0
  const color = SEV_COLORS[severity] || '#10b981'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 60 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.58rem', fontWeight: 700, color, minWidth: 30, textAlign: 'right' }}>
        {(severity || 'safe').toUpperCase()}
      </span>
    </div>
  )
}

function FilterColumn({ config, index }) {
  const meta = CONFIG_META[config.label] || CONFIG_META['Microsoft.Default']
  const IconComp = meta.icon
  const allCats = config.categories || []
  const flaggedCats = allCats.filter(c => c.filtered)
  const inputCats = allCats.filter(c => c.point === 'input' || c.point !== 'output')
  const outputCats = allCats.filter(c => c.point === 'output')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.65rem',
      padding: '0.9rem', background: 'var(--bg-card)',
      border: `1px solid ${config.blocked ? 'rgba(239,68,68,0.45)' : meta.borderColor}`,
      borderRadius: 8, borderTop: `3px solid ${config.blocked ? '#ef4444' : meta.headerColor}`,
      flex: 1, minWidth: 0,
    }}>
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: `${meta.headerColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconComp size={15} style={{ color: meta.headerColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: meta.headerColor }}>{config.label}</span>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.08rem 0.35rem', borderRadius: 2, background: `${meta.headerColor}18`, color: meta.headerColor, border: `1px solid ${meta.headerColor}35` }}>
              {meta.tag}
            </span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.1rem' }}>{config.description}</div>
        </div>
      </div>

      {/* Active controls count */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, padding: '0.35rem 0.5rem', borderRadius: 5, textAlign: 'center',
          background: config.blocked ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)',
          border: `1px solid ${config.blocked ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.25)'}`,
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: config.blocked ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            {config.blocked
              ? <><XCircle size={11} /> BLOCKED</>
              : <><CheckCircle size={11} /> PASSED</>
            }
          </div>
        </div>
        <div style={{
          flex: 1, padding: '0.35rem 0.5rem', borderRadius: 5, textAlign: 'center',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: flaggedCats.length > 0 ? '#ef4444' : 'var(--text-primary)' }}>{flaggedCats.length}</span> flagged
          </div>
        </div>
        <div style={{
          flex: 1, padding: '0.35rem 0.5rem', borderRadius: 5, textAlign: 'center',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{(config.active_controls || []).length}</span> controls
          </div>
        </div>
      </div>

      {/* Block reason */}
      {config.block_reason && (
        <div style={{ fontSize: '0.7rem', color: '#ef4444', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, lineHeight: 1.5 }}>
          {config.block_reason}
        </div>
      )}

      {/* INPUT filter layer */}
      {inputCats.length > 0 && (
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ padding: '0.06rem 0.3rem', borderRadius: 2, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>INPUT</span>
            <span>layer checks</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {inputCats.map((c, i) => <CategoryRow key={i} cat={c} label={config.label} />)}
          </div>
        </div>
      )}

      {/* OUTPUT filter layer */}
      {outputCats.length > 0 && (
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ padding: '0.06rem 0.3rem', borderRadius: 2, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>OUTPUT</span>
            <span>layer checks</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {outputCats.map((c, i) => <CategoryRow key={i} cat={c} label={config.label} />)}
          </div>
        </div>
      )}

      {/* Response preview */}
      {config.model_response && (
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            Response Preview
          </div>
          <div style={{
            padding: '0.5rem 0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 5, fontSize: '0.71rem', lineHeight: 1.6, color: 'var(--text-muted)',
            maxHeight: 100, overflowY: 'auto', borderLeft: `2px solid ${meta.headerColor}`,
            fontStyle: config.model_response.startsWith('[SIMULATED') ? 'italic' : 'normal',
          }}>
            {config.model_response.length > 250 ? config.model_response.slice(0, 250) + '...' : config.model_response}
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryRow({ cat, label }) {
  const meta = CATEGORY_META[cat.category] || { color: '#6b7280', layer: 'IN' }
  const sevColor = SEV_COLORS[cat.severity] || '#10b981'
  const isNotCovered = cat.not_covered
  const isPermissive = label === 'No Guardrail (Permissive)'

  if (isNotCovered) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.28rem 0.45rem',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 4, opacity: 0.55,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.68rem', color: 'var(--text-muted)' }}>{cat.category}</span>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>not covered</span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.45rem',
      background: cat.filtered ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
      border: `1px solid ${cat.filtered ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
      borderRadius: 4,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {cat.category}
      </span>
      {cat.filtered ? (
        <XCircle size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
      ) : (
        <SeverityBar severity={isPermissive ? 'safe' : cat.severity} />
      )}
    </div>
  )
}

function ScenarioPill({ s, selected, onClick }) {
  const catMeta = SCENARIO_CATEGORY_META[s.category] || SCENARIO_CATEGORY_META['Baseline']
  const expMeta = EXPECTED_META[s.expected_default] || EXPECTED_META['pass']
  const isSelected = selected?.id === s.id
  return (
    <button
      onClick={() => onClick(s)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.35rem 0.7rem', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem',
        background: isSelected ? `${catMeta.color}14` : 'var(--bg-elevated)',
        border: `1px solid ${isSelected ? catMeta.color + '55' : 'var(--border)'}`,
        color: 'var(--text-primary)', fontWeight: isSelected ? 600 : 400,
        transition: 'all 0.12s',
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: expMeta.dot, flexShrink: 0 }} />
      <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
      {s.category && (
        <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.06rem 0.28rem', borderRadius: 2, background: `${catMeta.color}18`, color: catMeta.color, border: `1px solid ${catMeta.color}35`, whiteSpace: 'nowrap' }}>
          {s.category}
        </span>
      )}
    </button>
  )
}

/* =========================================================
 * Main Component
 * ========================================================= */

export default function FilterComparison() {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [sysPrompt, setSysPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showSys, setShowSys] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    apiFetch('/api/content-filters/scenarios/compare', { signal: ctrl.signal })
      .then(r => r.json())
      .then(sc => { if (!ctrl.signal.aborted) setScenarios(Array.isArray(sc) ? sc : []) })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  const pickScenario = (s) => {
    setSelected(s)
    setText(s.text)
    setSysPrompt(s.system_prompt || '')
    setResult(null)
    setShowSys(!!s.system_prompt)
  }

  const runCompare = async () => {
    if (!text.trim()) return
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/content-filters/test/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, system_prompt: sysPrompt }),
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

  // Group scenarios by category
  const scenarioGroups = scenarios.reduce((acc, s) => {
    const cat = s.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const categoryOrder = ['Jailbreak', 'Indirect Attack', 'Content Safety', 'PII', 'Task Adherence', 'Protected Material', 'Baseline']
  const sortedGroups = categoryOrder.filter(c => scenarioGroups[c]).map(c => [c, scenarioGroups[c]])

  const expectedTag = selected ? EXPECTED_META[selected.expected_default] : null
  const configs = result && !result.error ? (result.configs || []) : null

  // Stats after result
  const blockedCount = configs ? configs.filter(c => c.blocked).length : 0
  const passedCount = configs ? configs.filter(c => !c.blocked).length : 0

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', borderLeft: '3px solid #f59e0b',
      }}>
        <div className="feature-icon" style={{ background: '#f59e0b20', marginTop: 2, flexShrink: 0 }}>
          <Layers size={18} style={{ color: '#f59e0b' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Filter Comparison</h2>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 3, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>3-WAY COMPARISON</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 780, margin: '0 0 0.5rem' }}>
            Run any input through three guardrail tiers simultaneously: Permissive (no filter), Microsoft.Default (standard), and Capital Markets Strict (maximum). Covers all filter types - Content Safety, Jailbreak, Indirect Attack (XPIA), PII Leakage, Task Adherence, and Protected Material.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Jailbreak', color: '#ef4444' },
              { label: 'XPIA', color: '#8b5cf6' },
              { label: 'Content Safety', color: '#f97316' },
              { label: 'PII', color: '#10b981' },
              { label: 'Task Drift', color: '#6366f1' },
              { label: 'Protected Material', color: '#0ea5e9' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: '0.62rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: 3, background: `${color}12`, color, border: `1px solid ${color}28` }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Input section */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3>Test Input</h3>
          {result && !result.error && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 700 }}>{blockedCount} BLOCKED</span>
              <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem', borderRadius: 3, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700 }}>{passedCount} PASSED</span>
            </div>
          )}
        </div>

        {/* Scenario groups */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Financial Scenarios by Attack Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sortedGroups.map(([cat, scens]) => {
              const catMeta = SCENARIO_CATEGORY_META[cat] || SCENARIO_CATEGORY_META['Baseline']
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: catMeta.color }} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: catMeta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {scens.map(s => (
                      <ScenarioPill key={s.id} s={s} selected={selected} onClick={pickScenario} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Prompt */}
        <div style={{ marginBottom: '0.6rem' }}>
          <button
            onClick={() => setShowSys(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: 0, marginBottom: '0.35rem' }}
          >
            <ChevronDown size={12} style={{ transform: showSys ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
            System Prompt
            {sysPrompt && <span style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem', borderRadius: 2, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontWeight: 700 }}>SET</span>}
          </button>
          {showSys && (
            <textarea value={sysPrompt} onChange={e => setSysPrompt(e.target.value)}
              placeholder="Optional system prompt - helps simulate real agent or model role..." rows={2}
              style={{ fontSize: '0.78rem' }}
            />
          )}
        </div>

        {/* User message */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User Message</span>
            {selected && expectedTag && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selected.category && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{selected.category}</span>
                )}
                <span style={{ padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.65rem', fontWeight: 700, background: expectedTag.bg, border: `1px solid ${expectedTag.border}`, color: expectedTag.color }}>
                  Expected: {expectedTag.label}
                </span>
              </div>
            )}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Enter a financial query or threat scenario to compare across all filter configurations..."
            rows={5}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => { setText(''); setSysPrompt(''); setResult(null); setSelected(null) }} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
            <RefreshCw size={12} /> Clear
          </button>
          <button className="btn-primary" onClick={runCompare} disabled={loading || !text.trim()}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
            Compare All Filters
          </button>
        </div>
      </div>

      {/* Error */}
      {result?.error && (
        <div className="card fade-in" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>Error</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{result.error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {configs && (
        <div className="fade-in">

          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: '0.5rem', alignItems: 'stretch', marginBottom: '0.85rem',
            padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          }}>
            <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Same input evaluated against 3 guardrail configurations simultaneously. "No Guardrail" simulates a deployment with no content filter assigned.
              "Microsoft.Default" reflects the real Azure Content Safety API response. "Capital Markets Strict" applies financial-sector controls including PII, task drift, and XPIA detection.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, alignItems: 'center' }}>
              {configs.map((c, i) => {
                const meta = CONFIG_META[c.label] || CONFIG_META['Microsoft.Default']
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: c.blocked ? '#ef4444' : '#10b981' }}>
                      {c.blocked ? 'BLOCKED' : 'PASSED'}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: meta.headerColor, fontWeight: 600 }}>{meta.tag}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Coverage matrix */}
          <CoverageMatrix configs={configs} />

          {/* 3-column comparison */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
            {configs.map((c, i) => <FilterColumn key={i} config={c} index={i} />)}
          </div>

          {/* Financial impact note */}
          {selected && (
            <div style={{
              marginTop: '0.85rem', padding: '0.75rem 1rem',
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, display: 'flex', gap: '0.6rem',
            }}>
              <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.2rem' }}>
                  Financial Compliance Implication
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {selected.category === 'Jailbreak' && 'Jailbreaks against capital markets AI tools strip compliance controls, enabling illegal trading advice extraction, system prompt theft (leaking API keys / risk limits), and agent takeover. Guardrail selection directly determines whether these attacks succeed or are blocked at the API layer.'}
                  {selected.category === 'Indirect Attack' && 'Cross-prompt injection (XPIA) attacks hide malicious instructions inside documents, earnings reports, and API tool outputs processed by the model. Financial AI agents that process third-party content without XPIA protection are vulnerable to fund transfer hijacking and data exfiltration via document poisoning.'}
                  {selected.category === 'PII' && 'PII exfiltration from financial AI systems triggers mandatory breach notifications under GDPR, GLBA, and CCPA. A single prompt that leaks bulk client SSNs, account numbers, or beneficiary data can result in regulatory fines, reputational damage, and loss of operating licenses.'}
                  {selected.category === 'Task Adherence' && 'Task drift attacks redirect specialized agents - like SAR filing assistants or compliance reviewers - into executing unauthorized trades or system actions. Without task adherence controls, an agent with privileged system access can be manipulated into bypassing approval workflows, creating direct financial and regulatory exposure.'}
                  {selected.category === 'Protected Material' && 'Reproducing Bloomberg methodology, Goldman Sachs research, or licensed risk model code exposes the firm to IP litigation from data vendors and sell-side banks. Without protected material controls, AI systems can inadvertently trigger copyright violations worth millions in licensing penalties.'}
                  {selected.category === 'Content Safety' && 'Harmful content in financial AI outputs - market manipulation advice, insider trading facilitation, or regulatory circumvention guidance - creates direct SEC, FINRA, and FinCEN liability. Content safety controls at the model layer are the last line of defense when input validation fails.'}
                  {selected.category === 'Baseline' && 'Legitimate financial queries should pass all filter tiers without latency overhead. This demonstrates that strict guardrails do not block normal business operations - only the appropriate threat scenarios above.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--bg-card)' }}>
          <Layers size={36} style={{ color: 'var(--border)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Select a scenario or type your own message
          </div>
          <div style={{ fontSize: '0.78rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Click "Compare All Filters" to see how the same input is handled across Permissive, Default, and Strict configurations - covering all 10 filter categories across input and output layers.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { label: 'No Guardrail', color: '#f59e0b', desc: 'Unfiltered' },
              { label: 'Microsoft.Default', color: '#3b82f6', desc: '8 controls' },
              { label: 'Capital Markets', color: '#8b5cf6', desc: '10 controls' },
            ].map(({ label, color, desc }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={16} style={{ color }} />
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color }}>{label}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
