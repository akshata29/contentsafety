/**
 * Shared Content Safety page wrapper with scenario sidebar and result panel.
 * All CS demo pages use this for consistent UX.
 */
import { useState } from 'react'
import { ChevronRight, Info, CheckCircle, AlertTriangle } from 'lucide-react'

export function FeaturePage({ title, description, icon: Icon, color, children }) {
  return (
    <div className="fade-in">
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
        padding: '1rem 1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.25rem',
        borderLeft: `3px solid ${color}`,
      }}>
        <div className="feature-icon" style={{ background: `${color}20`, marginTop: 2 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 680 }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function ScenarioSelector({ scenarios, selected, onSelect }) {
  if (!scenarios || scenarios.length === 0) return null
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-header" style={{ marginBottom: '0.75rem' }}>
        <h3>Pre-built Financial Scenarios</h3>
        <span className="badge badge-cyan">Capital Markets</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.55rem 0.75rem',
              background: selected === s ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
              border: `1px solid ${selected === s ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)',
              transition: 'all 0.12s',
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(100,116,139,0.15)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{s.label}</div>
            </div>
            <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ResultPanel({ result, keyStats, children }) {
  if (!result) return null
  const flagged = result.flagged || result.detected || result.ungrounded ||
                  result.user_prompt_detected || result.violation_detected
  return (
    <div className={`result-panel fade-in ${flagged ? 'flagged' : 'clean'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        {flagged
          ? <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
          : <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
        }
        <strong style={{ color: flagged ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '0.875rem' }}>
          {flagged ? 'Content Flagged' : 'Content Cleared'}
        </strong>
      </div>
      {keyStats && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {keyStats.map((stat, i) => (
            <div key={i} style={{
              padding: '0.4rem 0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{stat.label}: </span>
              <span style={{ color: stat.color || 'var(--text-primary)', fontWeight: 600 }}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

export function SeverityBar({ severity, max = 6 }) {
  const pct = (severity / max) * 100
  const color = severity === 0 ? 'var(--severity-safe)'
    : severity <= 2 ? 'var(--severity-low)'
    : severity <= 4 ? 'var(--severity-medium)'
    : 'var(--severity-critical)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className="progress-bar" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: 12 }}>{severity}</span>
    </div>
  )
}

export function CategoriesGrid({ categories }) {
  if (!categories || categories.length === 0) return null
  return (
    <div className="grid-2" style={{ marginTop: '0.75rem' }}>
      {categories.map(cat => (
        <div key={cat.category} style={{
          padding: '0.6rem 0.75rem',
          background: 'var(--bg-elevated)',
          border: `1px solid ${cat.severity >= 4 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{cat.category}</span>
            <span className={`badge ${cat.severity === 0 ? 'badge-safe' : cat.severity <= 2 ? 'badge-low' : cat.severity <= 4 ? 'badge-medium' : 'badge-critical'}`}>
              {cat.severity === 0 ? 'Safe' : `Sev ${cat.severity}`}
            </span>
          </div>
          <SeverityBar severity={cat.severity} />
        </div>
      ))}
    </div>
  )
}

export function RawJsonView({ data }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button className="btn-secondary" onClick={() => setOpen(p => !p)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
        <Info size={12} />
        {open ? 'Hide' : 'Show'} Raw Response
      </button>
      {open && (
        <div className="code-block" style={{ marginTop: '0.5rem', maxHeight: 300, overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </div>
      )}
    </div>
  )
}
