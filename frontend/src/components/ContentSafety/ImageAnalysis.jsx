import { useState, useEffect } from 'react'
import { Image, Upload, Link, Play } from 'lucide-react'
import { FeaturePage, ScenarioSelector, ResultPanel, CategoriesGrid, RawJsonView } from '../Common/FeaturePage'

export default function ImageAnalysis() {
  const [mode, setMode] = useState('url')
  const [imageUrl, setImageUrl] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/demo/scenarios/image_analysis')
      .then(r => r.json()).then(setScenarios).catch(() => {})
  }, [])

  const handleSelectScenario = (s) => {
    setSelected(s)
    setResult(null)
    if (s.image_url) {
      setMode('url')
      setImageUrl(s.image_url)
      setFile(null)
      setPreview(null)
    } else {
      setMode('upload')
      setImageUrl('')
      setFile(null)
      setPreview(null)
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(f)
    setResult(null)
  }

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      if (mode === 'url') {
        const res = await fetch('/api/content-safety/analyze/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: imageUrl }),
        })
        const data = await res.json()
        if (!res.ok || data.detail) {
          setResult({ error: data.detail || `HTTP ${res.status}` })
        } else {
          setResult(data)
        }
      } else {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/content-safety/analyze/image/upload', {
          method: 'POST', body: form,
        })
        const uploadData = await res.json()
        if (!res.ok || uploadData.detail) {
          setResult({ error: uploadData.detail || `HTTP ${res.status}` })
        } else {
          setResult(uploadData)
        }
      }
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FeaturePage
      title="Image Analysis"
      description="Screen images in research reports, presentations, and client materials for harmful visual content. Supports URL-based and direct file upload analysis with severity scoring (0-6) across Hate, Sexual, Violence, and Self-Harm categories."
      icon={Image}
      color="#06b6d4"
    >
      <div className="grid-2">
        <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Input Method</h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['url', 'upload'].map(m => (
                <button
                  key={m}
                  className={mode === m ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => { setMode(m); setResult(null) }}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  {m === 'url' ? <><Link size={12} /> URL</> : <><Upload size={12} /> Upload</>}
                </button>
              ))}
            </div>
          </div>

          {mode === 'url' ? (
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/report-chart.png"
            />
          ) : (
            <div>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="img-upload" />
              <label htmlFor="img-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '2rem',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                background: 'var(--bg-elevated)',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}>
                <Upload size={24} />
                {file ? file.name : 'Click to upload image (JPG, PNG, GIF, WEBP)'}
              </label>
            </div>
          )}

          {preview && (
            <div style={{ marginTop: '0.75rem' }}>
              <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
          )}

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn-primary" onClick={analyze} disabled={loading || (mode === 'url' ? !imageUrl : !file)}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
              Analyze Image
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max 4 MB, 50x50 to 7200x7200 px</span>
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
                <h3>Image Analysis Results</h3>
                <span className={`badge ${result.flagged ? 'badge-critical' : 'badge-safe'}`}>
                  {result.flagged ? 'Flagged' : 'Cleared'}
                </span>
              </div>
              <ResultPanel result={result} keyStats={[{ label: 'Max Severity', value: result.severity_max }]}>
                <CategoriesGrid categories={result.categories} />
              </ResultPanel>
              <RawJsonView data={result} />
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  )
}
