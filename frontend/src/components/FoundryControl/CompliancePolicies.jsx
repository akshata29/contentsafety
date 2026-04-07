import { useState, useEffect } from 'react'
import { ShieldCheck, ClipboardList, AlertTriangle, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

const TABS = ['Policies', 'Assets', 'Guardrails', 'Security Posture']

const FRAMEWORK_COLORS = {
  'MiFID II': '#3b82f6',
  'FINRA': '#8b5cf6',
  'SOC2': '#10b981',
  'GDPR': '#f59e0b',
  'ISO27001': '#06b6d4',
  'SEC': '#ec4899',
}

function PolicyRow({ policy, onExpand, expanded }) {
  const violationColor = policy.violations > 5 ? '#ef4444' : policy.violations > 0 ? '#f59e0b' : '#10b981'
  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={onExpand}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{policy.name}</div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{policy.policy_id}</div>
            </div>
          </div>
        </td>
        <td>
          <span style={{
            display: 'inline-block', fontSize: '0.68rem', padding: '0.15rem 0.4rem',
            borderRadius: 4, fontWeight: 600,
            background: `${FRAMEWORK_COLORS[policy.framework] || '#6b7280'}20`,
            color: FRAMEWORK_COLORS[policy.framework] || '#6b7280',
            border: `1px solid ${FRAMEWORK_COLORS[policy.framework] || '#6b7280'}40`
          }}>{policy.framework}</span>
        </td>
        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{policy.scope}</td>
        <td>
          <span className={`badge ${policy.status === 'active' ? 'badge-safe' : policy.status === 'draft' ? 'badge-medium' : 'badge-critical'}`} style={{ fontSize: '0.65rem' }}>{policy.status}</span>
        </td>
        <td>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: violationColor }}>{policy.violations}</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}> violation{policy.violations !== 1 ? 's' : ''}</span>
        </td>
        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{policy.last_evaluated}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: '0 0.75rem 0.75rem 2rem', background: 'var(--bg-elevated)' }}>
            <div style={{ padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Controls</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {(policy.controls || []).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                        <CheckCircle size={11} color="#10b981" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Description</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{policy.description}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function GuardrailsTab() {
  const guardrails = [
    { name: 'Prompt Injection Shield', status: 'active', coverage: 100, models: 8, desc: 'Blocks jailbreak and indirect prompt injection attacks on all trading AI assistants' },
    { name: 'Content Harm Filter', status: 'active', coverage: 87, models: 7, desc: 'Filters hate, violence, sexual, and self-harm content from model I/O' },
    { name: 'Groundedness Check', status: 'active', coverage: 62, models: 5, desc: 'Ensures AI-generated research reports are grounded in verified source data' },
    { name: 'Protected Material Filter', status: 'active', coverage: 75, models: 6, desc: 'Prevents reproduction of copyrighted analyst reports and research' },
    { name: 'Custom Financial Categories', status: 'active', coverage: 100, models: 8, desc: 'Detects market manipulation, insider trading, front-running language' },
    { name: 'Task Adherence Check', status: 'partial', coverage: 50, models: 4, desc: 'Validates AI tool calls align with stated user intent in workflow agents' },
    { name: 'Sanctions Blocklist', status: 'active', coverage: 100, models: 8, desc: 'Screens all inputs for sanctioned entities, restricted securities, and prohibited terms' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {guardrails.map((g, i) => (
        <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={13} color={g.status === 'active' ? '#10b981' : '#f59e0b'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{g.name}</span>
              <span className={`badge ${g.status === 'active' ? 'badge-safe' : 'badge-medium'}`} style={{ fontSize: '0.6rem' }}>{g.status}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{g.desc}</div>
          </div>
          <div style={{ minWidth: 140 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Coverage</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: g.coverage >= 90 ? '#10b981' : g.coverage >= 60 ? '#f59e0b' : '#ef4444' }}>{g.coverage}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${g.coverage}%`, background: g.coverage >= 90 ? '#10b981' : g.coverage >= 60 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{g.models} of 8 models</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SecurityPostureTab() {
  const dimensions = [
    { name: 'Identity & Access', score: 92, framework: 'Zero Trust', controls: 18 },
    { name: 'Data Protection', score: 85, framework: 'GDPR', controls: 24 },
    { name: 'AI Governance', score: 78, framework: 'NIST AI RMF', controls: 32 },
    { name: 'Network Security', score: 95, framework: 'ISO 27001', controls: 15 },
    { name: 'Incident Response', score: 71, framework: 'SOC2', controls: 22 },
    { name: 'Audit & Logging', score: 88, framework: 'MiFID II', controls: 19 },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
      {dimensions.map((d, i) => (
        <div key={i} style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.framework} | {d.controls} controls</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: d.score >= 90 ? '#10b981' : d.score >= 75 ? '#f59e0b' : '#ef4444' }}>{d.score}</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${d.score}%`, background: d.score >= 90 ? '#10b981' : d.score >= 75 ? '#f59e0b' : '#ef4444' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AssetsTab({ policies }) {
  const assets = [
    { type: 'AI Model Deployment', name: 'gpt-4o-trading', policy: 'AI Usage Policy', status: 'compliant', risk: 'Low' },
    { type: 'AI Model Deployment', name: 'gpt-4o-research', policy: 'Research Content Policy', status: 'compliant', risk: 'Medium' },
    { type: 'AI Agent', name: 'TradeExecutionGuard', policy: 'Task Adherence Policy', status: 'at-risk', risk: 'High' },
    { type: 'AI Agent', name: 'MarketDataAnalyst', policy: 'AI Usage Policy', status: 'compliant', risk: 'Low' },
    { type: 'Data Store', name: 'Trade Blotter DB', policy: 'Data Governance Policy', status: 'compliant', risk: 'Low' },
    { type: 'ML Pipeline', name: 'Risk Score Model', policy: 'Model Risk Management', status: 'non_compliant', risk: 'Critical' },
    { type: 'Vector Store', name: 'Research Embeddings', policy: 'IP & Copyright Policy', status: 'compliant', risk: 'Medium' },
    { type: 'API Gateway', name: 'AI API Gateway', policy: 'AI Usage Policy', status: 'compliant', risk: 'Low' },
  ]
  return (
    <div className="table-container">
      <table>
        <thead><tr><th>Asset Type</th><th>Name</th><th>Governing Policy</th><th>Compliance</th><th>Risk Level</th></tr></thead>
        <tbody>
          {assets.map((a, i) => (
            <tr key={i}>
              <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.type}</td>
              <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>{a.name}</td>
              <td style={{ fontSize: '0.75rem' }}>{a.policy}</td>
              <td><span className={`badge ${a.status === 'compliant' ? 'badge-safe' : a.status === 'at-risk' ? 'badge-medium' : 'badge-critical'}`} style={{ fontSize: '0.65rem' }}>{a.status.replace('_', ' ')}</span></td>
              <td><span className={`badge ${a.risk === 'Low' ? 'badge-safe' : a.risk === 'Medium' ? 'badge-low' : a.risk === 'High' ? 'badge-high' : 'badge-critical'}`} style={{ fontSize: '0.65rem' }}>{a.risk}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CompliancePolicies() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Policies')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/foundry/compliance/policies')
      .then(r => r.json())
      .then(d => { setPolicies(d.policies || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalViolations = policies.reduce((s, p) => s + (p.violations || 0), 0)
  const activeCount = policies.filter(p => p.status === 'active').length

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Compliance & Policies</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Govern AI behavior across MiFID II, FINRA, GDPR, SOC2 and internal capital markets frameworks</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Policies', value: policies.length, color: '#3b82f6' },
          { label: 'Active', value: activeCount, color: '#10b981' },
          { label: 'Total Violations', value: totalViolations, color: totalViolations > 10 ? '#ef4444' : '#f59e0b' },
          { label: 'Frameworks', value: new Set(policies.map(p => p.framework)).size, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tabs">
          {TABS.map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          {activeTab === 'Policies' && (
            loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ marginRight: 8 }} /> Loading policies...
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Policy</th><th>Framework</th><th>Scope</th><th>Status</th><th>Violations</th><th>Last Evaluated</th></tr></thead>
                  <tbody>
                    {policies.map((p, i) => (
                      <PolicyRow key={i} policy={p} expanded={expanded === i} onExpand={() => setExpanded(expanded === i ? null : i)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          {activeTab === 'Assets' && <AssetsTab policies={policies} />}
          {activeTab === 'Guardrails' && <GuardrailsTab />}
          {activeTab === 'Security Posture' && <SecurityPostureTab />}
        </div>
      </div>
    </div>
  )
}
