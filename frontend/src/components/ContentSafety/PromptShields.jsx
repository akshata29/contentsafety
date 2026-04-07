import { useState, useEffect } from 'react'
import { Zap, Play, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { FeaturePage, ScenarioSelector, ResultPanel, RawJsonView } from '../Common/FeaturePage'

export default function PromptShields() {
  const [userPrompt, setUserPrompt] = useState("What are the key risk factors for emerging market sovereign debt in a rising dollar environment?")
  const [documents, setDocuments] = useState([''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/demo/scenarios/prompt_shields')
      .then(r => r.json()).then(setScenarios).catch(() => {})
  }, [])

  const handleSelectScenario = (s) => {
    setSelected(s)
    setUserPrompt(s.prompt)
    if (s.documents) {
      setDocuments(s.documents)
    } else if (s.document) {
      setDocuments([s.document])
    } else {
      setDocuments([''])
    }
    setResult(null)
  }

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    const docs = documents.filter(d => d.trim())
    try {
      const res = await fetch('/api/content-safety/prompt-shields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: userPrompt, documents: docs.length > 0 ? docs : null }),
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
      title="Prompt Shields"
      description="Protect financial AI assistants from adversarial attacks. Detects User Prompt attacks (jailbreak attempts trying to override compliance rules) and Document attacks (XPIA - indirect prompt injections embedded in research reports or client documents)."
      icon={Zap}
      color="#f59e0b"
    >
      <div className="grid-2">
        <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>User Prompt</h3>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Jailbreak detection</span>
            </div>
            <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} rows={4}
              placeholder="Enter the user's prompt to the financial AI assistant..." />
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Documents (optional)</h3>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>XPIA detection</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Add grounding documents (research reports, emails) to check for indirect prompt injection attacks.
            </p>
            {documents.map((doc, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <textarea
                  value={doc}
                  onChange={e => setDocuments(prev => prev.map((d, j) => j === i ? e.target.value : d))}
                  placeholder={`Document ${i + 1}: Paste research report or email content...`}
                  rows={3}
                  style={{ flex: 1 }}
                />
                {documents.length > 1 && (
                  <button onClick={() => setDocuments(prev => prev.filter((_, j) => j !== i))}
                    style={{ padding: '0.3rem', background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', alignSelf: 'flex-start', marginTop: 2 }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {documents.length < 5 && (
              <button className="btn-secondary" onClick={() => setDocuments(p => [...p, ''])} style={{ fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Document
              </button>
            )}
          </div>

          <button className="btn-primary" onClick={analyze} disabled={loading || !userPrompt.trim()}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
            Analyze with Prompt Shields
          </button>

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
                <h3>Shield Results</h3>
                <span className={`badge ${(result.user_prompt_detected || result.documents_detected) ? 'badge-critical' : 'badge-safe'}`}>
                  {(result.user_prompt_detected || result.documents_detected) ? 'Attack Detected' : 'No Attack'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* User prompt result */}
                <div style={{
                  padding: '0.75rem',
                  background: result.user_prompt_detected ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                  border: `1px solid ${result.user_prompt_detected ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {result.user_prompt_detected
                      ? <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} />
                      : <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                    }
                    <strong style={{ fontSize: '0.8rem' }}>User Prompt Analysis</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {result.user_prompt_detected
                      ? `Attack Detected: ${result.user_prompt_result?.attack_type || 'UserPromptInjection'}`
                      : 'No jailbreak or prompt injection detected'}
                  </div>
                </div>

                {/* Documents results */}
                {result.documents_results?.length > 0 && result.documents_results.map((dr, i) => (
                  <div key={i} style={{
                    padding: '0.75rem',
                    background: dr.attack_detected ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                    border: `1px solid ${dr.attack_detected ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {dr.attack_detected
                        ? <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} />
                        : <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                      }
                      <strong style={{ fontSize: '0.8rem' }}>Document {i + 1}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {dr.attack_detected ? 'XPIA (Indirect Prompt Injection) Detected' : 'No indirect attack'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <RawJsonView data={result} />
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  )
}
