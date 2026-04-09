import { useState, useEffect } from 'react'
import { BarChart2, RefreshCw, Shield, Cpu, Users, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Activity } from 'lucide-react'
import { apiFetch } from '../../lib/apiFetch'

const CTRL_COLS = [
  { key: 'jailbreak', label: 'Jailbreak', color: '#ef4444' },
  { key: 'content_safety', label: 'Content Safety', color: '#f97316' },
  { key: 'indirect_attack', label: 'Indirect Attack', color: '#8b5cf6' },
  { key: 'protected_material', label: 'Protected Material', color: '#3b82f6' },
  { key: 'pii', label: 'PII', color: '#06b6d4' },
  { key: 'task_adherence', label: 'Task Adherence', color: '#f59e0b' },
]

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>
    </div>
  )
}

function BarChartSVG({ data, maxVal }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120,
        color: 'var(--text-muted)', fontSize: '0.8rem', flexDirection: 'column', gap: '0.4rem' }}>
        <Shield size={24} style={{ opacity: 0.3 }} />
        No blocks recorded yet. Run filter tests to populate this chart.
      </div>
    )
  }
  const w = 440
  const h = 160
  const padL = 110
  const padR = 20
  const padT = 12
  const padB = 20
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const max = maxVal || Math.max(...data.map(d => d.count), 1)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      {data.map((d, i) => {
        const barW = innerW
        const barH = Math.max(2, (d.count / max) * innerH)
        const y = padT + innerH - barH
        const rowH = (innerH / data.length)
        const ry = padT + i * rowH + rowH * 0.15
        const bh = rowH * 0.7
        const bx = padL
        const bw = Math.max(2, (d.count / max) * innerW)
        return (
          <g key={d.category}>
            <text x={padL - 6} y={ry + bh / 2 + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{d.category}</text>
            <rect x={bx} y={ry} width={innerW} height={bh} fill="var(--bg-elevated)" rx={3} />
            <rect x={bx} y={ry} width={bw} height={bh} fill={d.color} rx={3} opacity={0.85} />
            <text x={bx + bw + 5} y={ry + bh / 2 + 4} fontSize="10" fill={d.color} fontWeight="bold">{d.count}</text>
          </g>
        )
      })}
    </svg>
  )
}

function TimelineSVG({ data, labelStep = 2 }) {
  const w = 500
  const h = 100
  const padL = 10
  const padR = 10
  const padT = 10
  const padB = 24
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const max = Math.max(...data.map(d => d.blocks), 1)
  const pts = data.map((d, i) => {
    const x = data.length > 1 ? padL + (i / (data.length - 1)) * innerW : padL + innerW / 2
    const y = padT + innerH - (d.blocks / max) * innerH
    return { x, y, ...d }
  })
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillD = `${pathD} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#tgrad)" />
      <path d={pathD} stroke="#f59e0b" strokeWidth="2" fill="none" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#f59e0b" />
          {i % labelStep === 0 && (
            <text x={p.x} y={h - 4} textAnchor="middle" fontSize="8" fill="var(--text-muted)">{p.hour}</text>
          )}
        </g>
      ))}
      {[0, 0.5, 1].map(frac => (
        <line key={frac} x1={padL} y1={padT + innerH * (1 - frac)} x2={w - padR} y2={padT + innerH * (1 - frac)}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
    </svg>
  )
}

function CoverageMatrix({ data }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Entity</th>
            <th>Type</th>
            <th>Guardrail</th>
            {CTRL_COLS.map(c => <th key={c.key} style={{ textAlign: 'center', minWidth: 70 }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const unprotected = row.guardrail === 'None'
            return (
              <tr key={i} style={{ background: unprotected ? 'rgba(239,68,68,0.04)' : undefined }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {row.type === 'Model'
                      ? <Cpu size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
                      : <Users size={12} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{row.entity}</span>
                    {unprotected && <AlertTriangle size={11} style={{ color: '#ef4444', flexShrink: 0 }} />}
                  </div>
                </td>
                <td>
                  <span style={{
                    padding: '0.15rem 0.4rem', borderRadius: 3, fontSize: '0.65rem', fontWeight: 600,
                    background: row.type === 'Model' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                    color: row.type === 'Model' ? '#3b82f6' : '#8b5cf6',
                  }}>{row.type}</span>
                </td>
                <td style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: unprotected ? '#ef4444' : 'var(--text-muted)' }}>
                  {row.guardrail}
                </td>
                {CTRL_COLS.map(c => (
                  <td key={c.key} style={{ textAlign: 'center' }}>
                    {row[c.key]
                      ? <CheckCircle size={14} style={{ color: c.color }} />
                      : <XCircle size={14} style={{ color: 'var(--border)' }} />
                    }
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EventRow({ ev }) {
  const sevColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#3b82f6' }
  const c = sevColors[ev.severity] || '#6b7280'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.65rem', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0, minWidth: 52 }}>{ev.time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
        {ev.entity_type === 'Model' ? <Cpu size={11} style={{ color: '#3b82f6' }} /> : <Users size={11} style={{ color: '#8b5cf6' }} />}
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 500, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.entity}</span>
      </div>
      <span style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.preview}</span>
      <span style={{ padding: '0.12rem 0.4rem', borderRadius: 3, fontSize: '0.65rem', fontWeight: 700, background: `${c}20`, color: c, border: `1px solid ${c}40`, flexShrink: 0 }}>{ev.category}</span>
      <span style={{ padding: '0.12rem 0.4rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', flexShrink: 0 }}>BLOCKED</span>
    </div>
  )
}

const TIME_RANGES = [
  { key: '1d', label: '1D' },
  { key: '7d', label: '7D' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
]

const LABEL_STEP = { '1d': 2, '7d': 1, '1m': 5, '3m': 2, '1y': 1 }

export default function FilterAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1d')

  const load = (range) => {
    const r = range || timeRange
    setLoading(true)
    apiFetch(`/api/content-filters/analytics?window=${r}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load(timeRange)
  }, [timeRange])

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <span className="spinner" style={{ marginRight: 8 }} /> Loading analytics...
      </div>
    )
  }

  const { summary, coverage_matrix, blocks_by_category, blocks_over_time, recent_events, window_label, recent_window_label } = data
  const wLabel = window_label || '24h'
  const rLabel = recent_window_label || '2h'
  const labelStep = LABEL_STEP[timeRange] || 2

  const unprotected = coverage_matrix.filter(r => r.guardrail === 'None')

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', borderLeft: '3px solid #f59e0b',
      }}>
        <div className="feature-icon" style={{ background: '#f59e0b20', marginTop: 2 }}>
          <BarChart2 size={18} style={{ color: '#f59e0b' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '0.25rem' }}>Filter Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 720 }}>
            Real-time guardrail coverage, block rates, and filter events across all deployed models and agents. Identify unprotected entities, monitor block patterns by category, and track the 24-hour block timeline.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem' }}>
            {TIME_RANGES.map(tr => (
              <button
                key={tr.key}
                onClick={() => setTimeRange(tr.key)}
                style={{
                  padding: '0.25rem 0.55rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.12s',
                  background: timeRange === tr.key ? '#f59e0b' : 'transparent',
                  color: timeRange === tr.key ? '#000' : 'var(--text-muted)',
                }}
              >{tr.label}</button>
            ))}
          </div>
          {data.data_source === 'live' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.2rem 0.55rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)' }}>
              <Activity size={10} /> LIVE DATA
            </span>
          )}
          <button className="btn-secondary" onClick={() => load(timeRange)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Alert for unprotected entities */}
      {unprotected.length > 0 && (
        <div className="fade-in" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.65rem 1rem', marginBottom: '1rem',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
        }}>
          <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
            {unprotected.length} unprotected {unprotected.length === 1 ? 'entity' : 'entities'} detected:
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {unprotected.map(u => u.entity).join(', ')} - no guardrail assigned
          </span>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        <StatCard label="Total Guardrails" value={summary.total_guardrails} color="#f59e0b" icon={Shield} />
        <StatCard label="Deployments Covered" value={`${summary.deployments_covered}`} sub="model deployments" color="#3b82f6" icon={Cpu} />
        <StatCard label="Agents Covered" value={`${summary.agents_covered}`} sub="AI agents" color="#8b5cf6" icon={Users} />
        <StatCard label={`Blocks (${wLabel})`} value={summary.last_24h_blocked}
          sub={summary.last_24h_requests > 0
            ? `${summary.block_rate_pct}% of ${summary.last_24h_requests >= 1000 ? (summary.last_24h_requests / 1000).toFixed(1) + 'k' : summary.last_24h_requests} requests`
            : 'No tests run yet this session'}
          color="#ef4444" icon={Shield} />
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Blocks by category */}
        <div className="card">
          <div className="card-header">
            <h3>Blocks by Category ({wLabel})</h3>
            <span className="badge badge-critical">{blocks_by_category.reduce((s, d) => s + d.count, 0)} total</span>
          </div>
          <BarChartSVG data={blocks_by_category} />
          {blocks_by_category.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {blocks_by_category.map(d => (
                <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.category}: {d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 24h timeline */}
        <div className="card">
          <div className="card-header">
            <h3>{wLabel} Block Timeline</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={13} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Peak: {Math.max(...blocks_over_time.map(d => d.blocks))} blocks/hr</span>
            </div>
          </div>
          <TimelineSVG data={blocks_over_time} labelStep={labelStep} />
          {timeRange === '1d' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>00:00</span>
              <span>Trading open</span>
              <span>Market close</span>
              <span>23:00</span>
            </div>
          )}
          <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {timeRange === '1d'
              ? 'Peak activity during US market hours (10:00-16:00 ET) consistent with trading session patterns.'
              : `Block events aggregated across ${wLabel}. Run filter tests to populate historical data.`
            }
          </div>
        </div>
      </div>

      {/* Coverage matrix */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h3>Guardrail Coverage Matrix</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={13} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Covered</span>
            <XCircle size={13} style={{ color: 'var(--border)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not covered</span>
          </div>
        </div>
        <CoverageMatrix data={coverage_matrix} />
      </div>

      {/* Recent events */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Recent Block Events
          </h3>
          <span className="badge badge-critical">{recent_events.length} in last {rLabel}</span>
        </div>
        {recent_events.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem',
            flexDirection: 'column', gap: '0.5rem' }}>
            <CheckCircle size={28} style={{ color: '#10b981', opacity: 0.6 }} />
            <span>No block events in the last {rLabel}.</span>
            <span style={{ fontSize: '0.72rem' }}>Run model or agent filter tests to record real events here.</span>
          </div>
        ) : (
          <div>
            {recent_events.map((ev, i) => <EventRow key={i} ev={ev} />)}
          </div>
        )}
      </div>
    </div>
  )
}
