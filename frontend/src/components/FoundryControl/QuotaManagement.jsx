import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, Zap, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react'

function QuotaCard({ quota }) {
  const usedPct = quota.limit > 0 ? Math.min(100, Math.round(quota.used / quota.limit * 100)) : 0
  const color = usedPct >= 90 ? '#ef4444' : usedPct >= 75 ? '#f59e0b' : '#10b981'
  const dailyPct = quota.daily_limit > 0 ? Math.min(100, Math.round((quota.daily_used || 0) / quota.daily_limit * 100)) : null

  return (
    <div style={{
      padding: '1rem',
      background: 'var(--bg-elevated)',
      border: `1px solid ${usedPct >= 90 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
      borderRadius: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{quota.model}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{quota.region} | {quota.deployment_type || 'Standard'}</div>
        </div>
        {usedPct >= 80 && (
          <div style={{ padding: '0.2rem', background: 'rgba(245,158,11,0.15)', borderRadius: 4 }}>
            <AlertTriangle size={14} color="#f59e0b" />
          </div>
        )}
      </div>

      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly quota</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{usedPct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-fill" style={{ width: `${usedPct}%`, background: color, height: '100%' }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {(quota.used / 1000).toFixed(0)}k / {(quota.limit / 1000).toFixed(0)}k {quota.unit || 'tokens'}
        </div>
      </div>

      {dailyPct !== null && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Daily</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: dailyPct >= 85 ? '#ef4444' : '#6b7280' }}>{dailyPct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 5 }}>
            <div className="progress-fill" style={{ width: `${dailyPct}%`, background: dailyPct >= 85 ? '#ef4444' : '#6b7280', height: '100%' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Daily Cost</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>${(quota.daily_cost || 0).toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Monthly Proj.</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>${(quota.projected_monthly_cost || 0).toFixed(0)}</div>
        </div>
      </div>
    </div>
  )
}

export default function QuotaManagement() {
  const [quotas, setQuotas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/foundry/quota')
      .then(r => r.json())
      .then(d => { setQuotas(d.quotas || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalDailyCost = quotas.reduce((s, q) => s + (q.daily_cost || 0), 0)
  const totalProjected = quotas.reduce((s, q) => s + (q.projected_monthly_cost || 0), 0)
  const nearLimit = quotas.filter(q => q.limit > 0 && (q.used / q.limit) >= 0.8).length
  const totalTokensToday = quotas.reduce((s, q) => s + (q.daily_used || 0), 0)

  const barData = quotas.map(q => ({
    name: q.model?.replace('gpt-', 'GPT-') || q.model,
    used: Math.round(q.used / 1000),
    limit: Math.round(q.limit / 1000),
    pct: q.limit > 0 ? Math.round(q.used / q.limit * 100) : 0,
  }))

  const costData = quotas.map(q => ({
    name: q.model?.replace('gpt-', 'GPT-') || q.model,
    daily: parseFloat((q.daily_cost || 0).toFixed(2)),
    projected: parseFloat((q.projected_monthly_cost || 0).toFixed(0)),
  }))

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Quota & Cost Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monitor token consumption, rate limits, and AI spend across all Foundry deployments</p>
        </div>
        <button className="btn-secondary" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Daily AI Spend', value: `$${totalDailyCost.toFixed(0)}`, sub: 'Across all models', color: '#ec4899', icon: DollarSign },
          { label: 'Monthly Projected', value: `$${totalProjected.toFixed(0)}`, sub: 'At current pace', color: '#f59e0b', icon: TrendingUp },
          { label: 'Tokens Today', value: `${(totalTokensToday / 1000).toFixed(0)}k`, sub: 'All deployments', color: '#3b82f6', icon: Zap },
          { label: 'Near Limit', value: nearLimit, sub: 'Deployments at 80%+', color: nearLimit > 0 ? '#ef4444' : '#10b981', icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
              <div style={{ padding: '0.4rem', background: `${s.color}18`, borderRadius: 6 }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Monthly Token Usage (x1000)</h3></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }} formatter={v => [`${v}k tokens`]} />
              <Bar dataKey="limit" fill="#1e293b" name="Limit" radius={[2, 2, 0, 0]} />
              <Bar dataKey="used" fill="#8b5cf6" name="Used" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Daily vs. Projected Monthly Cost ($)</h3></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={costData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }} formatter={v => [`$${v}`]} />
              <Bar dataKey="daily" fill="#ec4899" name="Daily ($)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="projected" fill="#f59e0b" name="Monthly ($)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <span className="spinner" style={{ marginRight: 8 }} /> Loading quota data...
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per-Deployment Quota</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {quotas.map((q, i) => <QuotaCard key={i} quota={q} />)}
          </div>
        </div>
      )}
    </div>
  )
}
