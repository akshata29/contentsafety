import { useState, useEffect } from 'react'
import { ShieldCheck, Play, RefreshCw } from 'lucide-react'
import { FeaturePage, ScenarioSelector, ResultPanel, CategoriesGrid, RawJsonView } from '../Common/FeaturePage'

const DEFAULT_TEXT = "What is the current yield spread on IG corporate bonds vs treasuries? Can you provide Q4 earnings estimates for the S&P 500 financials sector?"

export default function TextAnalysis() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/demo/scenarios/text_analysis')
      .then(r => r.json()).then(setScenarios).catch(() => {})
  }, [])

  const handleSelectScenario = (s) => {
    setSelected(s)
    setText(s.text)
    setResult(null)
  }

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const body = { text }
      if (selected?.blocklist_names) body.blocklist_names = selected.blocklist_names
      const res = await fetch('/api/content-safety/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      // FastAPI errors come back as {detail: '...'}, normalize to {error: '...'}
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
      title="Text Analysis - Harm Categories"
      description="Analyze trader communications, client emails, and research text for harmful content across four categories: Hate & Fairness, Sexual, Violence, and Self-Harm. Each detection includes severity scores (0-6) and can be integrated with custom blocklists for financial compliance terms."
      icon={ShieldCheck}
      color="#3b82f6"
    >
      <div className="grid-2">
        <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Input</h3>
              <button className="btn-secondary" onClick={() => { setText(''); setResult(null) }} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                <RefreshCw size={12} /> Clear
              </button>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter trader communication, research note, or client email..."
              rows={6}
            />
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
                Analyze Text
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
                <h3>Analysis Results</h3>
                <span className={`badge ${result.flagged ? 'badge-critical' : 'badge-safe'}`}>
                  {result.flagged ? 'Flagged' : 'Cleared'}
                </span>
              </div>
              <ResultPanel
                result={result}
                keyStats={[
                  { label: 'Max Severity', value: result.severity_max, color: result.severity_max >= 4 ? 'var(--accent-red)' : result.severity_max >= 2 ? 'var(--accent-amber)' : 'var(--accent-green)' },
                  { label: 'Categories Flagged', value: (result.categories ?? []).filter(c => c.severity >= 4).length },
                  { label: 'Blocklist Matches', value: result.blocklist_matches?.length ?? 0 },
                ]}
              >
                <CategoriesGrid categories={result.categories} />
                {result.blocklist_matches?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '0.3rem' }}>Blocklist Matches:</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {result.blocklist_matches.map(m => (
                        <span key={m} className="badge badge-critical" style={{ fontSize: '0.7rem' }}>{m}</span>
                      ))}
                    </div>
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
