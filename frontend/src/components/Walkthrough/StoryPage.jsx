/**
 * StoryPage.jsx
 * Shared renderer for all 9 Demo Walkthrough chapters.
 * Receives a chapter object from walkthroughData.js and renders:
 *  - Chapter header with persona context bar
 *  - Incident / challenge framing
 *  - Numbered steps (story | biz point | tech detail accordion | actions)
 *  - Prev / Next chapter navigation
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Building2,
  BookOpen,
  Zap,
  Lock,
  Code2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function variantMeta(variant) {
  switch (variant) {
    case 'foundry':
      return {
        bg: 'rgba(139,92,246,0.12)',
        border: 'rgba(139,92,246,0.30)',
        text: '#8b5cf6',
        Icon: ExternalLink,
        label: 'Foundry Portal',
      }
    case 'azure':
      return {
        bg: 'rgba(14,165,233,0.12)',
        border: 'rgba(14,165,233,0.30)',
        text: '#38bdf8',
        Icon: ExternalLink,
        label: 'Azure Portal',
      }
    case 'code':
      return {
        bg: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.30)',
        text: '#10b981',
        Icon: Code2,
        label: 'Code',
      }
    default: // app
      return {
        bg: 'rgba(59,130,246,0.12)',
        border: 'rgba(59,130,246,0.30)',
        text: '#3b82f6',
        Icon: Zap,
        label: 'Open in App',
      }
  }
}

function ActionButton({ action }) {
  const meta = variantMeta(action.variant)
  const { Icon } = meta

  const inner = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 8,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.text,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'opacity 0.15s',
      }}
    >
      <Icon size={14} />
      {action.label}
    </span>
  )

  if (action.to) {
    return (
      <Link to={action.to} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    )
  }
  return (
    <a href={action.href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
      {inner}
    </a>
  )
}

function InstructionCard({ action }) {
  if (!action.instruction) return null
  return (
    <div
      style={{
        marginTop: 8,
        padding: '10px 14px',
        background: 'rgba(139,92,246,0.05)',
        border: '1px dashed rgba(139,92,246,0.25)',
        borderRadius: 8,
        fontSize: 12,
        color: '#a78bfa',
        lineHeight: 1.5,
      }}
    >
      <strong style={{ color: '#c4b5fd', display: 'block', marginBottom: 2 }}>
        Portal Steps:
      </strong>
      {action.instruction}
    </div>
  )
}

function HintCard({ hint }) {
  if (!hint) return null
  return (
    <div
      style={{
        marginTop: 6,
        padding: '8px 12px',
        background: 'rgba(59,130,246,0.06)',
        border: '1px dashed rgba(59,130,246,0.20)',
        borderRadius: 8,
        fontSize: 12,
        color: '#93c5fd',
        lineHeight: 1.5,
      }}
    >
      <strong style={{ color: '#bfdbfe', display: 'block', marginBottom: 2 }}>Hint:</strong>
      {hint}
    </div>
  )
}

function StepCard({ step, accent, accentBg, accentBorder, stepTotal }) {
  const [techOpen, setTechOpen] = useState(false)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 20,
      }}
    >
      {/* Step header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: accentBg,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {step.n}
        </span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {step.title}
        </h3>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          Step {step.n} of {stepTotal}
        </span>
      </div>

      <div style={{ padding: '18px 20px' }}>
        {/* Story / narrative */}
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
          }}
        >
          {step.story}
        </p>

        {/* Business point */}
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.20)',
            borderRadius: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#10b981',
            }}
          >
            <Building2 size={12} />
            Business Angle
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {step.bizPoint}
          </p>
        </div>

        {/* Regulatory note */}
        {step.regNote && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#f59e0b',
              }}
            >
              <Lock size={12} />
              Regulatory Angle
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {step.regNote}
            </p>
          </div>
        )}

        {/* Tech detail accordion */}
        {step.techDetail && (
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => setTechOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                fontWeight: 500,
              }}
            >
              {techOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Technical Detail
            </button>
            {techOpen && (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 14px',
                  background: 'rgba(99,102,241,0.05)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.65,
                  color: '#a5b4fc',
                }}
              >
                {step.techDetail}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {step.actions && step.actions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {step.actions.map((action, i) => (
                <ActionButton key={i} action={action} />
              ))}
            </div>
            {step.actions
              .filter((a) => a.instruction || a.hint)
              .map((action, i) => (
                <div key={i}>
                  <InstructionCard action={action} />
                  <HintCard hint={action.hint} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main StoryPage component
// ─────────────────────────────────────────────────────────────────────────────

export default function StoryPage({ chapter, allChapters }) {
  const { accent, accentBg, accentBorder } = chapter
  const prevChapter = allChapters.find((c) => c.n === chapter.n - 1)
  const nextChapter = allChapters.find((c) => c.n === chapter.n + 1)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 8px 48px' }}>
      {/* ── Chapter header ── */}
      <div
        style={{
          padding: '24px 28px',
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          borderRadius: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              background: accent,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            CHAPTER {chapter.n} OF {allChapters.length}
          </span>
          {chapter.regulatory.map((r) => (
            <span
              key={r}
              style={{
                padding: '3px 9px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'var(--text-muted)',
                fontSize: 11,
              }}
            >
              {r}
            </span>
          ))}
        </div>
        <h1
          style={{
            margin: '0 0 4px 0',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {chapter.title}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: accent, fontWeight: 500 }}>
          {chapter.subtitle}
        </p>
      </div>

      {/* ── Incident framing ── */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 12,
          marginBottom: 28,
          display: 'flex',
          gap: 12,
        }}
      >
        <AlertTriangle
          size={18}
          style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}
        />
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
            Scene Setting
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
            {chapter.challenge}
          </p>
        </div>
      </div>

      {/* ── Steps ── */}
      {chapter.steps.map((step) => (
        <StepCard
          key={step.n}
          step={step}
          accent={accent}
          accentBg={accentBg}
          accentBorder={accentBorder}
          stepTotal={chapter.steps.length}
        />
      ))}

      {/* ── Chapter navigation ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
          gap: 16,
        }}
      >
        {prevChapter ? (
          <Link
            to={`/walkthrough/${prevChapter.n}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              flex: 1,
            }}
          >
            <ArrowLeft size={15} />
            <span>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Previous</span>
              {prevChapter.title}
            </span>
          </Link>
        ) : (
          <Link
            to="/walkthrough"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={15} />
            Story Overview
          </Link>
        )}

        <Link
          to="/walkthrough"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            textDecoration: 'none',
            color: 'var(--text-muted)',
            fontSize: 12,
          }}
        >
          <BookOpen size={13} />
          All Chapters
        </Link>

        {nextChapter ? (
          <Link
            to={`/walkthrough/${nextChapter.n}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--bg-card)',
              border: `1px solid ${nextChapter.accentBorder}`,
              borderRadius: 10,
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              flex: 1,
            }}
          >
            <span style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>Next</span>
              {nextChapter.title}
            </span>
            <ArrowRight size={15} />
          </Link>
        ) : (
          <div style={{ flex: 1 }} />
        )}
      </div>
    </div>
  )
}
