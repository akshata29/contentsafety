import { useState, useEffect } from 'react'
import { FolderOpen, Globe, Users, RefreshCw, ChevronDown, ChevronRight, Cpu, Bot, Shield } from 'lucide-react'

const REGION_FLAGS = {
  'eastus': 'US-E', 'eastus2': 'US-E2', 'westus': 'US-W', 'westus2': 'US-W2',
  'westeurope': 'EU-W', 'northeurope': 'EU-N', 'uksouth': 'UK-S',
  'japaneast': 'JP-E', 'australiaeast': 'AU-E', 'southeastasia': 'AS-SE',
}

const COMPLIANCE_COLORS = {
  compliant: '#10b981', 'at-risk': '#f59e0b', non_compliant: '#ef4444',
}

function ServicePill({ name }) {
  const colors = { 'Content Safety': '#3b82f6', 'OpenAI': '#8b5cf6', 'Purview': '#7719aa', 'Defender': '#0078d4', 'CosmosDB': '#006621', 'Blob Storage': '#0078d4', 'Key Vault': '#ffd700' }
  const color = Object.entries(colors).find(([k]) => name.includes(k))?.[1] || '#6b7280'
  return (
    <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, color, fontWeight: 500 }}>
      {name}
    </span>
  )
}

function ProjectCard({ project, expanded, onToggle }) {
  const cc = COMPLIANCE_COLORS[project.compliance_status] || '#6b7280'
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--bg-elevated)',
    }}>
      <div
        style={{ padding: '0.85rem 1rem', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
        onClick={onToggle}
      >
        <div style={{ padding: '0.4rem', background: '#3b82f620', borderRadius: 6, marginTop: 2 }}>
          <FolderOpen size={14} color="#3b82f6" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</span>
            <span style={{
              fontSize: '0.6rem', padding: '0.1rem 0.35rem',
              background: `${cc}18`, border: `1px solid ${cc}40`, borderRadius: 4, color: cc, fontWeight: 600
            }}>
              {project.compliance_status?.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {REGION_FLAGS[project.region] || project.region}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} /> {project.owner}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bot size={10} /> {project.agent_count || 0} agents</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Cpu size={10} /> {project.deployment_count || 0} deployments</span>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {(project.connected_services || []).map((s, j) => <ServicePill key={j} name={s} />)}
          </div>
        </div>
        <div style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: 2 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.85rem 1rem', background: 'var(--bg-base)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {[
              { label: 'Project ID', value: project.project_id, mono: true },
              { label: 'Subscription', value: project.subscription_id?.substring(0, 18) + '...', mono: true },
              { label: 'Created', value: project.created_date },
              { label: 'Resource Group', value: project.resource_group },
              { label: 'Daily Cost', value: `$${(project.daily_cost || 0).toFixed(2)}` },
              { label: 'Monthly Budget', value: `$${(project.monthly_budget || 0).toLocaleString()}` },
            ].map((f, i) => (
              <div key={i} style={{ padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 4 }}>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{f.label}</div>
                <div style={{ fontSize: '0.78rem', fontFamily: f.mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>{f.value}</div>
              </div>
            ))}
          </div>

          {(project.guardrails || []).length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Active Guardrails</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {project.guardrails.map((g, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', padding: '0.15rem 0.4rem', background: '#10b98118', border: '1px solid #10b98140', borderRadius: 4, color: '#10b981' }}>
                    <Shield size={9} /> {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [complianceFilter, setComplianceFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/foundry/admin/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p =>
    (search === '' || p.name?.toLowerCase().includes(search.toLowerCase()) || p.owner?.toLowerCase().includes(search.toLowerCase())) &&
    (complianceFilter === 'all' || p.compliance_status === complianceFilter)
  )

  const totalAgents = projects.reduce((s, p) => s + (p.agent_count || 0), 0)
  const totalDeployments = projects.reduce((s, p) => s + (p.deployment_count || 0), 0)
  const compliantCount = projects.filter(p => p.compliance_status === 'compliant').length
  const totalCost = projects.reduce((s, p) => s + (p.daily_cost || 0), 0)

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Admin - Projects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage all Foundry projects, connections, guardrails, and resource allocations across the firm</p>
        </div>
        <button className="btn-secondary" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Projects', value: projects.length, color: '#3b82f6' },
          { label: 'Total Agents', value: totalAgents, color: '#8b5cf6' },
          { label: 'Total Deployments', value: totalDeployments, color: '#06b6d4' },
          { label: 'Compliant Projects', value: `${compliantCount}/${projects.length}`, color: compliantCount === projects.length ? '#10b981' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FolderOpen size={14} /> Projects</h3>
          <input
            placeholder="Search by name or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
          />
          <select value={complianceFilter} onChange={e => setComplianceFilter(e.target.value)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant</option>
            <option value="at-risk">At Risk</option>
            <option value="non_compliant">Non-Compliant</option>
          </select>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{filtered.length} of {projects.length}</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ marginRight: 8 }} /> Loading projects...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((p, i) => (
              <ProjectCard
                key={i}
                project={p}
                expanded={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
