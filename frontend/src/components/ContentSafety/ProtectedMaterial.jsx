import { useState, useEffect } from 'react'
import { BookOpen, Play, AlertTriangle, CheckCircle } from 'lucide-react'
import { FeaturePage, ScenarioSelector, RawJsonView } from '../Common/FeaturePage'

const SOURCES = [
  { name: 'Bloomberg L.P.',    type: 'Financial Data & Research',  color: '#f59e0b' },
  { name: 'Reuters',           type: 'News & Market Data',         color: '#06b6d4' },
  { name: 'S&P Global',        type: 'Credit Ratings & Analysis',  color: '#3b82f6' },
  { name: "Moody's Analytics", type: 'Credit Risk & Research',     color: '#8b5cf6' },
  { name: 'FactSet Research',  type: 'Financial Data',             color: '#10b981' },
]

const RISK_COLORS = {
  Critical: 'var(--severity-critical)',
  High:     'var(--severity-high)',
  Medium:   'var(--severity-medium)',
  Low:      'var(--severity-safe)',
}

const RISK_BADGE = {
  Critical: 'badge-critical',
  High:     'badge-high',
  Medium:   'badge-medium',
  Low:      'badge-safe',
}

export default function ProtectedMaterial() {
  const [text, setText] = useState("Our internal risk team has assessed the portfolio duration gap at 1.2 years relative to benchmark. The convexity profile suggests limited upside participation in a rally scenario.")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/demo/scenarios/protected_material')
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
      const res = await fetch('/api/content-safety/protected-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
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

  const detectedSource = result?.detected && result?.source_name
    ? SOURCES.find(s => s.name === result.source_name)
    : null

  const confPct = result?.confidence ? Math.round(result.confidence * 100) : 0

  return (
    <FeaturePage
      title="Protected Material Detection"
      description="Detect when AI-generated output reproduces known copyrighted content such as Bloomberg Terminal research, Reuters news feeds, S&P Global credit reports, and Moody's analysis. Critical for capital markets firms to ensure AI output does not violate third-party IP agreements."
      icon={BookOpen}
      color="#8b5cf6"
    >
      <div className="grid-2">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

          <div className="card">
            <div className="card-header">
              <h3>Sources Monitored</h3>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>5 Active</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {SOURCES.map(src => {
                const isHit = detectedSource?.name === src.name
                return (
                  <div key={src.name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    background: isHit ? `${src.color}18` : 'var(--bg-elevated)',
                    border: `1px solid ${isHit ? src.color + '60' : 'var(--border)'}`,
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: src.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{src.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{src.type}</div>
                    </div>
                    {isHit && (
                      <span className="badge badge-high" style={{ fontSize: '0.6rem' }}>MATCH</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>AI-Generated Text</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Paste AI-generated financial content to check for reproduction of copyrighted material. Minimum 110 characters.
            </p>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
              placeholder="Paste the AI-generated text to check for protected material..." />
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
              {text.length < 110 && text.length > 0 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
                  Min 110 chars ({text.length}/110)
                </span>
              )}
              <button className="btn-primary" onClick={analyze} disabled={loading || text.length < 110}>
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
                Scan for Protected Material
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
                <h3>Detection Results</h3>
                <span className={`badge ${result.detected ? 'badge-critical' : 'badge-safe'}`}>
                  {result.detected ? 'Protected Material Found' : 'No Protected Material'}
                </span>
              </div>

              {result.detected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                  {/* Source attribution */}
                  {detectedSource && (
                    <div style={{
                      padding: '0.75rem',
                      background: `${detectedSource.color}12`,
                      border: `1px solid ${detectedSource.color}55`,
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                        <AlertTriangle size={14} style={{ color: detectedSource.color }} />
                        <strong style={{ fontSize: '0.8rem', color: detectedSource.color }}>Source Identified</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: detectedSource.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{detectedSource.name}</span>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{detectedSource.type}</span>
                      </div>
                    </div>
                  )}

                  {/* Metadata chips */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {result.ip_risk_level && (
                      <div style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>IP Risk: </span>
                        <span style={{ color: RISK_COLORS[result.ip_risk_level] || 'var(--text-primary)', fontWeight: 600 }}>{result.ip_risk_level}</span>
                      </div>
                    )}
                    {result.match_type && (
                      <div style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Match Type: </span>
                        <span style={{ fontWeight: 600 }}>{result.match_type}</span>
                      </div>
                    )}
                    {result.source_type && (
                      <div style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Source Type: </span>
                        <span style={{ fontWeight: 600 }}>{result.source_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Confidence bar */}
                  {result.confidence > 0 && (
                    <div style={{ padding: '0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detection Confidence</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: confPct >= 90 ? 'var(--severity-critical)' : confPct >= 80 ? 'var(--severity-high)' : 'var(--severity-medium)' }}>{confPct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${confPct}%`,
                          background: confPct >= 90 ? 'var(--severity-critical)' : confPct >= 80 ? 'var(--severity-high)' : 'var(--severity-medium)',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Citation */}
                  {result.citation && (
                    <div style={{ padding: '0.65rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citation</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{result.citation}</div>
                    </div>
                  )}

                  {/* Remediation */}
                  <div style={{ padding: '0.65rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Actions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {[
                        'Remove or replace the flagged content before publication',
                        'Obtain proper licensing from ' + (result.source_name || 'the detected source'),
                        'Consult Legal & Compliance before distributing AI-generated output',
                        'Use paraphrasing and cite original sources appropriately',
                      ].map((action, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 700, flexShrink: 0 }}>-</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                    <strong style={{ fontSize: '0.82rem', color: 'var(--accent-green)' }}>Content Cleared</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <div style={{ padding: '0.35rem 0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Detected: </span>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>NO</span>
                    </div>
                    <div style={{ padding: '0.35rem 0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Source Type: </span>
                      <span style={{ fontWeight: 600 }}>N/A</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                    No copyrighted material from monitored sources was detected. Content appears to be original.
                  </div>
                </div>
              )}

              <RawJsonView data={result} />
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  )
}

