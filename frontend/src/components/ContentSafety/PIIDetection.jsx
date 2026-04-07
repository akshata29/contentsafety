import { useState, useEffect } from 'react'
import { Fingerprint, Play, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { FeaturePage, ScenarioSelector, RawJsonView } from '../Common/FeaturePage'

// Category -> display colour mapping
const CATEGORY_COLORS = {
  Person:                           { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444', label: 'Person' },
  PersonType:                       { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444', label: 'Person Type' },
  Age:                              { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444', label: 'Age' },
  Email:                            { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.4)',  text: '#06b6d4', label: 'Email' },
  PhoneNumber:                      { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.4)',  text: '#06b6d4', label: 'Phone' },
  URL:                              { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.4)',  text: '#06b6d4', label: 'URL' },
  IPAddress:                        { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.4)',  text: '#06b6d4', label: 'IP Address' },
  Address:                          { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', text: '#10b981', label: 'Address' },
  DateTime:                         { bg: 'rgba(100,116,139,0.12)',border: 'rgba(100,116,139,0.4)',text: '#94a3b8', label: 'Date/Time' },
  CreditCardNumber:                 { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', label: 'Credit Card' },
  InternationalBankingAccountNumber:{ bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', label: 'IBAN' },
  SWIFTCode:                        { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', label: 'SWIFT' },
  ABARoutingNumber:                 { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', label: 'ABA Routing' },
  SocialSecurityNumber:             { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: 'SSN' },
  USSocialSecurityNumber:           { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: 'SSN' },
  PassportNumber:                   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: 'Passport' },
  DriversLicense:                   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: "Driver's License" },
  EUDriversLicense:                 { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: "Driver's License" },
  USDriversLicenseNumber:           { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: "Driver's License" },
  TaxIdentificationNumber:          { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', label: 'Tax ID' },
  AzureConnectionString:            { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.4)', text: '#8b5cf6', label: 'Azure Conn. String' },
  AzureStorageAccountKey:           { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.4)', text: '#8b5cf6', label: 'Azure Storage Key' },
  AzureIotConnectionString:         { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.4)', text: '#8b5cf6', label: 'Azure IoT Key' },
  AzurePublishSettingPassword:      { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.4)', text: '#8b5cf6', label: 'Azure Publish Key' },
}

function categoryStyle(category) {
  return CATEGORY_COLORS[category] || {
    bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.35)',
    text: '#94a3b8', label: category,
  }
}

function CategoryBadge({ category }) {
  const s = categoryStyle(category)
  return (
    <span style={{
      padding: '0.1rem 0.45rem',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 4,
      fontSize: '0.68rem',
      fontWeight: 600,
      color: s.text,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// Build annotated text spans from entities
function AnnotatedText({ text, entities }) {
  if (!entities || entities.length === 0) {
    return <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{text}</span>
  }

  // Sort by offset, resolve overlaps by keeping highest-confidence
  const sorted = [...entities].sort((a, b) => a.offset - b.offset)
  const spans = []
  let cursor = 0

  for (const entity of sorted) {
    if (entity.offset < cursor) continue   // skip overlapping
    if (entity.offset > cursor) {
      spans.push({ type: 'text', content: text.slice(cursor, entity.offset) })
    }
    const s = categoryStyle(entity.category)
    spans.push({ type: 'entity', content: text.slice(entity.offset, entity.offset + entity.length), entity, style: s })
    cursor = entity.offset + entity.length
  }
  if (cursor < text.length) {
    spans.push({ type: 'text', content: text.slice(cursor) })
  }

  return (
    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, overflowWrap: 'anywhere' }}>
      {spans.map((sp, i) =>
        sp.type === 'text'
          ? <span key={i}>{sp.content}</span>
          : (
            <span key={i} title={`${sp.entity.category} (${Math.round(sp.entity.confidence * 100)}% confidence)`}
              style={{
                background: sp.style.bg,
                border: `1px solid ${sp.style.border}`,
                borderRadius: 3,
                padding: '0 2px',
                color: sp.style.text,
                fontWeight: 600,
                cursor: 'help',
              }}>
              {sp.content}
            </span>
          )
      )}
    </span>
  )
}

export default function PIIDetection() {
  const [text, setText] = useState(
    "New client application for James R. Whitfield (DOB: 04/15/1978, SSN: 523-48-2197). " +
    "Contact: james.whitfield@pineridge-capital.com, +1 (415) 882-3094. " +
    "Home address: 2847 Meadow Creek Drive, Palo Alto, CA 94303."
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selected, setSelected] = useState(null)
  const [showRedacted, setShowRedacted] = useState(false)

  useEffect(() => {
    fetch('/api/demo/scenarios/pii_detection')
      .then(r => r.json()).then(setScenarios).catch(() => {})
  }, [])

  const handleSelectScenario = (s) => {
    setSelected(s)
    setText(s.text)
    setResult(null)
    setShowRedacted(false)
  }

  const analyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/content-safety/pii-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categories: [] }),
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

  // Group entities by category for the summary panel
  const grouped = result && !result.error
    ? Object.entries(result.category_summary || {}).sort((a, b) => b[1] - a[1])
    : []

  return (
    <FeaturePage
      title="PII Detection"
      description="Identify and redact Personally Identifiable Information in AI-generated text and financial communications. Detects names, SSNs, credit cards, IBANs, passports, driver licenses, emails, phone numbers, IP addresses, and Azure credentials. Supports Annotate and Annotate+Block filtering modes for HIPAA, CCPA, and GDPR compliance."
      icon={Fingerprint}
      color="#ec4899"
    >
      <div className="grid-2">
        <ScenarioSelector scenarios={scenarios} selected={selected} onSelect={handleSelectScenario} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Input */}
          <div className="card">
            <div className="card-header">
              <h3>Text to Analyze</h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>PII / Privacy</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Paste client communications, trade confirmations, KYC documents, or any text that may contain personal data.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Paste text to scan for PII: names, SSNs, credit cards, emails, passports, addresses..."
            />
          </div>

          <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Play size={14} />}
            Scan for PII
          </button>

          {/* Error */}
          {result && result.error && (
            <div className="card fade-in" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.85rem' }}>Error</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{result.error}</span>
                {(result.error.includes('401') || result.error.includes('Access denied') || result.error.includes('subscription key')) && (
                  <div style={{ marginTop: '0.25rem', padding: '0.65rem 0.75rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#f59e0b' }}>Setup required:</strong> PII Detection uses the Azure AI Language API which requires a
                    <strong> multi-service AI Services resource</strong> (not a dedicated Content Safety resource).
                    Add to your .env:
                    <br />
                    <code style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                      AZURE_AI_LANGUAGE_ENDPOINT=https://&lt;your-ai-services-resource&gt;.cognitiveservices.azure.com/<br />
                      AZURE_AI_LANGUAGE_API_KEY=&lt;your-key&gt;
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <div className="card fade-in">
              <div className="card-header">
                <h3>Detection Results</h3>
                <span className={`badge ${result.detected ? 'badge-critical' : 'badge-safe'}`}>
                  {result.detected ? `${result.entity_count} PII Entity${result.entity_count !== 1 ? 'ies' : 'y'} Found` : 'No PII Detected'}
                </span>
              </div>

              {/* Summary stat chips */}
              {grouped.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {grouped.map(([cat, count]) => {
                    const s = categoryStyle(cat)
                    return (
                      <span key={cat} style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.25rem 0.6rem',
                        background: s.bg, border: `1px solid ${s.border}`,
                        borderRadius: 6, fontSize: '0.72rem', color: s.text, fontWeight: 600,
                      }}>
                        {s.label}
                        <span style={{
                          background: s.border, color: '#fff',
                          borderRadius: '50%', width: 16, height: 16,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.62rem', fontWeight: 700,
                        }}>{count}</span>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Toggle annotated / redacted */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  onClick={() => setShowRedacted(false)}
                  style={{
                    flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600,
                    background: !showRedacted ? 'rgba(236,72,153,0.12)' : 'var(--bg-elevated)',
                    border: `1px solid ${!showRedacted ? 'rgba(236,72,153,0.4)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', color: !showRedacted ? '#ec4899' : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  }}>
                  <Eye size={12} /> Annotated
                </button>
                <button
                  onClick={() => setShowRedacted(true)}
                  style={{
                    flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600,
                    background: showRedacted ? 'rgba(236,72,153,0.12)' : 'var(--bg-elevated)',
                    border: `1px solid ${showRedacted ? 'rgba(236,72,153,0.4)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', color: showRedacted ? '#ec4899' : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  }}>
                  <EyeOff size={12} /> Redacted
                </button>
              </div>

              {/* Text display */}
              <div style={{
                padding: '0.85rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.85rem',
                minHeight: 60,
              }}>
                {showRedacted
                  ? <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, overflowWrap: 'anywhere' }}>
                      {result.redacted_text || text}
                    </span>
                  : <AnnotatedText text={text} entities={result.entities} />
                }
              </div>

              {/* Entity list */}
              {result.entities && result.entities.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Detected Entities
                  </span>
                  {result.entities.map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.45rem 0.65rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <CategoryBadge category={e.category} />
                      <span style={{
                        flex: 1, fontSize: '0.8rem', color: 'var(--text-primary)',
                        fontFamily: 'monospace', overflowWrap: 'anywhere',
                      }}>
                        {e.text}
                      </span>
                      {e.subcategory && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {e.subcategory}
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.68rem', color: 'var(--text-muted)',
                        flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                      }}>
                        {Math.round(e.confidence * 100)}%
                      </span>
                      {e.confidence >= 0.85
                        ? <AlertTriangle size={11} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                        : <CheckCircle size={11} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                      }
                    </div>
                  ))}
                </div>
              )}

              {!result.detected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)', fontSize: '0.82rem' }}>
                  <CheckCircle size={14} />
                  No personal data detected in this text. Safe to pass through the content filter.
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
