import { useState, useEffect } from 'react'
import { Cpu, Shield, RefreshCw, AlertTriangle, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'

function GuardrailToggle({ enabled, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      {enabled
        ? <ToggleRight size={16} color="#10b981" />
        : <ToggleLeft size={16} color="#6b7280" />}
      <span style={{ fontSize: '0.72rem', color: enabled ? '#10b981' : 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

function QuotaBar({ used, limit, unit = 'k tokens' }) {
  const pct = limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0
  const color = pct >= 85 ? '#ef4444' : pct >= 65 ? '#f59e0b' : '#10b981'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{((used || 0) / 1000).toFixed(0)}k / {((limit || 0) / 1000).toFixed(0)}k {unit}</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function ModelDeployments() {
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading] = useState(true)
  const [remediating, setRemediating] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/foundry/deployments')
      .then(r => r.json())
      .then(d => { setDeployments(d.deployments || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const remediate = async (id) => {
    if (!window.confirm('Apply guardrail remediation to this deployment?')) return
    setRemediating(id)
    try {
      const r = await fetch(`/api/foundry/deployments/${id}/remediate`, { method: 'POST' })
      if (r.ok) {
        setDeployments(prev => prev.map(d => d.deployment_id === id
          ? { ...d, content_filter_enabled: true, prompt_shield_enabled: true, abuse_monitoring_enabled: true, compliance_status: 'compliant' }
          : d
        ))
      }
    } finally {
      setRemediating(null)
    }
  }

  const stats = {
    total: deployments.length,
    shielded: deployments.filter(d => d.prompt_shield_enabled).length,
    filtered: deployments.filter(d => d.content_filter_enabled).length,
    compliant: deployments.filter(d => d.compliance_status === 'compliant').length,
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Model Deployments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage guardrails, content safety settings, and quota for all deployed models</p>
        </div>
        <button className="btn-secondary" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Deployments', value: stats.total, color: '#3b82f6' },
          { label: 'Prompt Shield On', value: `${stats.shielded}/${stats.total}`, color: '#8b5cf6' },
          { label: 'Content Filter On', value: `${stats.filtered}/${stats.total}`, color: '#10b981' },
          { label: 'Compliant', value: `${stats.compliant}/${stats.total}`, color: stats.compliant === stats.total ? '#10b981' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Cpu size={14} /> All Deployments</h3>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ marginRight: 8 }} /> Loading...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Deployment</th>
                  <th>Model</th>
                  <th>Region</th>
                  <th>Content Filter</th>
                  <th>Prompt Shield</th>
                  <th>Abuse Monitor</th>
                  <th>Quota Usage</th>
                  <th>Compliance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((d, i) => {
                  const needsRemediation = !d.content_filter_enabled || !d.prompt_shield_enabled
                  return (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.deployment_id === d.deployment_id ? null : d)}>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{d.name}</div>
                        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{d.deployment_id}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem' }}>{d.model}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.version}</div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.region}</td>
                      <td><GuardrailToggle enabled={d.content_filter_enabled} label={d.content_filter_enabled ? 'On' : 'Off'} /></td>
                      <td><GuardrailToggle enabled={d.prompt_shield_enabled} label={d.prompt_shield_enabled ? 'On' : 'Off'} /></td>
                      <td><GuardrailToggle enabled={d.abuse_monitoring_enabled} label={d.abuse_monitoring_enabled ? 'On' : 'Off'} /></td>
                      <td style={{ minWidth: 130 }}>
                        <QuotaBar used={d.tokens_used_today || 0} limit={d.token_limit_daily || 100000} />
                      </td>
                      <td>
                        <span className={`badge ${d.compliance_status === 'compliant' ? 'badge-safe' : d.compliance_status === 'at-risk' ? 'badge-medium' : 'badge-critical'}`} style={{ fontSize: '0.65rem' }}>
                          {d.compliance_status || 'unknown'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {needsRemediation ? (
                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => remediate(d.deployment_id)}
                            disabled={remediating === d.deployment_id}
                          >
                            {remediating === d.deployment_id ? <span className="spinner" style={{ width: 10, height: 10 }} /> : <Shield size={10} />}
                            Fix
                          </button>
                        ) : (
                          <span style={{ color: 'var(--accent-green)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> OK
                          </span>
                        )}
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
        <div className="card fade-in" style={{ borderColor: '#8b5cf640' }}>
          <div className="card-header">
            <h3>{selected.name} - Deployment Details</h3>
            <button className="btn-secondary" onClick={() => setSelected(null)} style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Guardrail Configuration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                {[
                  { label: 'Content Filtering', enabled: selected.content_filter_enabled },
                  { label: 'Prompt Shield (Jailbreak)', enabled: selected.prompt_shield_enabled },
                  { label: 'Abuse Monitoring', enabled: selected.abuse_monitoring_enabled },
                  { label: 'Groundedness Check', enabled: selected.groundedness_enabled },
                  { label: 'Protected Material', enabled: selected.protected_material_enabled },
                ].map((g, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
                    <span style={{ fontSize: '0.78rem' }}>{g.label}</span>
                    <GuardrailToggle enabled={g.enabled} label={g.enabled ? 'Enabled' : 'Disabled'} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Token Quota</div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Daily</div>
                  <QuotaBar used={selected.tokens_used_today || 0} limit={selected.token_limit_daily || 100000} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Monthly</div>
                  <QuotaBar used={selected.tokens_used_month || 0} limit={selected.token_limit_monthly || 1000000} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
