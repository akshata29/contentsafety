import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/apiFetch'
import { RawJsonView } from '../Common/FeaturePage'
import {
  CheckCircle, XCircle, Play, RefreshCw, AlertTriangle,
  Database, BarChart2, FileText,
} from 'lucide-react'

const COLOR = '#10b981'

const TAG_COLORS = {
  BLOCK: { bg: '#ef444420', border: '#ef444460', text: '#ef4444' },
  PASS:  { bg: '#10b98120', border: '#10b98160', text: '#10b981' },
}

const TASK_COLORS = {
  QnA:           { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.35)',  text: '#6366f1' },
  Summarization: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  text: '#f59e0b' },
}

function ScenarioCard({ s, selected, onSelect }) {
  const tag = TAG_COLORS[s.tag] || TAG_COLORS.PASS
  const task = TASK_COLORS[s.task] || TASK_COLORS.QnA
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.category}</span>
        <span style={{ padding: '0.1rem 0.35rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 600, background: task.bg, border: `1px solid ${task.border}`, color: task.text }}>{s.task}</span>
        <span style={{ padding: '0.1rem 0.35rem', borderRadius: 3, fontSize: '0.6rem', fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)' }}>{s.domain}</span>
      </div>
    </button>
  )
}

function ResultPanel({ result }) {
  const ungrounded = result.ungrounded
  const segs = result.contradicting_segments || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Verdict banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: ungrounded ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${ungrounded ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
        borderRadius: 7,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: ungrounded ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ungrounded ? <XCircle size={18} style={{ color: '#ef4444' }} /> : <CheckCircle size={18} style={{ color: '#10b981' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: ungrounded ? '#ef4444' : '#10b981' }}>
              {ungrounded ? 'UNGROUNDED - Hallucination Detected' : 'GROUNDED - Response Verified'}
            </span>
            {result.confidence > 0 && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 3, background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}40` }}>
                {(result.confidence * 100).toFixed(0)}% ungrounded
              </span>
            )}
            {segs.length > 0 && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {segs.length} contradicting segment{segs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {ungrounded
              ? 'The AI-generated response contains claims that are not supported by or directly contradict the provided grounding source.'
              : 'All material claims in the AI-generated response are consistent with the provided grounding source.'}
          </div>
        </div>
      </div>

      {/* Contradicting segments */}
      {segs.length > 0 && (
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ef4444', marginBottom: '0.4rem' }}>
            Contradicting Segments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {segs.map((seg, i) => (
              <div key={i} style={{ padding: '0.5rem 0.7rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '3px solid #ef4444', borderRadius: 5 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: seg.reason ? '0.25rem' : 0 }}>
                  "{seg.text || seg.excerpt || JSON.stringify(seg)}"
                </div>
                {seg.reason && (
                  <div style={{ fontSize: '0.7rem', color: '#ef4444', lineHeight: 1.4 }}>{seg.reason}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {result.reasoning && (
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Detection Reasoning
          </div>
          <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: `3px solid ${COLOR}`, borderRadius: 5, fontSize: '0.78rem', lineHeight: 1.6 }}>
            {result.reasoning}
          </div>
        </div>
      )}

      {'_raw_response' in result && (
        <RawJsonView data={result._raw_response} />
      )}
    </div>
  )
}

export default function GroundednessFilter() {
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [domain, setDomain] = useState('Generic')
  const [task, setTask] = useState('QnA')
  const [query, setQuery] = useState('')
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [reasoning, setReasoning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    apiFetch('/api/content-filters/filter/groundedness/scenarios')
      .then(r => r.json()).catch(() => [])
      .then(sc => { if (Array.isArray(sc)) setScenarios(sc) })
  }, [])

  const selectScenario = (s) => {
    setSelected(s)
    setDomain(s.domain || 'Generic')
    setTask(s.task || 'QnA')
    setQuery(s.query || '')
    setText(s.text || '')
    setSource(s.grounding_source || '')
    setResult(null)
  }

  const runTest = async () => {
    if (!text.trim() || !source.trim()) return
    setLoading(true); setResult(null)
    try {
      const body = {
        domain,
        task,
        text,
        grounding_sources: source,
        reasoning,
      }
      if (task === 'QnA' && query.trim()) {
        body.query = query
      }
      const r = await fetch('/api/content-safety/groundedness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      setResult(r.ok ? data : { error: data.detail || `HTTP ${r.status}` })
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const blockCount = scenarios.filter(s => s.tag === 'BLOCK').length
  const passCount = scenarios.filter(s => s.tag === 'PASS').length

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', borderLeft: `3px solid ${COLOR}` }}>
        <div className="feature-icon" style={{ background: `${COLOR}20`, marginTop: 2 }}>
          <CheckCircle size={18} style={{ color: COLOR }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
            <h2 style={{ margin: 0 }}>Groundedness Detection</h2>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: `${COLOR}18`, color: COLOR, border: `1px solid ${COLOR}35`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Filter</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 3, background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 800, margin: 0 }}>
            Detects when a Large Language Model's response is not grounded in the provided source documents. Applied to model <strong>output</strong> only — not user input. For each RAG scenario, the filter compares the generated response text against your grounding sources and flags any claims that are fabricated or contradict the source data.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modes: Non-Reasoning (fast) / Reasoning (with explanation)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tasks: QnA, Summarization</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>In capital markets, hallucinated financial data — wrong rates, fabricated credit grades, or incorrect settlement instructions — creates immediate trading and compliance risk.</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{blockCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Ungrounded</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{passCount}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Grounded</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* LEFT: Scenario list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Capital Markets RAG Scenarios</h3>
              <span className="badge badge-cyan">{scenarios.length} Scenarios</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Each scenario represents what an LLM might output in a RAG pipeline for a capital markets query. BLOCK scenarios contain model-generated claims that contradict the provided source document.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {scenarios.map(s => (
                <ScenarioCard key={s.id} s={s} selected={selected?.id === s.id} onSelect={selectScenario} />
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <div className="card-header">
              <h3>How It Works</h3>
              <CheckCircle size={14} style={{ color: COLOR }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { step: '1', label: 'RAG retrieval', text: 'System retrieves source documents (earnings reports, FOMC statements, credit records) and adds them to the model context as grounding sources.' },
                { step: '2', label: 'Model generates output', text: 'The LLM generates a response to the user query using the retrieved sources. This is the text the filter evaluates.' },
                { step: '3', label: 'Groundedness check', text: 'Azure Content Safety compares the model output against the grounding sources to detect claims not supported by or contradicting the source documents.' },
                { step: '4', label: 'Block or pass', text: 'Ungrounded responses are blocked before reaching the user. Grounded responses pass through. Optional: correction mode automatically fixes hallucinated values.' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${COLOR}20`, border: `1px solid ${COLOR}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: COLOR }}>{item.step}</div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Test panel + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Test Configuration</h3>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 3, background: `${COLOR}18`, color: COLOR, border: `1px solid ${COLOR}35` }}>
                Output Filter
              </span>
            </div>

            {/* Domain + Task + Reasoning row */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Domain</div>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                >
                  <option value="Generic">Generic</option>
                  <option value="Medical">Medical</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 110 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Task</div>
                <select
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                >
                  <option value="QnA">QnA</option>
                  <option value="Summarization">Summarization</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.05rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Mode</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: reasoning ? `${COLOR}12` : 'var(--bg-elevated)', fontSize: '0.76rem', color: reasoning ? COLOR : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={reasoning} onChange={e => setReasoning(e.target.checked)} style={{ width: 13, height: 13, accentColor: COLOR }} />
                  Reasoning
                </label>
              </div>
            </div>

            {/* Query (QnA only) */}
            {task === 'QnA' && (
              <div style={{ marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Query</div>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="What question was the AI answering?"
                  style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.78rem', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* AI-generated text */}
            <div style={{ marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI-Generated Response (Output to check)</div>
                <span style={{ fontSize: '0.6rem', padding: '0.08rem 0.3rem', borderRadius: 3, background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', fontWeight: 600 }}>OUTPUT</span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                placeholder="Paste the AI-generated response to check for groundedness..."
                style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.76rem', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Grounding source */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grounding Source Document</div>
                <span style={{ fontSize: '0.6rem', padding: '0.08rem 0.3rem', borderRadius: 3, background: `${COLOR}15`, color: COLOR, border: `1px solid ${COLOR}30`, fontWeight: 600 }}>SOURCE</span>
              </div>
              <textarea
                value={source}
                onChange={e => setSource(e.target.value)}
                rows={5}
                placeholder="Paste the source document the AI response should be grounded in (RAG retrieved content, earnings report, policy document, etc.)"
                style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 5, border: `1px solid ${COLOR}30`, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.76rem', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={runTest}
              disabled={loading || !text.trim() || !source.trim()}
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 6, background: (loading || !text.trim() || !source.trim()) ? 'var(--bg-elevated)' : COLOR, color: (loading || !text.trim() || !source.trim()) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (loading || !text.trim() || !source.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (!text.trim() || !source.trim()) ? 0.5 : 1 }}
            >
              {loading ? <><RefreshCw size={14} className="spin" /> Checking...</> : <><Play size={14} /> Check Groundedness</>}
            </button>
          </div>

          {result && (
            <div className="card">
              <div className="card-header">
                <h3>Groundedness Result</h3>
                {!result.error && (
                  <span className={`badge ${result.ungrounded ? 'badge-critical' : 'badge-safe'}`}>
                    {result.ungrounded ? 'UNGROUNDED' : 'GROUNDED'}
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
                Select a scenario and click Check Groundedness to see whether the AI-generated response is supported by the provided source document.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
