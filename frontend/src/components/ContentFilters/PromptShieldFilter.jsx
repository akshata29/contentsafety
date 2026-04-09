import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/apiFetch'
import { RawJsonView } from '../Common/FeaturePage'
import {
  ShieldAlert, ShieldOff, Play, RefreshCw, CheckCircle, XCircle,
  Shield, Zap, BarChart2, MessageSquare, FileText, Wrench,
  Users, Cpu, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react'

const COLOR = '#7c3aed'

const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS:  { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
}

const SHIELD_META = {
  user_prompt: {
    label: 'User Prompt Attack',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    icon: MessageSquare,
    intervention: 'User Input',
    interventionBg: 'rgba(239,68,68,0.08)',
    interventionColor: '#ef4444',
  },
  document: {
    label: 'Document Attack',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    icon: FileText,
    intervention: 'User Input + Tool Response',
    interventionBg: 'rgba(245,158,11,0.08)',
    interventionColor: '#f59e0b',
  },
}

const ATTACK_SUBTYPES = {
  'Direct Jailbreak': { label: 'DAN / Override', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'Social Engineering': { label: 'Authority Spoof', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'Information Extraction': { label: 'Prompt Extract', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'Persona Hijack': { label: 'Persona Hijack', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'Encoding Attack': { label: 'Encoding', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'Document Injection': { label: 'Doc Inject', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'RAG Injection': { label: 'RAG Inject', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Email Content Injection': { label: 'Email Inject', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Tool Output Injection': { label: 'Tool Response', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Baseline': { label: 'Baseline', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

function ScenarioCard({ s, selected, onSelect }) {
  const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
  const sm = SHIELD_META[s.shield_type] || SHIELD_META.user_prompt
  const st = ATTACK_SUBTYPES[s.category] || { label: s.category, color: COLOR, bg: `${COLOR}12` }
  const isAgent = s.preferred_target === 'agent'
  return (
    <button
      onClick={() => onSelect(s)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.28rem',
        padding: '0.6rem 0.7rem', textAlign: 'left', cursor: 'pointer',
        background: selected ? `${COLOR}0f` : 'var(--bg-elevated)',
        border: `1px solid ${selected ? COLOR + '55' : 'var(--border)'}`,
        borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
        borderLeft: `3px solid ${selected ? sm.color : 'transparent'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.79rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{s.label}</span>
        <span style={{ padding: '0.12rem 0.4rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 700, background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text, flexShrink: 0 }}>{s.tag}</span>
      </div>
      <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.59rem', fontWeight: 700, padding: '0.08rem 0.3rem', borderRadius: 3, background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
        <span style={{ fontSize: '0.59rem', fontWeight: 600, padding: '0.08rem 0.3rem', borderRadius: 3, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>{sm.intervention}</span>
        <span style={{ fontSize: '0.59rem', fontWeight: 600, padding: '0.08rem 0.3rem', borderRadius: 3, background: isAgent ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)', color: isAgent ? '#8b5cf6' : '#3b82f6', border: isAgent ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(59,130,246,0.25)' }}>
          {isAgent ? 'Agent' : 'Model'}
        </span>
      </div>
    </button>
  )
}

function StatusBanner({ status, onProvision, provisioning }) {
  if (!status) return null
  const gr = status.guardrail || {}
  const ag = status.agent || {}
  const ready = gr.exists

  return (
    <div style={{
      padding: '0.7rem 0.9rem',
      background: ready ? `${COLOR}0a` : 'rgba(245,158,11,0.06)',
      border: `1px solid ${ready ? COLOR + '30' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 8, marginBottom: '1.1rem',
      display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap',
    }}>
      {/* Guardrail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: gr.exists ? `${COLOR}18` : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {gr.exists ? <Shield size={14} style={{ color: COLOR }} /> : <ShieldOff size={14} style={{ color: '#f59e0b' }} />}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 600, color: gr.exists ? COLOR : '#f59e0b' }}>{gr.name || 'CF-Demo-Prompt-Shield'}</span>
            {gr.exists && <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.06rem 0.28rem', borderRadius: 3, background: '#10b98120', color: '#10b981', border: '1px solid #10b98135' }}>LIVE</span>}
          </div>
          <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '0.08rem' }}>
            {gr.exists ? 'Jailbreak + XPIA + Content Safety' : 'Not provisioned'}
          </div>
        </div>
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 220 }}>
        {[
          { label: 'Jailbreak', point: 'User Input', c: '#ef4444' },
          { label: 'Indirect Attack', point: 'User Input + Tool Resp', c: '#f59e0b' },
          { label: 'Content Safety', point: 'Input + Output', c: '#3b82f6' },
        ].map((ctrl, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.06rem', padding: '0.3rem 0.45rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `2px solid ${ctrl.c}`, borderRadius: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: ctrl.c }}>{ctrl.label}</span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{ctrl.point}</span>
          </div>
        ))}
      </div>
      {/* Agent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: 5, background: ag.exists ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={12} style={{ color: ag.exists ? '#8b5cf6' : '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: ag.exists ? '#8b5cf6' : '#f59e0b' }}>{ag.name || 'cf-demo-markets-assistant'}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{ag.exists ? 'Agent ready' : 'Not provisioned'}</div>
        </div>
      </div>
      {!ready && (
        <button onClick={onProvision} disabled={provisioning} style={{ padding: '0.38rem 0.8rem', borderRadius: 5, fontSize: '0.74rem', fontWeight: 600, background: COLOR, color: '#fff', border: 'none', cursor: provisioning ? 'not-allowed' : 'pointer', opacity: provisioning ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {provisioning ? <><RefreshCw size={11} className="spin" /> Provisioning...</> : <><Zap size={11} /> Provision</>}
        </button>
      )}
    </div>
  )
}

function MessagePreview({ text, label }) {
  const [exp, setExp] = useState(false)
  if (!text) return null
  const preview = text.slice(0, 120)
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.22rem' }}>
        <div style={{ fontSize: '0.63rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <button onClick={() => setExp(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.65rem', padding: '0.06rem 0.25rem' }}>
          {exp ? <><ChevronDown size={10} /> collapse</> : <><ChevronRight size={10} /> expand</>}
        </button>
      </div>
      <div style={{
        padding: '0.45rem 0.6rem', background: 'var(--bg-elevated)',
        border: `1px solid ${COLOR}1a`, borderLeft: `3px solid ${COLOR}35`,
        borderRadius: 5, fontSize: '0.71rem', color: 'var(--text-muted)',
        lineHeight: 1.5, maxHeight: exp ? 320 : 50, overflow: 'hidden',
        transition: 'max-height 0.2s', fontFamily: 'inherit', whiteSpace: 'pre-wrap',
      }}>
        {exp ? text : preview + (text.length > 120 ? '...' : '')}
      </div>
    </div>
  )
}

function ShieldDetectionRow({ cat, shieldColor }) {
  const detected = cat.filtered || cat.detected
  const isJailbreak = (cat.category || '').toLowerCase().includes('jailbreak')
  const color = isJailbreak ? '#ef4444' : '#f59e0b'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.55rem',
      padding: '0.5rem 0.7rem',
      background: detected ? `${color}09` : 'var(--bg-elevated)',
      border: `1px solid ${detected ? color + '35' : 'var(--border)'}`,
      borderRadius: 5,
    }}>
      <div style={{ width: 26, height: 26, borderRadius: 5, flexShrink: 0, background: detected ? `${color}15` : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isJailbreak
          ? <ShieldAlert size={13} style={{ color: detected ? color : '#10b981' }} />
          : <FileText size={13} style={{ color: detected ? color : '#10b981' }} />
        }
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.06rem' }}>
          <span style={{ fontSize: '0.77rem', fontWeight: 700, color: detected ? color : '#10b981' }}>{cat.category}</span>
          <span style={{ fontSize: '0.57rem', fontWeight: 700, padding: '0.04rem 0.28rem', borderRadius: 2, background: detected ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: detected ? '#ef4444' : '#10b981', border: `1px solid ${detected ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
            {detected ? 'DETECTED' : 'CLEAN'}
          </span>
          {cat.point && (
            <span style={{ fontSize: '0.57rem', fontWeight: 600, padding: '0.04rem 0.28rem', borderRadius: 2, background: `${COLOR}12`, color: COLOR, border: `1px solid ${COLOR}28` }}>
              {String(cat.point).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {detected
            ? (isJailbreak ? 'User prompt injection attempt blocked at User Input' : 'Document/indirect attack blocked at Tool Response or User Input')
            : (isJailbreak ? 'No jailbreak pattern detected in user message' : 'No indirect injection found in document or tool output')
          }
        </div>
      </div>
      {detected
        ? <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
        : <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />
      }
    </div>
  )
}

function ResultPanel({ result, scenario }) {
  const blocked = result.blocked
  const sm = SHIELD_META[(scenario?.shield_type)] || SHIELD_META.user_prompt
  const cats = result.filter_categories || []

  // Surface jailbreak + indirect_prompt_injection detections prominently
  const shieldCats = cats.filter(c => {
    const n = (c.category || '').toLowerCase()
    return n.includes('jailbreak') || n.includes('indirect') || n.includes('prompt injection') || n.includes('prompt_injection')
  })
  const otherCats = cats.filter(c => {
    const n = (c.category || '').toLowerCase()
    return !n.includes('jailbreak') && !n.includes('indirect') && !n.includes('prompt injection') && !n.includes('prompt_injection')
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      {/* Verdict */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
        padding: '0.7rem 0.9rem',
        background: blocked ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
        border: `1px solid ${blocked ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
        borderRadius: 7,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 7, flexShrink: 0, background: blocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {blocked ? <XCircle size={17} style={{ color: '#ef4444' }} /> : <CheckCircle size={17} style={{ color: '#10b981' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.18rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: blocked ? '#ef4444' : '#10b981' }}>
              {blocked ? 'BLOCKED BY PROMPT SHIELD' : 'PASSED - No Attack Detected'}
            </span>
            {blocked && scenario && (
              <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.06rem 0.35rem', borderRadius: 3, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                {scenario.shield_type === 'document' ? 'DOCUMENT SHIELD' : 'USER PROMPT SHIELD'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {blocked
              ? (result.block_reason || `${sm.label} detected — request blocked by CF-Demo-Prompt-Shield guardrail`)
              : `Deployment: ${result.deployment || 'cf-demo-jailbreak'} | Input scanned at ${sm.intervention} — no attack patterns found`}
          </div>
        </div>
      </div>

      {/* Prompt Shield detection rows */}
      {shieldCats.length > 0 && (
        <div>
          <div style={{ fontSize: '0.63rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Prompt Shield Detection Results
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {shieldCats.map((cat, i) => <ShieldDetectionRow key={i} cat={cat} shieldColor={COLOR} />)}
          </div>
        </div>
      )}

      {/* Other filter categories */}
      {otherCats.length > 0 && (
        <div>
          <div style={{ fontSize: '0.63rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Other Filter Decisions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {otherCats.map((cat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem 0.55rem', background: cat.filtered ? 'rgba(239,68,68,0.05)' : 'var(--bg-elevated)', border: `1px solid ${cat.filtered ? 'rgba(239,68,68,0.22)' : 'var(--border)'}`, borderRadius: 4 }}>
                <span style={{ flex: 1, fontSize: '0.73rem', fontWeight: 500 }}>{cat.category}</span>
                {cat.point && <span style={{ fontSize: '0.57rem', fontWeight: 600, padding: '0.03rem 0.28rem', borderRadius: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cat.point}</span>}
                {cat.filtered ? <XCircle size={11} style={{ color: '#ef4444' }} /> : <CheckCircle size={11} style={{ color: '#10b981' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model response when not blocked */}
      {result.model_response && !blocked && (
        <div>
          <div style={{ fontSize: '0.63rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Model Response (Passed Filter)</div>
          <div style={{ padding: '0.55rem 0.7rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `3px solid ${COLOR}`, borderRadius: 5, fontSize: '0.77rem', lineHeight: 1.6, maxHeight: 130, overflowY: 'auto' }}>
            {result.model_response.length > 400 ? result.model_response.slice(0, 400) + '...' : result.model_response}
          </div>
        </div>
      )}

      {'_raw_response' in result && (
        <RawJsonView data={result._raw_response} />
      )}
    </div>
  )
}

export default function PromptShieldFilter() {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState(null)
  const [deployments, setDeployments] = useState([])
  const [deployment, setDeployment] = useState('cf-demo-jailbreak')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    const sig = ctrl.signal

    apiFetch('/api/content-filters/filter/prompt_shield/scenarios', { signal: sig })
      .then(r => r.json()).catch(() => [])
      .then(sc => { if (!sig.aborted) setScenarios(Array.isArray(sc) ? sc : []) })

    Promise.all([
      apiFetch('/api/content-filters/deployments', { signal: sig }).then(r => r.json()).catch(() => []),
      apiFetch('/api/content-filters/filter/prompt_shield/status', { signal: sig }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([deps, st]) => {
      if (sig.aborted) return
      setDeployments(Array.isArray(deps) ? deps : [])
      if (st) setStatus(st)
    })

    return () => ctrl.abort()
  }, [])

  const selectScenario = (s) => {
    setSelected(s)
    setSystemPrompt(s.system_prompt || '')
    setMessage(s.message || '')
    setDeployment(s.deployment || 'cf-demo-jailbreak')
    setResult(null)
  }

  const runTest = async () => {
    if (!message.trim() || !selected) return
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/content-filters/test/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment,
          messages: [{ role: 'user', content: message }],
          system_prompt: systemPrompt,
          filter_type: selected.shield_type === 'document' ? 'xpia' : 'jailbreak',
        }),
      })
      const data = await r.json()
      setResult(r.ok ? data : { error: data.detail || `HTTP ${r.status}` })
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const provisionDemo = async () => {
    setProvisioning(true)
    try {
      await fetch('/api/content-filters/provision-demo?filter_type=prompt_shield', { method: 'POST' })
      const [deps, st] = await Promise.all([
        apiFetch('/api/content-filters/deployments').then(r => r.json()).catch(() => []),
        apiFetch('/api/content-filters/filter/prompt_shield/status').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setDeployments(Array.isArray(deps) ? deps : [])
      if (st) setStatus(st)
    } catch (_) {}
    setProvisioning(false)
  }

  const userPromptScenarios = scenarios.filter(s => s.shield_type === 'user_prompt')
  const documentScenarios = scenarios.filter(s => s.shield_type === 'document')
  const blockCount = scenarios.filter(s => s.tag === 'BLOCK').length
  const passCount = scenarios.filter(s => s.tag === 'PASS').length

  const selectedSm = SHIELD_META[selected?.shield_type] || null

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', borderLeft: `3px solid ${COLOR}` }}>
        <div className="feature-icon" style={{ background: `${COLOR}20`, marginTop: 2 }}>
          <Shield size={18} style={{ color: COLOR }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.18rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Prompt Shield</h2>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 3, background: `${COLOR}18`, color: COLOR, border: `1px solid ${COLOR}35`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CF-Demo-Prompt-Shield</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input Filter</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 3, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model + Agent</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 850, margin: 0 }}>
            Unified shield combining <strong>Jailbreak Protection</strong> (user prompt attacks) and <strong>Indirect Injection (XPIA)</strong> (document attacks) in a single guardrail. Scans adversarial inputs at the <strong>User Input</strong> intervention point and document-based attacks at both <strong>User Input</strong> and <strong>Tool Response</strong> intervention points. Applies to both model deployments and agents.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MessageSquare size={11} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.71rem', color: '#ef4444', fontWeight: 500 }}>User Prompt: DAN, authority spoof, persona hijack, encoding attacks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={11} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.71rem', color: '#f59e0b', fontWeight: 500 }}>Documents: RAG injection, email content, tool API response poisoning</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.7rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{blockCount}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attack</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{passCount}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Baseline</div>
          </div>
        </div>
      </div>

      <StatusBanner status={status} onProvision={provisionDemo} provisioning={provisioning} />

      <div className="grid-2">
        {/* LEFT: Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* User Prompt Attacks */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={12} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ color: '#ef4444' }}>User Prompt Attacks</h3>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.08rem 0.35rem', borderRadius: 3, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>User Input</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: 1.45 }}>
              Attempts to override system instructions, change model behaviour, bypass compliance training, or extract confidential configuration via the user message.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {userPromptScenarios.map(s => (
                <ScenarioCard key={s.id} s={s} selected={selected?.id === s.id} onSelect={selectScenario} />
              ))}
            </div>
          </div>

          {/* Document Attacks */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={12} style={{ color: '#f59e0b' }} />
                </div>
                <h3 style={{ color: '#f59e0b' }}>Document / Indirect Attacks</h3>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.08rem 0.35rem', borderRadius: 3, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>User Input + Tool Response</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: 1.45 }}>
              Hidden instructions embedded in third-party documents, RAG results, emails, and tool API responses that attempt to hijack the model session when processed.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {documentScenarios.map(s => (
                <ScenarioCard key={s.id} s={s} selected={selected?.id === s.id} onSelect={selectScenario} />
              ))}
            </div>
          </div>

          {/* Attack subtype legend */}
          <div className="card">
            <div className="card-header">
              <h3>Attack Subtypes</h3>
              <ShieldAlert size={14} style={{ color: COLOR }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { icon: MessageSquare, color: '#ef4444', label: 'DAN / Override', desc: 'Direct instruction override' },
                { icon: Users, color: '#ef4444', label: 'Authority Spoof', desc: 'CEO / CTO impersonation' },
                { icon: Cpu, color: '#ef4444', label: 'Persona Hijack', desc: 'Roleplay identity swap' },
                { icon: AlertTriangle, color: '#ef4444', label: 'Encoding Attack', desc: 'ROT13, Base64 obfuscation' },
                { icon: FileText, color: '#f59e0b', label: 'Doc Injection', desc: 'Hidden instruction in doc' },
                { icon: Wrench, color: '#f59e0b', label: 'Tool Response', desc: 'Poisoned API payload' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: `${item.color}12`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={11} style={{ color: item.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Test + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Test Configuration</h3>
              {selectedSm && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.08rem 0.38rem', borderRadius: 3, background: selectedSm.bg, color: selectedSm.color, border: `1px solid ${selectedSm.border}` }}>
                  {selectedSm.label}
                </span>
              )}
            </div>

            {!selected && (
              <div style={{ padding: '0.8rem', background: `${COLOR}09`, border: `1px solid ${COLOR}20`, borderRadius: 6, fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                Select a scenario from the left to pre-fill the test — or type your own below.
              </div>
            )}

            {/* Deployment */}
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Model Deployment</div>
              <select
                value={deployment}
                onChange={e => setDeployment(e.target.value)}
                style={{ width: '100%', padding: '0.38rem 0.55rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.77rem' }}
              >
                {deployments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                {deployments.length === 0 && <option value={deployment}>{deployment}</option>}
              </select>
            </div>

            {/* System prompt */}
            <MessagePreview text={systemPrompt} label="System Prompt" />

            {/* User message */}
            <div style={{ marginBottom: '0.7rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>User Message</div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.48rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.77rem', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {selected?.preferred_target === 'agent' && (
              <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, fontSize: '0.72rem', color: '#8b5cf6', marginBottom: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Users size={12} />
                This scenario is best demonstrated via an agent. The model test below will still trigger Prompt Shield, but full agent guardrail enforcement is visible in the Agent Filter Test page.
              </div>
            )}

            <button
              onClick={runTest}
              disabled={loading || !message.trim()}
              style={{ width: '100%', padding: '0.58rem 1rem', borderRadius: 6, background: (loading || !message.trim()) ? 'var(--bg-elevated)' : COLOR, color: (loading || !message.trim()) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (loading || !message.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.81rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: !message.trim() ? 0.5 : 1 }}
            >
              {loading ? <><RefreshCw size={13} className="spin" /> Running Shield Test...</> : <><Play size={13} /> Run Prompt Shield Test</>}
            </button>
          </div>

          {result && (
            <div className="card">
              <div className="card-header">
                <h3>Shield Enforcement Result</h3>
                {!result.error && (
                  <span className={`badge ${result.blocked ? 'badge-critical' : 'badge-safe'}`}>
                    {result.blocked ? 'BLOCKED' : 'PASSED'}
                  </span>
                )}
              </div>
              {result.error ? (
                <div style={{ padding: '0.6rem 0.7rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: '0.77rem', color: '#f59e0b' }}>
                  <strong>Error:</strong> {result.error}
                </div>
              ) : (
                <ResultPanel result={result} scenario={selected} />
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <BarChart2 size={30} style={{ color: 'var(--text-muted)', margin: '0 auto 0.65rem' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select a scenario and run the test to see Prompt Shield enforcement in action. User Prompt attacks trigger the Jailbreak shield; Document attacks trigger the Indirect Injection shield.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
