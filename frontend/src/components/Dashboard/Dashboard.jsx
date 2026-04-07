import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Zap, CheckCircle, BookOpen, Tag,
  ListFilter, Activity, Image, Globe, Users,
  Server, ClipboardList, AlertTriangle, Gauge,
  TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const FEATURES = [
  {
    to: '/content-safety/text', icon: ShieldCheck, color: '#3b82f6', label: 'Text Analysis',
    desc: 'Hate, Sexual, Violence, Self-Harm detection with severity scoring',
    category: 'Content Safety',
  },
  {
    to: '/content-safety/image', icon: Image, color: '#06b6d4', label: 'Image Analysis',
    desc: 'Visual content moderation for presentations and reports',
    category: 'Content Safety',
  },
  {
    to: '/content-safety/prompt-shields', icon: Zap, color: '#f59e0b', label: 'Prompt Shields',
    desc: 'Jailbreak and indirect prompt injection protection',
    category: 'AI Safety',
  },
  {
    to: '/content-safety/groundedness', icon: CheckCircle, color: '#10b981', label: 'Groundedness',
    desc: 'Verify AI reports are grounded in source documents',
    category: 'AI Safety',
  },
  {
    to: '/content-safety/protected-material', icon: BookOpen, color: '#8b5cf6', label: 'Protected Material',
    desc: 'Copyright and proprietary research detection',
    category: 'AI Safety',
  },
  {
    to: '/content-safety/custom-categories', icon: Tag, color: '#f97316', label: 'Custom Categories',
    desc: 'Market manipulation, insider trading, front running',
    category: 'Custom Detection',
  },
  {
    to: '/content-safety/blocklists', icon: ListFilter, color: '#ef4444', label: 'Blocklists',
    desc: 'Restricted securities, sanctions, prohibited terms',
    category: 'Custom Detection',
  },
  {
    to: '/content-safety/task-adherence', icon: Activity, color: '#ec4899', label: 'Task Adherence',
    desc: 'AI agent tool call alignment and misuse prevention',
    category: 'AI Safety',
  },
  {
    to: '/foundry/overview', icon: Globe, color: '#8b5cf6', label: 'Control Plane Overview',
    desc: 'Fleet health, compliance posture, cost & token usage',
    category: 'Foundry',
  },
  {
    to: '/foundry/agents', icon: Users, color: '#3b82f6', label: 'Agent Fleet',
    desc: 'Multi-platform agent inventory and health monitoring',
    category: 'Foundry',
  },
  {
    to: '/foundry/compliance', icon: ClipboardList, color: '#10b981', label: 'Compliance Policies',
    desc: 'Guardrail policies, Azure Policy integration, bulk remediation',
    category: 'Foundry',
  },
  {
    to: '/foundry/security', icon: AlertTriangle, color: '#ef4444', label: 'Security Alerts',
    desc: 'Defender for Cloud and Microsoft Purview integration',
    category: 'Foundry',
  },
]

const SEVERITY_DATA = [
  { name: 'Clean', value: 68, color: '#10b981' },
  { name: 'Low', value: 14, color: '#84cc16' },
  { name: 'Medium', value: 11, color: '#f59e0b' },
  { name: 'High', value: 5, color: '#f97316' },
  { name: 'Critical', value: 2, color: '#ef4444' },
]

const WEEKLY_DATA = [
  { day: 'Mon', scanned: 1240, flagged: 87 },
  { day: 'Tue', scanned: 1890, flagged: 134 },
  { day: 'Wed', scanned: 1560, flagged: 102 },
  { day: 'Thu', scanned: 2100, flagged: 176 },
  { day: 'Fri', scanned: 1780, flagged: 143 },
  { day: 'Sat', scanned: 640, flagged: 31 },
  { day: 'Sun', scanned: 420, flagged: 18 },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})

    fetch('/api/foundry/overview')
      .then(r => r.json())
      .then(data => setStats(s => ({ ...s, ...data })))
      .catch(() => {})
  }, [])

  const topStats = [
    { label: 'Active Agents', value: stats?.active_agents ?? 10, sub: 'Across all projects', color: 'blue', trend: 'up' },
    { label: 'Prevented Behaviors', value: stats?.prevented_behaviors ?? 73, sub: 'This month', color: 'green', trend: 'up' },
    { label: 'Open Alerts', value: stats?.open_alerts ?? 5, sub: 'Needs attention', color: 'red', trend: 'down' },
    { label: 'Compliance Score', value: `${stats?.compliance_score ?? 78}%`, sub: 'Across fleet', color: 'amber', trend: 'up' },
    { label: 'Monthly Cost', value: `$${((stats?.cost_this_month_usd ?? 1842)).toFixed(0)}`, sub: 'Model inference', color: 'purple', trend: 'up' },
    { label: 'Token Usage', value: `${((stats?.total_token_usage ?? 9240000) / 1e6).toFixed(1)}M`, sub: 'Total tokens', color: 'cyan', trend: 'up' },
  ]

  return (
    <div className="fade-in">
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(16,185,129,0.06) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem 2rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 640 }}>
          <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>Capital Markets AI Safety Platform</div>
          <h1 style={{ marginBottom: '0.5rem' }}>Azure AI Content Safety</h1>
          <h2 style={{ color: 'var(--text-secondary)', fontWeight: 400, marginBottom: '0.75rem' }}>
            + AI Foundry Control Plane
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 540 }}>
            End-to-end demo covering all Content Safety features and Foundry Control Plane capabilities
            in a capital markets context. Screen trader communications, protect AI assistants,
            enforce compliance guardrails, and govern your AI agent fleet.
          </p>
        </div>
        <div style={{
          position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', gap: '0.5rem',
        }}>
          {['Hate & Fairness', 'Prompt Shields', 'Groundedness', 'Custom Detection', 'Fleet Governance'].map(tag => (
            <div key={tag} className="badge badge-blue" style={{ fontSize: '0.65rem', opacity: 0.7 }}>{tag}</div>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {topStats.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-value" style={{
              color: s.color === 'red' ? 'var(--accent-red)' :
                     s.color === 'green' ? 'var(--accent-green)' :
                     s.color === 'amber' ? 'var(--accent-amber)' :
                     s.color === 'purple' ? 'var(--accent-purple)' :
                     s.color === 'cyan' ? 'var(--accent-cyan)' : 'var(--accent-blue)',
            }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {s.trend === 'up' ? <TrendingUp size={11} style={{ color: 'var(--accent-green)' }} /> : <TrendingDown size={11} style={{ color: 'var(--accent-red)' }} />}
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Weekly scanning chart */}
        <div className="card">
          <div className="card-header">
            <h3>Weekly Content Scans</h3>
            <span className="badge badge-blue">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={WEEKLY_DATA} barGap={2}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="scanned" fill="rgba(59,130,246,0.4)" radius={3} name="Scanned" />
              <Bar dataKey="flagged" fill="rgba(239,68,68,0.7)" radius={3} name="Flagged" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity distribution */}
        <div className="card">
          <div className="card-header">
            <h3>Severity Distribution</h3>
            <span className="badge badge-cyan">All content types</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={SEVERITY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {SEVERITY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {SEVERITY_DATA.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Platform Features</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{FEATURES.length} capabilities</span>
      </div>
      <div className="grid-3">
        {FEATURES.map(f => {
          const Icon = f.icon
          return (
            <div
              key={f.to}
              className="card"
              onClick={() => navigate(f.to)}
              style={{ cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div className="feature-icon" style={{ background: `${f.color}20` }}>
                  <Icon size={16} style={{ color: f.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>{f.label}</h4>
                    <ArrowRight size={12} style={{ color: 'var(--text-dim)' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '0.15rem 0.5rem', borderRadius: 20,
                      background: `${f.color}15`, color: f.color,
                    }}>{f.category}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
