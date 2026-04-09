import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/apiFetch'
import { RawJsonView } from '../Common/FeaturePage'
import {
  Copyright, Play, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Shield, ShieldOff, Zap, BarChart2, FileText, Code2, ChevronDown, ChevronRight,
} from 'lucide-react'

const COLOR = '#0ea5e9'

const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS:  { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
}

// Map category label fragment -> display chip
const CONTENT_TYPE_MAP = {
  'song lyrics':       { label: 'Lyrics',        bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  'published book':    { label: 'Published Text', bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
  'licensed code':     { label: 'Code',           bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'github':            { label: 'Code',           bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'python':            { label: 'Code',           bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'baseline':          { label: 'Baseline',       bg: `rgba(16,185,129,0.12)`, color: '#10b981' },
}

function getContentType(s) {
  const key = (s.category || '').toLowerCase()
  for (const [fragment, chip] of Object.entries(CONTENT_TYPE_MAP)) {
    if (key.includes(fragment)) return chip
  }
  return { label: s.category || 'Text', bg: `${COLOR}12`, color: COLOR }
}

function ScenarioCard({ s, selected, onSelect }) {
  const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
  const ct = getContentType(s)
  return (
    <button
      onClick={() => onSelect(s)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.3rem',
        padding: '0.65rem 0.75rem', textAlign: 'left', cursor: 'pointer',
        background: selected ? `${COLOR}12` : 'var(--bg-elevated)',
        border: `1px solid ${selected ? COLOR + '60' : 'var(--border)'}`,
        borderRadius: 6, transition: 'all 0.12s', color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{s.label}</span>
        <span style={{ padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.62rem', fontWeight: 700, background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text, flexShrink: 0 }}>{s.tag}</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.description}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.05rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.35rem', borderRadius: 3, background: ct.bg, color: ct.color, border: `1px solid ${ct.color}35` }}>{ct.label}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>Model</span>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: '0.1rem' }}>{s.guardrail_demonstrated}</span>
      </div>
    </button>
  )
}

function StatusBanner({ status, onProvision, provisioning }) {
  if (!status) return null
  const gr = status.guardrail || {}
  const dep = status.deployment || {}
  const allReady = gr.exists && dep.exists

  return (
    <div style={{
      padding: '0.75rem 1rem',
      background: allReady ? `${COLOR}0d` : 'rgba(245,158,11,0.06)',
      border: `1px solid ${allReady ? COLOR + '35' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 8, marginBottom: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: gr.exists ? `${COLOR}20` : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {gr.exists ? <Shield size={14} style={{ color: COLOR }} /> : <ShieldOff size={14} style={{ color: '#f59e0b' }} />}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: gr.exists ? COLOR : '#f59e0b' }}>{gr.name || 'CF-Demo-ProtectedMaterial'}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{gr.exists ? (gr.controls || []).join(' + ') : 'Not provisioned'}</div>
        </div>
        {gr.exists && <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 3, background: '#10b98120', color: '#10b981', border: '1px solid #10b98135' }}>LIVE</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: dep.exists ? `${COLOR}15` : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Code2 size={14} style={{ color: dep.exists ? COLOR : '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: dep.exists ? COLOR : '#f59e0b' }}>{dep.name || 'cf-demo-protectedmaterial'}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{dep.exists ? `${dep.model || 'gpt-4o'} | Ready for testing` : 'Not provisioned'}</div>
        </div>
        {dep.exists && <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: 3, background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}35` }}>LIVE</span>}
      </div>
      {!allReady && (
        <button onClick={onProvision} disabled={provisioning} style={{ padding: '0.4rem 0.9rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, background: COLOR, color: '#fff', border: 'none', cursor: provisioning ? 'not-allowed' : 'pointer', opacity: provisioning ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {provisioning ? <RefreshCw size={12} className="spin" /> : <Zap size={12} />}
          {provisioning ? 'Provisioning...' : 'Provision Demo Resources'}
        </button>
      )}
    </div>
  )
}

function PMCategoryRow({ cat }) {
  const isText = cat.category === 'Protected Material (Text)'
  const detected = cat.filtered
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      padding: '0.55rem 0.75rem',
      background: detected ? (isText ? 'rgba(139,92,246,0.07)' : 'rgba(245,158,11,0.07)') : 'var(--bg-elevated)',
      border: `1px solid ${detected ? (isText ? 'rgba(139,92,246,0.3)' : 'rgba(245,158,11,0.3)') : 'var(--border)'}`,
      borderRadius: 5,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: detected ? (isText ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)') : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isText ? <FileText size={14} style={{ color: detected ? '#8b5cf6' : '#10b981' }} /> : <Code2 size={14} style={{ color: detected ? '#f59e0b' : '#10b981' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: detected ? (isText ? '#8b5cf6' : '#f59e0b') : '#10b981' }}>
            {cat.category}
          </span>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.05rem 0.3rem', borderRadius: 2, background: detected ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: detected ? '#ef4444' : '#10b981', border: `1px solid ${detected ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
            {detected ? 'DETECTED' : 'CLEAN'}
          </span>
          <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '0.05rem 0.3rem', borderRadius: 2, background: 'rgba(14,165,233,0.1)', color: COLOR, border: `1px solid ${COLOR}30` }}>OUTPUT</span>
        </div>
        {cat.citation && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
            Citation: {cat.citation}
          </div>
        )}
        {!detected && (
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
            {isText ? 'No song lyrics, recipes, news, or web content match found' : 'No GitHub licensed code match found'}
          </div>
        )}
      </div>
      {detected
        ? <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
        : <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
      }
    </div>
  )
}

function SystemPromptPreview({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return null
  const preview = text.slice(0, 130)
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Prompt (RAG Retrieved Content)</div>
        <button onClick={() => setExpanded(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', padding: '0.1rem 0.3rem' }}>
          {expanded ? <><ChevronDown size={11} /> collapse</> : <><ChevronRight size={11} /> expand</>}
        </button>
      </div>
      <div style={{
        padding: '0.5rem 0.65rem', background: 'var(--bg-elevated)',
        border: `1px solid ${COLOR}25`, borderLeft: `3px solid ${COLOR}40`,
        borderRadius: 5, fontSize: '0.72rem', color: 'var(--text-muted)',
        lineHeight: 1.55, maxHeight: expanded ? 360 : 56, overflow: 'hidden',
        transition: 'max-height 0.2s', fontFamily: 'inherit',
      }}>
        {expanded ? text : preview + (text.length > 130 ? '...' : '')}
      </div>
    </div>
  )
}

function ResultPanel({ result }) {
  const blocked = result.blocked
  const cats = (result.filter_categories || []).filter(c =>
    c.category === 'Protected Material (Text)' || c.category === 'Protected Material (Code)'
  )
  const textCat = cats.find(c => c.category === 'Protected Material (Text)')
  const codeCat = cats.find(c => c.category === 'Protected Material (Code)')
  const detectedCat = cats.find(c => c.filtered)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Verdict banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: blocked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${blocked ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
        borderRadius: 7,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: blocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {blocked ? <XCircle size={18} style={{ color: '#ef4444' }} /> : <CheckCircle size={18} style={{ color: '#10b981' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: blocked ? '#ef4444' : '#10b981' }}>
              {blocked ? 'BLOCKED BY CONTENT FILTER' : 'PASSED - Response Allowed'}
            </span>
            {detectedCat && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {detectedCat.category.includes('Code') ? 'LICENSED CODE' : 'COPYRIGHTED TEXT'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {blocked
              ? (result.block_reason || 'Protected material detected in model output — response blocked by guardrail')
              : `Model: ${result.deployment || 'cf-demo-protectedmaterial'} | No protected material detected in output`}
          </div>
        </div>
      </div>

      {/* Protected Material detection rows */}
      {(textCat || codeCat) && (
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Output Detection Results
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {textCat && <PMCategoryRow cat={textCat} />}
            {codeCat && <PMCategoryRow cat={codeCat} />}
          </div>
        </div>
      )}

      {/* Other filter categories (if any) */}
      {(result.filter_categories || []).filter(c =>
        c.category !== 'Protected Material (Text)' && c.category !== 'Protected Material (Code)'
      ).length > 0 && (
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Other Filter Decisions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {result.filter_categories.filter(c =>
              c.category !== 'Protected Material (Text)' && c.category !== 'Protected Material (Code)'
            ).map((cat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem', background: cat.filtered ? 'rgba(239,68,68,0.05)' : 'var(--bg-elevated)', border: `1px solid ${cat.filtered ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, borderRadius: 4 }}>
                <span style={{ flex: 1, fontSize: '0.74rem', fontWeight: 500 }}>{cat.category}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 600, padding: '0.05rem 0.3rem', borderRadius: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cat.point}</span>
                {cat.filtered ? <XCircle size={12} style={{ color: '#ef4444' }} /> : <CheckCircle size={12} style={{ color: '#10b981' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model response when not blocked */}
      {result.model_response && !blocked && (
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Model Response (Passed Filter)</div>
          <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `3px solid ${COLOR}`, borderRadius: 5, fontSize: '0.78rem', lineHeight: 1.6, maxHeight: 140, overflowY: 'auto' }}>
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

export default function ProtectedMaterialFilter() {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [deployments, setDeployments] = useState([])
  const [deployment, setDeployment] = useState('cf-demo-protectedmaterial')
  const [status, setStatus] = useState(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    const sig = ctrl.signal

    apiFetch('/api/content-filters/filter/protected_material/scenarios', { signal: sig })
      .then(r => r.json()).catch(() => [])
      .then(sc => { if (!sig.aborted) setScenarios(Array.isArray(sc) ? sc : []) })

    Promise.all([
      apiFetch('/api/content-filters/deployments', { signal: sig }).then(r => r.json()).catch(() => []),
      apiFetch('/api/content-filters/filter/protected_material/status', { signal: sig }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([deps, st]) => {
      if (sig.aborted) return
      const depList = Array.isArray(deps) ? deps : []
      setDeployments(depList)
      if (st) setStatus(st)
      const demoDep = depList.find(d => d.name === 'cf-demo-protectedmaterial' || d.id === 'cf-demo-protectedmaterial')
      if (demoDep) setDeployment(prev => prev || demoDep.id || demoDep.name)
    })

    return () => ctrl.abort()
  }, [])

  const selectScenario = (s) => {
    setSelected(s)
    setSystemPrompt(s.system_prompt || '')
    setMessage(s.message || '')
    setDeployment(s.deployment || 'cf-demo-protectedmaterial')
    setResult(null)
  }

  const runTest = async () => {
    if (!message.trim()) return
    setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/content-filters/test/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment,
          messages: [{ role: 'user', content: message }],
          system_prompt: systemPrompt,
          filter_type: 'protected_material',
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
      await fetch('/api/content-filters/provision-demo?filter_type=protected_material', { method: 'POST' })
      const [deps, st] = await Promise.all([
        apiFetch('/api/content-filters/deployments').then(r => r.json()).catch(() => []),
        apiFetch('/api/content-filters/filter/protected_material/status').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setDeployments(Array.isArray(deps) ? deps : [])
      if (st) setStatus(st)
    } catch (_) {}
    setProvisioning(false)
  }

  const blockCount = scenarios.filter(s => s.tag === 'BLOCK').length
  const passCount = scenarios.filter(s => s.tag === 'PASS').length

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', borderLeft: `3px solid ${COLOR}` }}>
        <div className="feature-icon" style={{ background: `${COLOR}20`, marginTop: 2 }}>
          <Copyright size={18} style={{ color: COLOR }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Protected Material</h2>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: `${COLOR}18`, color: COLOR, border: `1px solid ${COLOR}35`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copyright Detection</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Filter</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 820, margin: 0 }}>
            Scans LLM <strong>output</strong> for verbatim reproduction of protected content. Two sub-filters run in parallel: <strong>Text</strong> (song lyrics, published books, news articles, selected web content) and <strong>Code</strong> (GitHub repositories indexed through April 6, 2023). When a RAG pipeline loads licensed content into model context, this filter prevents the model from reproducing it verbatim.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Text: song lyrics (&gt;11 words), recipes (&gt;40 chars), news/web (&gt;200 chars)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Code2 size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Code: GitHub repos indexed before April 6, 2023 only</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Financial firms face IP litigation from Bloomberg, Reuters, S&P, and sell-side banks when AI models reproduce their licensed data verbatim.</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{blockCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attack</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{passCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Baseline</div>
          </div>
        </div>
      </div>

      <StatusBanner status={status} onProvision={provisionDemo} provisioning={provisioning} />

      <div className="grid-2">
        {/* LEFT: Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Capital Markets Scenarios</h3>
              <span className="badge badge-cyan">{scenarios.length} Scenarios</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Each scenario embeds protected content in the RAG context (system prompt) and instructs the model to reproduce it. The filter scans the model output and blocks when a text or code match is found against Azure's reference corpus.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {scenarios.map(s => (
                <ScenarioCard key={s.id} s={s} selected={selected?.id === s.id} onSelect={selectScenario} />
              ))}
            </div>
          </div>

          {/* Sub-filter legend */}
          <div className="card">
            <div className="card-header">
              <h3>Detection Categories</h3>
              <Copyright size={14} style={{ color: COLOR }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { icon: FileText, color: '#8b5cf6', label: 'Lyrics', desc: 'Song lyrics >11 words — checked against licensed music corpus' },
                { icon: FileText, color: '#6366f1', label: 'Published Text', desc: 'Books, articles — checked against published text corpus' },
                { icon: FileText, color: '#3b82f6', label: 'News / Web Content', desc: 'News articles or web content >200 characters verbatim' },
                { icon: Code2,    color: '#f59e0b', label: 'Licensed Code', desc: 'GitHub repos indexed through April 6, 2023 — text and code scanners run in parallel' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: `${item.color}15`, border: `1px solid ${item.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={12} style={{ color: item.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
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
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 3, background: `${COLOR}18`, color: COLOR, border: `1px solid ${COLOR}35` }}>
                Output Filter
              </span>
            </div>

            {/* Deployment selector */}
            <div style={{ marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Model Deployment</div>
              <select
                value={deployment}
                onChange={e => setDeployment(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
              >
                {deployments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                {deployments.length === 0 && <option value={deployment}>{deployment}</option>}
              </select>
            </div>

            {/* System prompt (RAG context) */}
            <SystemPromptPreview text={systemPrompt} />

            {/* User message */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>User Message</div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={runTest}
              disabled={loading || !message.trim()}
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 6, background: (loading || !message.trim()) ? 'var(--bg-elevated)' : COLOR, color: (loading || !message.trim()) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (loading || !message.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: !message.trim() ? 0.5 : 1 }}
            >
              {loading ? <><RefreshCw size={14} className="spin" /> Running...</> : <><Play size={14} /> Run Filter Test</>}
            </button>
          </div>

          {result && (
            <div className="card">
              <div className="card-header">
                <h3>Filter Enforcement Result</h3>
                {!result.error && (
                  <span className={`badge ${result.blocked ? 'badge-critical' : 'badge-safe'}`}>
                    {result.blocked ? 'BLOCKED' : 'PASSED'}
                  </span>
                )}
              </div>
              {result.error ? (
                <div style={{ padding: '0.65rem 0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: '0.78rem', color: '#f59e0b' }}>
                  <strong>Error:</strong> {result.error}
                </div>
              ) : (
                <ResultPanel result={result} />
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <BarChart2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Select a scenario and click Run Filter Test to see the protected material detection result. Both Text and Code sub-filters run against the model output.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
