import { useState, useEffect } from 'react'
import { CheckCircle, Play, AlertTriangle } from 'lucide-react'
import { FeaturePage, ScenarioSelector, ResultPanel, RawJsonView } from '../Common/FeaturePage'

export default function Groundedness() {
  const [query, setQuery] = useState('What was the Q3 revenue for Apex Capital?')
  const [text, setText] = useState("According to the Q3 2024 earnings report, Apex Capital generated $2.4 billion in revenue, representing a 12% year-over-year increase, driven primarily by strong performance in the wealth management division.")
  const [source, setSource] = useState("APEX CAPITAL Q3 2024 EARNINGS REPORT: Revenue totaled $2.4 billion (YoY +12%). Wealth management division drove outperformance. Fixed income underperformed due to rate volatility.")
  const [task, setTask] = useState('QnA')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/demo/scenarios/groundedness')
      .then(r => r.json()).then(setScenarios).catch(() => {})
  }, [])

  const handleSelectScenario = (s) => {
    setSelected(s)
    setQuery(s.query ?? '')
    setText(s.text)
    setSource(s.source)
    setTask(s.task ?? 'QnA')
    setResult(null)
  }

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/content-safety/groundedness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: task === 'QnA' ? query : undefined, text, grounding_sources: source, domain: 'Finance', task, reasoning: false }),
      })
      const data = await res.json()
      if (!res.ok || data.detail) {
        setResult({ error: data.detail || `HTTP ${res.status}` })
      } else {
        setResult(data)
      }
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FeaturePage
      title="Groundedness Detection"
      description="Verify that AI-generated financial summaries, research reports, and analyst responses are grounded in the provided source documents. Prevents AI hallucination in critical capital markets contexts where unverified claims can cause regulatory and financial harm."
      icon={CheckCircle}
      color="#10b981"
    >
      <div className="grid-2">
        <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Configuration</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Domain</label>
                <select defaultValue="Finance"><option>Finance</option><option>Generic</option></select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Task</label>
                <select value={task} onChange={e => setTask(e.target.value)}><option>QnA</option><option>Summarization</option></select>
              </div>
            </div>
            {task === 'QnA' && <>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Query (optional)</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="What question was the AI answering?" style={{ marginBottom: '0.75rem' }} />
            </>}
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>AI-Generated Response</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Paste the AI-generated report or answer..." style={{ marginBottom: '0.75rem' }} />
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Grounding Source Document</label>
            <textarea value={source} onChange={e => setSource(e.target.value)} rows={4} placeholder="Paste the source document the AI should be grounded in..." />
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim() || !source.trim()}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
                Check Groundedness
              </button>
            </div>
          </div>

          {result && result.error && (
            <div className="card fade-in" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Error</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{result.error}</span>
              </div>
            </div>
          )}

          {result && !result.error && (
            <div className="card fade-in">
              <div className="card-header">
                <h3>Groundedness Results</h3>
                <span className={`badge ${result.ungrounded ? 'badge-critical' : 'badge-safe'}`}>
                  {result.ungrounded ? 'Ungrounded - Hallucination Detected' : 'Grounded'}
                </span>
              </div>
              <ResultPanel result={result} keyStats={[
                { label: 'Status', value: result.ungrounded ? 'UNGROUNDED' : 'GROUNDED', color: result.ungrounded ? 'var(--accent-red)' : 'var(--accent-green)' },
                { label: 'Confidence', value: `${(result.confidence * 100).toFixed(0)}%` },
                { label: 'Contradicting Segments', value: result.contradicting_segments?.length ?? 0 },
              ]}>
                {result.reasoning && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Reasoning</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{result.reasoning}</div>
                  </div>
                )}
                {result.contradicting_segments?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Contradicting Segments</div>
                    {result.contradicting_segments.map((seg, i) => (
                      <div key={i} style={{ padding: '0.5rem 0.7rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{seg.text}"</div>
                        {seg.reason && <div style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '0.2rem' }}>{seg.reason}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </ResultPanel>
              <RawJsonView data={result} />
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  )
}
