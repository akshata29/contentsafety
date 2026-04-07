import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Bot, Cpu, ShieldCheck, AlertTriangle, DollarSign, Activity, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

function StatCard({ icon: Icon, label, value, sub, color = '#3b82f6', trend }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{label}</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color }}>{value}</div>
          {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
        </div>
        <div style={{ padding: '0.55rem', background: `${color}18`, borderRadius: 8 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: '0.7rem', fontSize: '0.72rem', color: trend >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          <TrendingUp size={10} style={{ display: 'inline', marginRight: 4 }} />
          {trend >= 0 ? '+' : ''}{trend}% vs last week
        </div>
      )}
    </div>
  )
}

export default function FoundryOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/foundry/overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      <span className="spinner" style={{ marginRight: 10 }} /> Loading Foundry overview...
    </div>
  )

  if (!data) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Failed to load overview.</div>

  const hourlyData = (data.hourly_requests && data.hourly_requests.length > 0)
    ? data.hourly_requests
    : Array.from({ length: 24 }, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        calls: 0,
        blocked: 0,
      }))

  const pieData = [
    { name: 'Compliant', value: data.compliant_agents ?? 0 },
    { name: 'At Risk', value: data.at_risk_agents ?? 0 },
    { name: 'Critical', value: data.critical_agents ?? 0 },
  ]

  const governanceData = data.governance_summary && data.governance_summary.length > 0
    ? data.governance_summary
    : []

  const modelUsage = (data.top_models || []).map(m => ({
    name: m.name?.replace('gpt-', 'GPT-') || m.name,
    tokens: m.tokens_used_today || 0,
    cost: m.cost_today || 0,
  }))

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Foundry Control Plane</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Real-time AI governance across your capital markets infrastructure</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)' }}>All systems nominal</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard icon={Bot} label="Active Agents" value={(data.total_agents ?? 0).toLocaleString()} sub="Across all desks" color="#3b82f6" trend={5} />
        <StatCard icon={Cpu} label="Model Deployments" value={data.total_deployments ?? 0} sub={`${data.guardrails_enabled ?? 0} with guardrails`} color="#8b5cf6" />
        <StatCard icon={ShieldCheck} label="Compliance Score" value={`${data.compliance_score ?? 0}%`} sub="Guardrail coverage" color="#10b981" trend={2} />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={data.active_alerts ?? 0} sub={`${data.critical_alerts ?? 0} critical`} color="#f59e0b" trend={-12} />
        <StatCard icon={DollarSign} label="Daily AI Spend" value={`$${(data.daily_cost ?? 0).toLocaleString()}`} sub="Across all models" color="#ec4899" />
        <StatCard icon={Activity} label="Requests / hr" value={data.requests_today > 0 ? Math.round(data.requests_today / 24).toLocaleString() : '0'} sub={`${(data.requests_today ?? 0).toLocaleString()} today`} color="#06b6d4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Hourly API Requests</h3></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }} />
              <Bar dataKey="calls" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Total" />
              <Bar dataKey="blocked" fill="#ef4444" radius={[2, 2, 0, 0]} name="Blocked" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Agent Compliance Status</h3></div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#10b981', '#f59e0b', '#ef4444'][i], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>Model Token Consumption Today</h3></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modelUsage} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }} formatter={v => [`${v.toLocaleString()} tokens`, 'Usage']} />
              <Bar dataKey="tokens" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><h3>Governance Summary</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {governanceData.length > 0 ? governanceData.map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.color }}>{item.score}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.score}%`, background: item.color }} />
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No deployment data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Recent Activity Feed</h3></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Time</th><th>Event</th><th>Agent</th><th>Status</th></tr></thead>
            <tbody>
              {(data.recent_events || []).map((ev, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ev.timestamp}</td>
                  <td style={{ fontSize: '0.78rem' }}>{ev.event}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--accent-purple)' }}>{ev.agent}</td>
                  <td><span className={`badge ${ev.status === 'blocked' ? 'badge-critical' : ev.status === 'warning' ? 'badge-medium' : 'badge-safe'}`}  style={{ fontSize: '0.65rem' }}>{ev.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
