import { useLocation } from 'react-router-dom'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

const ROUTE_TITLES = {
  '/dashboard': { title: 'Platform Dashboard', sub: 'Capital Markets AI Safety Overview' },
  '/content-safety/text': { title: 'Text Analysis', sub: 'Harm Categories: Hate, Sexual, Violence, Self-Harm' },
  '/content-safety/image': { title: 'Image Analysis', sub: 'Visual Content Moderation' },
  '/content-safety/prompt-shields': { title: 'Prompt Shields', sub: 'Jailbreak & Indirect Prompt Injection Detection' },
  '/content-safety/groundedness': { title: 'Groundedness Detection', sub: 'AI Hallucination & Source Verification' },
  '/content-safety/protected-material': { title: 'Protected Material Detection', sub: 'Copyright & Proprietary Content Detection' },
  '/content-safety/custom-categories': { title: 'Custom Categories', sub: 'Market Manipulation, Insider Trading, Front Running, Fraud' },
  '/content-safety/blocklists': { title: 'Blocklist Manager', sub: 'Restricted Securities, Prohibited Terms, Sanctions Lists' },
  '/content-safety/task-adherence': { title: 'Task Adherence', sub: 'AI Agent Tool Call Alignment Detection' },
  '/foundry/overview': { title: 'Control Plane Overview', sub: 'Fleet Health, Compliance & Cost Dashboard' },
  '/foundry/agents': { title: 'Agent Fleet Management', sub: 'Multi-Platform AI Agent Inventory' },
  '/foundry/deployments': { title: 'Model Deployments', sub: 'Guardrail Configuration & Quota Usage' },
  '/foundry/compliance': { title: 'Compliance Policies', sub: 'Guardrail Policies, Azure Policy Integration' },
  '/foundry/security': { title: 'Security Alerts', sub: 'Microsoft Defender & Purview Integration' },
  '/foundry/quota': { title: 'Quota Management', sub: 'Token Usage & Resource Allocation' },
  '/foundry/admin': { title: 'Admin', sub: 'Projects, Users & Connected Resources' },
  '/architecture': { title: 'Architecture', sub: 'Component Map & Service Topology' },
  '/workflow': { title: 'Workflow Diagrams', sub: 'Compliance Pipeline & Content Filter Flows' },
  '/demo': { title: 'Demo Playbook', sub: 'Guided Walkthrough for Compliance Officers & Engineers' },
  '/settings': { title: 'Agent Registry', sub: 'System Prompts, Guardrail Configurations & Regulatory Controls' },
}

export default function Header() {
  const location = useLocation()
  const [apiOk, setApiOk] = useState(null)
  const page = ROUTE_TITLES[location.pathname] || { title: 'Capital Markets AI Safety', sub: '' }

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setApiOk(d.status === 'ok'))
      .catch(() => setApiOk(false))
  }, [])

  return (
    <header style={{
      height: 52,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
      gap: '1rem',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>{page.title}</div>
        {page.sub && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{page.sub}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* API status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.7rem', color: apiOk === false ? 'var(--accent-red)' : apiOk === true ? 'var(--accent-green)' : 'var(--text-muted)',
          padding: '0.25rem 0.6rem',
          background: 'var(--bg-elevated)',
          borderRadius: 20,
          border: '1px solid var(--border)',
        }}>
          {apiOk === false ? <WifiOff size={11} /> : <Wifi size={11} />}
          {apiOk === null ? 'Connecting...' : apiOk ? 'API Connected' : 'API Offline'}
        </div>

        {/* Demo mode badge */}
        <div style={{
          padding: '0.2rem 0.6rem',
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 20,
          fontSize: '0.65rem', fontWeight: 700,
          color: 'var(--accent-amber)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Demo Mode
        </div>

        <button style={{
          width: 32, height: 32,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
        }}>
          <Bell size={14} />
        </button>

        <div style={{
          width: 28, height: 28,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>AD</div>
      </div>
    </header>
  )
}
