import { useState, useEffect } from 'react'
import { Bot, Filter, RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const STATUS_CONFIG = {
  active: { color: '#10b981', label: 'Active' },
  degraded: { color: '#f59e0b', label: 'Degraded' },
  suspended: { color: '#ef4444', label: 'Suspended' },
  idle: { color: '#6b7280', label: 'Idle' },
}

const COMPLIANCE_CONFIG = {
  compliant: { color: '#10b981', className: 'badge-safe' },
  'at-risk': { color: '#f59e0b', className: 'badge-medium' },
  non_compliant: { color: '#ef4444', className: 'badge-critical' },
}

function HealthBar({ score }) {
  const color = score >= 85 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className="progress-bar" style={{ flex: 1, maxWidth: 80 }}>
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: 28 }}>{score}</span>
    </div>
  )
}

export default function AgentFleet() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deskFilter, setDeskFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/foundry/agents')
      .then(r => r.json())
      .then(d => { setAgents(d.agents || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const desks = ['all', ...new Set((agents || []).map(a => a.desk || 'General'))]
  const filtered = (agents || []).filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (deskFilter === 'all' || (a.desk || 'General') === deskFilter)
  )

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    degraded: agents.filter(a => a.status === 'degraded').length,
    avgHealth: agents.length ? Math.round(agents.reduce((s, a) => s + (a.health_score || 0), 0) / agents.length) : 0,
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Agent Fleet</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI agents deployed across trading desks and capital markets workflows</p>
        </div>
        <button className="btn-secondary" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Agents', value: stats.total, color: '#3b82f6' },
          { label: 'Active', value: stats.active, color: '#10b981' },
          { label: 'Degraded', value: stats.degraded, color: '#f59e0b' },
          { label: 'Avg Health Score', value: `${stats.avgHealth}/100`, color: stats.avgHealth >= 85 ? '#10b981' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} /> Filters
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={deskFilter} onChange={e => setDeskFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
              {desks.map(d => <option key={d} value={d}>{d === 'all' ? 'All Desks' : d}</option>)}
            </select>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing {filtered.length} of {agents.length}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ marginRight: 8 }} /> Loading agents...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Desk / Platform</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Compliance</th>
                  <th>Tokens Today</th>
                  <th>Alerts</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.idle
                  const cc = COMPLIANCE_CONFIG[a.compliance_status] || COMPLIANCE_CONFIG.compliant
                  return (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.agent_id === a.agent_id ? null : a)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ padding: '0.3rem', background: '#3b82f620', borderRadius: 6 }}><Bot size={13} color="#3b82f6" /></div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.agent_id || a.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem' }}>{a.desk || 'General'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{a.platform || 'Azure Foundry'}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 500, color: sc.color }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                          {sc.label}
                        </span>
                      </td>
                      <td><HealthBar score={a.health_score || 0} /></td>
                      <td><span className={`badge ${cc.className}`} style={{ fontSize: '0.65rem' }}>{a.compliance_status?.replace('_', ' ')}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{(a.token_usage_today || 0).toLocaleString()}</td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: a.active_alerts > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                          {a.active_alerts || 0}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {(a.tags || []).slice(0, 3).map((t, j) => (
                            <span key={j} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="card fade-in" style={{ borderColor: '#3b82f640' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot size={14} color="#3b82f6" /> {selected.name} - Details</h3>
            <button className="btn-secondary" onClick={() => setSelected(null)} style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Model', value: selected.model || 'gpt-4o' },
              { label: 'Version', value: selected.version || '2024-11-20' },
              { label: 'Region', value: selected.region || 'eastus' },
              { label: 'Content Filter', value: selected.content_filter_enabled !== false ? 'Enabled' : 'Disabled' },
              { label: 'Prompt Shield', value: selected.prompt_shield_enabled !== false ? 'Enabled' : 'Disabled' },
              { label: 'Max Tokens/Day', value: (selected.token_limit_daily || 100000).toLocaleString() },
            ].map((f, i) => (
              <div key={i} style={{ padding: '0.6rem', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase' }}>{f.label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.value}</div>
              </div>
            ))}
          </div>
          {selected.recent_violations?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Recent Violations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {selected.recent_violations.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.07)', borderRadius: 4, fontSize: '0.78rem' }}>
                    <AlertCircle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
