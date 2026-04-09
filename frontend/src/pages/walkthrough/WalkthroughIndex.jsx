/**
 * WalkthroughIndex.jsx
 * Landing page for the Demo Walkthrough section.
 * Shows the persona card, incident summary, and the 9 chapter cards.
 */

import { Link } from 'react-router-dom'
import { CHAPTERS, PERSONA } from '../../data/walkthroughData'
import {
  User,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  Shield,
  ShieldCheck,
  Globe,
  BarChart2,
  Activity,
  GitMerge,
  Layers,
  Fingerprint,
  AlertOctagon,
} from 'lucide-react'

const CHAPTER_ICONS = [
  Shield,
  ShieldCheck,
  Globe,
  BarChart2,
  Activity,
  GitMerge,
  Layers,
  Fingerprint,
  AlertOctagon,
]

export default function WalkthroughIndex() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 8px 48px' }}>

      {/* ── Page title ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <BookMarked size={22} style={{ color: '#10b981' }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Demo Walkthrough
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          A 9-chapter story of how Marcus Chen built a compliant AI governance programme for a
          GBP 48B AUM capital markets firm under active SEC scrutiny. Follow the narrative or
          jump to any chapter from the sidebar.
        </p>
      </div>

      {/* ── Persona card ── */}
      <div
        style={{
          padding: '20px 24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          marginBottom: 20,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {PERSONA.name}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{PERSONA.title}</span>
          </div>
          <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500, marginBottom: 6 }}>
            {PERSONA.company} &mdash; {PERSONA.aum}
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Mission:</strong>{' '}
            {PERSONA.mission}
          </p>
        </div>
      </div>

      {/* ── Incident card ── */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: 12,
          marginBottom: 32,
          display: 'flex',
          gap: 12,
        }}
      >
        <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            The Incident That Started Everything
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
            {PERSONA.incident}
          </p>
        </div>
      </div>

      {/* ── Chapter grid ── */}
      <h2
        style={{
          margin: '0 0 16px 0',
          fontSize: 14,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}
      >
        The 9-Chapter Remediation Journey
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {CHAPTERS.map((chapter, idx) => {
          const ChapterIcon = CHAPTER_ICONS[idx]
          return (
            <Link
              key={chapter.n}
              to={`/walkthrough/${chapter.n}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '18px 20px',
                  background: 'var(--bg-card)',
                  border: `1px solid ${chapter.accentBorder}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 20px ${chapter.accentBg}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Icon + chapter number */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: chapter.accentBg,
                      border: `1px solid ${chapter.accentBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChapterIcon size={16} style={{ color: chapter.accent }} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: chapter.accent,
                    }}
                  >
                    Ch {chapter.n}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    margin: '0 0 3px 0',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {chapter.title}
                </h3>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  {chapter.subtitle}
                </p>

                {/* Regulatory tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {chapter.regulatory.map((r) => (
                    <span
                      key={r}
                      style={{
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        fontSize: 10,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>

                {/* Step count + arrow */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {chapter.steps.length} steps
                  </span>
                  <ArrowRight size={13} style={{ color: chapter.accent }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
