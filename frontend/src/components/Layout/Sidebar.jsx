import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, Image, Zap, CheckCircle,
  BookOpen, Tag, ListFilter, Activity, Fingerprint,
  Globe, Users, Server, ClipboardList,
  AlertTriangle, Gauge, Settings, ChevronDown, ChevronRight,
  GitMerge, Shield, Layers, BarChart2, Cpu,
  ShieldAlert, FileWarning, AlertOctagon, GitBranch, EyeOff, Copyright,
  Map, Play, Bot, Workflow,
} from 'lucide-react'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    id: 'pipeline',
    label: 'Compliance Pipeline',
    accent: '#6366f1',
    items: [
      { to: '/pipeline', icon: GitMerge, label: 'AI Compliance Pipeline', sub: 'All services · unified verdict' },
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', sub: 'Platform overview' },
    ],
  },
  {
    id: 'cs',
    label: 'Content Safety',
    accent: '#3b82f6',
    items: [
      { to: '/content-safety/text',              icon: ShieldCheck,  label: 'Text Analysis',        sub: 'Harm categories' },
      { to: '/content-safety/image',             icon: Image,        label: 'Image Analysis',        sub: 'Visual content' },
      { to: '/content-safety/prompt-shields',    icon: Zap,          label: 'Prompt Shields',        sub: 'Jailbreak + XPIA' },
      { to: '/content-safety/groundedness',      icon: CheckCircle,  label: 'Groundedness',          sub: 'Hallucination detect' },
      { to: '/content-safety/protected-material',icon: BookOpen,     label: 'Protected Material',    sub: 'Copyright detect' },
      { to: '/content-safety/custom-categories', icon: Tag,          label: 'Custom Categories',     sub: 'Market manipulation' },
      { to: '/content-safety/blocklists',        icon: ListFilter,   label: 'Blocklists',            sub: 'Restricted terms' },
      { to: '/content-safety/task-adherence',    icon: Activity,     label: 'Task Adherence',        sub: 'Agent alignment' },
      { to: '/content-safety/pii-detection',      icon: Fingerprint,  label: 'PII Detection',         sub: 'Privacy & redaction' },
    ],
  },
  {
    id: 'cf',
    label: 'Content Filters',
    accent: '#f59e0b',
    items: [
      { to: '/content-filters/guardrails',        icon: Shield,        label: 'Guardrail Manager',     sub: 'Create & manage guardrails' },
      { to: '/content-filters/jailbreak',         icon: ShieldAlert,   label: 'Jailbreak Protection',  sub: 'Override & bypass attacks' },
      { to: '/content-filters/xpia',              icon: FileWarning,   label: 'Indirect Injection',    sub: 'XPIA via docs & tools' },
      { to: '/content-filters/content-safety',    icon: AlertOctagon,  label: 'Content Safety',        sub: 'Hate, violence, self-harm' },
      { to: '/content-filters/task-adherence',    icon: GitBranch,     label: 'Task Adherence',        sub: 'Agent role enforcement' },
      { to: '/content-filters/pii-leakage',       icon: EyeOff,        label: 'PII & Data Leakage',    sub: 'Output redaction' },
      { to: '/content-filters/protected-material',icon: Copyright,     label: 'Protected Material',    sub: 'Copyright detection' },
      { to: '/content-filters/model-test',        icon: Cpu,           label: 'Model Filter Test',     sub: 'Live model enforcement' },
      { to: '/content-filters/agent-test',        icon: Users,         label: 'Agent Filter Test',     sub: 'Live agent enforcement' },
      { to: '/content-filters/compare',           icon: Layers,        label: 'Filter Comparison',     sub: 'Permissive vs Strict' },
      { to: '/content-filters/analytics',         icon: BarChart2,     label: 'Filter Analytics',      sub: 'Coverage & block events' },
    ],
  },
  {
    id: 'design',
    label: 'Design & Docs',
    accent: '#06b6d4',
    items: [
      { to: '/demo',         icon: Play,     label: 'Demo Playbook',    sub: 'Guided walkthrough' },
      { to: '/workflow',     icon: Workflow,  label: 'Workflow Diagrams', sub: 'Pipeline & filter flows' },
      { to: '/architecture', icon: Map,       label: 'Architecture',      sub: 'Component map' },
      { to: '/settings',     icon: Bot,       label: 'Agent Registry',    sub: 'System prompts & guardrails' },
    ],
  },
  {
    id: 'foundry',
    label: 'Foundry Control Plane',
    accent: '#8b5cf6',
    items: [
      { to: '/foundry/overview',     icon: Globe,          label: 'Overview',         sub: 'Fleet health' },
      { to: '/foundry/agents',       icon: Users,          label: 'Agent Fleet',      sub: 'Multi-platform' },
      { to: '/foundry/deployments',  icon: Server,         label: 'Model Deployments',sub: 'Guardrails & quota' },
      { to: '/foundry/compliance',   icon: ClipboardList,  label: 'Compliance',       sub: 'Policies & guardrails' },
      { to: '/foundry/security',     icon: AlertTriangle,  label: 'Security Alerts',  sub: 'Defender & Purview' },
      { to: '/foundry/quota',        icon: Gauge,          label: 'Quota',            sub: 'Token usage' },
      { to: '/foundry/admin',        icon: Settings,       label: 'Admin',            sub: 'Projects & users' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState({ pipeline: false, cs: false, cf: false, design: false, foundry: false })

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 800, color: '#fff',
          flexShrink: 0,
        }}>CM</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>Capital Markets</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>AI Safety Platform</div>
        </div>
      </div>

      {/* Scrollable sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem 1rem' }}>
        {NAV_SECTIONS.map(section => {
          const isCollapsed = collapsed[section.id]
          return (
            <div key={section.id} style={{ marginBottom: '0.5rem' }}>
              <button
                onClick={() => setCollapsed(p => ({ ...p, [section.id]: !p[section.id] }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '0.4rem 0.6rem',
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: '0.65rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: section.accent, display: 'inline-block', flexShrink: 0
                  }} />
                  {section.label}
                </span>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {section.items.map(item => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.to
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.45rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          textDecoration: 'none',
                          background: isActive ? `${section.accent}20` : 'transparent',
                          borderLeft: isActive ? `2px solid ${section.accent}` : '2px solid transparent',
                          transition: 'all 0.12s',
                        }}
                      >
                        <Icon size={14} style={{ color: isActive ? section.accent : 'var(--text-muted)', flexShrink: 0 }} />
                        <div>
                          <div style={{
                            fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            lineHeight: 1.2,
                          }}>{item.label}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{item.sub}</div>
                        </div>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.65rem',
        color: 'var(--text-dim)',
        flexShrink: 0,
      }}>
        Azure AI Content Safety + Foundry Control Plane
      </div>
    </nav>
  )
}
