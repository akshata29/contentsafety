import { useState, useEffect } from 'react'
import { AlertTriangle, Bell, CheckCircle, Clock, Filter, RefreshCw, Shield, Eye } from 'lucide-react'

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', className: 'badge-critical', bgColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.2)' },
  high: { color: '#f97316', className: 'badge-high', bgColor: 'rgba(249,115,22,0.07)', borderColor: 'rgba(249,115,22,0.2)' },
  medium: { color: '#f59e0b', className: 'badge-medium', bgColor: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.2)' },
  low: { color: '#3b82f6', className: 'badge-low', bgColor: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.2)' },
}

const STATUS_CONFIG = {
  open: { color: '#ef4444', label: 'Open' },
  investigating: { color: '#f59e0b', label: 'Investigating' },
  resolved: { color: '#10b981', label: 'Resolved' },
  dismissed: { color: '#6b7280', label: 'Dismissed' },
}

const SOURCE_CONFIG = {
  'Defender for AI': { color: '#0078d4', icon: '🛡' },
  'Microsoft Purview': { color: '#7719aa', icon: '🔍' },
  'Azure Foundry': { color: '#8b5cf6', icon: '🏭' },
  'Custom Rule': { color: '#10b981', icon: '⚙' },
}

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/foundry/security/alerts')
      .then(r => r.json())
      .then(d => { setAlerts(d.alerts || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = alerts.filter(a =>
    (severityFilter === 'all' || a.severity === severityFilter) &&
    (statusFilter === 'all' || a.status === statusFilter) &&
    (sourceFilter === 'all' || a.source === sourceFilter)
  )

  const sources = ['all', ...new Set(alerts.map(a => a.source).filter(Boolean))]

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    open: alerts.filter(a => a.status === 'open').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Security Alerts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Threats and compliance incidents from Defender for AI, Purview, and Foundry guardrails</p>
        </div>
        <button className="btn-secondary" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Critical', value: counts.critical, color: '#ef4444', filter: () => { setSeverityFilter('critical'); setStatusFilter('all') } },
          { label: 'High Severity', value: counts.high, color: '#f97316', filter: () => { setSeverityFilter('high'); setStatusFilter('all') } },
          { label: 'Open / Active', value: counts.open, color: '#f59e0b', filter: () => { setStatusFilter('open'); setSeverityFilter('all') } },
          { label: 'Investigating', value: counts.investigating, color: '#3b82f6', filter: () => { setStatusFilter('investigating'); setSeverityFilter('all') } },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={s.filter}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Filter size={13} /> Filters</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
              <option value="all">All Severities</option>
              {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
              {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
            </select>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing {filtered.length} of {alerts.length}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ marginRight: 8 }} /> Loading alerts...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {filtered.map((a, i) => {
              const sc = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low
              const stc = STATUS_CONFIG[a.status] || STATUS_CONFIG.open
              const isSelected = selected?.alert_id === a.alert_id
              return (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    background: isSelected ? sc.bgColor : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? sc.borderColor : 'var(--border)'}`,
                    borderLeft: `3px solid ${sc.color}`,
                    borderRadius: 6, cursor: 'pointer',
                  }}
                  onClick={() => setSelected(isSelected ? null : a)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <AlertTriangle size={14} color={sc.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{a.title}</span>
                        <span className={`badge ${sc.className}`} style={{ fontSize: '0.6rem' }}>{a.severity}</span>
                        <span style={{ fontSize: '0.68rem', color: stc.color, marginLeft: 'auto' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: stc.color, display: 'inline-block', marginRight: 4 }} />
                          {stc.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ color: SOURCE_CONFIG[a.source]?.color || '#6b7280' }}>
                          {SOURCE_CONFIG[a.source]?.icon} {a.source}
                        </span>
                        <span>{a.agent || a.resource}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>{a.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${sc.borderColor}` }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{a.description}</div>
                      {(a.recommendations || []).length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Recommended Actions</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {a.recommendations.map((r, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem' }}>
                                <Shield size={11} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {a.affected_entities?.length > 0 && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Affected:</span>
                          {a.affected_entities.map((e, j) => (
                            <span key={j} style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 4 }}>{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
