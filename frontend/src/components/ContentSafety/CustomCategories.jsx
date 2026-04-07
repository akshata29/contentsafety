import { useState, useEffect } from 'react'
import { Tag, Play, CheckCircle } from 'lucide-react'
import { FeaturePage, ScenarioSelector, ResultPanel, RawJsonView } from '../Common/FeaturePage'

const CATEGORIES = [
  { key: 'MarketManipulation', label: 'Market Manipulation', color: '#ef4444', desc: 'Pump-and-dump, wash trading, spoofing, painting the tape, layering' },
  { key: 'InsiderTrading', label: 'Insider Trading', color: '#f97316', desc: 'MNPI-based trading, tipping, pre-announcement trading' },
  { key: 'FrontRunning', label: 'Front Running', color: '#f59e0b', desc: 'Trading ahead of client orders, using pending order knowledge' },
  { key: 'FinancialFraud', label: 'Financial Fraud', color: '#8b5cf6', desc: 'Mis-selling, false accounting, mark-to-model abuse, Ponzi schemes' },
]

export default function CustomCategories() {
  const [text, setText] = useState("We need to coordinate buying XYZQ before the announcement drops then dump our positions after the spike.")
  const [selectedCategory, setSelectedCategory] = useState('MarketManipulation')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [categoryDefs, setCategoryDefs] = useState({})
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/demo/scenarios/custom_categories').then(r => r.json()).then(setScenarios).catch(() => {})
    fetch('/api/content-safety/custom-categories').then(r => r.json()).then(setCategoryDefs).catch(() => {})
  }, [])

  const handleSelectScenario = (s) => {
    setSelected(s)
    setText(s.text)
    setSelectedCategory(s.category)
    setResult(null)
  }

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/content-safety/custom-categories/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, category_name: selectedCategory }),
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

  const activeCat = CATEGORIES.find(c => c.key === selectedCategory)

  return (
    <FeaturePage
      title="Custom Categories"
      description="Capital markets-specific custom compliance categories trained on financial domain patterns. Detect market manipulation schemes, insider trading signals, front-running behavior, and financial fraud language across trader communications and AI-generated content."
      icon={Tag}
      color="#f97316"
    >
      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

          <div className="card">
            <div className="card-header">
              <h3>Compliance Categories</h3>
              <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>Financial Domain</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {CATEGORIES.map(cat => {
                const def = categoryDefs[cat.key]
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setSelectedCategory(cat.key); setResult(null) }}
                    style={{
                      display: 'flex', gap: '0.75rem', padding: '0.65rem 0.75rem',
                      background: selectedCategory === cat.key ? `${cat.color}15` : 'var(--bg-elevated)',
                      border: `1px solid ${selectedCategory === cat.key ? cat.color + '60' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.12s',
                    }}
                  >
                    {selectedCategory === cat.key && (
                      <CheckCircle size={14} style={{ color: cat.color, flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ flex: 1, paddingLeft: selectedCategory === cat.key ? 0 : 18 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: cat.color }}>{cat.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.15rem' }}>{cat.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Text to Analyze</h3>
              {activeCat && <span className="badge" style={{
                fontSize: '0.65rem',
                background: `${activeCat.color}15`,
                color: activeCat.color,
                border: `1px solid ${activeCat.color}40`,
              }}>{activeCat.label}</span>}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
              placeholder={`Enter text to screen for ${activeCat?.label || 'custom category'}...`} />
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
                Screen Text
              </button>
            </div>
          </div>

          {categoryDefs[selectedCategory] && (
            <div className="card">
              <div className="card-header">
                <h3>Category Definition</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                {categoryDefs[selectedCategory]?.definition}
              </p>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Sample Phrases</div>
              {categoryDefs[selectedCategory]?.sample_phrases?.map((p, i) => (
                <div key={i} style={{
                  padding: '0.35rem 0.6rem', marginBottom: '0.25rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 4, fontSize: '0.75rem', color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                }}>"{p}"</div>
              ))}
            </div>
          )}

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
                <h3>Detection Result</h3>
                <span className={`badge ${result.detected ? 'badge-high' : 'badge-safe'}`}>
                  {result.detected ? 'Violation Detected' : 'Cleared'}
                </span>
              </div>
              <ResultPanel result={result} keyStats={[
                { label: 'Category', value: result.category },
                { label: 'Detected', value: result.detected ? 'YES' : 'NO', color: result.detected ? 'var(--accent-red)' : 'var(--accent-green)' },
                { label: 'Confidence', value: `${(result.confidence * 100).toFixed(0)}%` },
              ]}>
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${result.confidence * 100}%`,
                        background: result.detected ? 'var(--accent-red)' : 'var(--accent-green)',
                        borderRadius: 3, transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 36 }}>{(result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Model confidence score</div>
                </div>
              </ResultPanel>
              <RawJsonView data={result} />
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  )
}
