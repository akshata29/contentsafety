import { useState } from 'react'
import {
  Lock, Shield, Users, BarChart2, Zap, Globe, BookOpen,
  Tag, Activity, Cpu, ChevronDown, ChevronUp, CircleCheck,
  AlertTriangle, TrendingUp, FileText, Search,
} from 'lucide-react'

// ── Agent definitions ─────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'trc',
    name: 'Trade Research Copilot',
    category: 'Trading',
    platform: 'Azure AI Foundry',
    model: 'gpt-4o',
    status: 'Active',
    health: 0.97,
    role: 'Drafts equity and macro research notes for distribution to clients and internal desks.',
    systemPrompt: `You are a financial research assistant for a regulated capital markets firm.
Your role is to assist analysts in drafting research notes for equity and macro markets.
You MUST NOT reference any material non-public information (MNPI).
You MUST NOT recommend specific trades or predict short-term price movements with certainty.
All claims must be grounded in publicly available data or provided source documents.
Format: executive summary (3 sentences), detailed analysis, key risks, regulatory disclosures.
Regulatory context: MiFID II Article 20 (investment research), FINRA Rule 2210 (communications with the public).`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: true, customCategories: ['Insider Trading', 'Market Manipulation'],
    },
    riskLevel: 'High',
    controls: ['MiFID II Art. 20', 'FINRA Rule 2210', 'SEC Rule 17a-4'],
    tags: ['equities', 'research', 'client-facing', 'prod'],
  },
  {
    id: 'raa',
    name: 'Risk Assessment Agent',
    category: 'Risk & Compliance',
    platform: 'Semantic Kernel',
    model: 'gpt-4o',
    status: 'Active',
    health: 0.94,
    role: 'Evaluates counterparty, market, and credit risk for proposed trading positions.',
    systemPrompt: `You are a risk assessment AI for a global investment bank.
Your role is to evaluate counterparty, market, and credit risk for proposed positions.
You have access to real-time risk metrics, VaR calculations, and counterparty exposure tables.
You MUST flag any position that exceeds the firm's risk appetite thresholds before approving.
You MUST NOT approve trades that would breach regulatory capital requirements (Basel III).
You do NOT execute trades. Your output is a structured risk report with APPROVED/REVIEW/REJECT recommendation.
Regulatory context: Basel III (capital adequacy), EMIR (derivatives reporting), Dodd-Frank.`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: false, customCategories: ['Front Running'],
    },
    riskLevel: 'High',
    controls: ['Basel III', 'EMIR', 'Dodd-Frank Title VII'],
    tags: ['risk', 'internal-only', 'prod'],
  },
  {
    id: 'po',
    name: 'Portfolio Optimizer',
    category: 'Trading',
    platform: 'Azure AI Foundry',
    model: 'o1-preview',
    status: 'Active',
    health: 0.89,
    role: 'Suggests portfolio rebalancing recommendations based on client objectives and constraints.',
    systemPrompt: `You are a portfolio optimization assistant for a discretionary asset manager.
You receive client portfolio data, target allocation preferences, and market data.
Your role is to suggest rebalancing recommendations that align with the client's stated risk tolerance and investment objectives.
You MUST NOT execute trades. Output is advisory recommendations only.
You MUST cite the data source for every recommendation.
You MUST disclose that recommendations are not investment advice.
Regulatory context: MiFID II RTS 28 (best execution), UCITS (fund constraints), FCA COBS 9A (suitability).`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: true, customCategories: ['Market Manipulation'],
    },
    riskLevel: 'High',
    controls: ['MiFID II RTS 28', 'UCITS', 'FCA COBS 9A'],
    tags: ['equities', 'fixed-income', 'advisory', 'prod'],
  },
  {
    id: 'cm',
    name: 'Compliance Monitor',
    category: 'Risk & Compliance',
    platform: 'Azure AI Foundry',
    model: 'gpt-4o',
    status: 'Active',
    health: 0.99,
    role: 'Continuously screens AI-generated communications and outputs for compliance violations.',
    systemPrompt: `You are a compliance monitoring AI for a regulated financial institution.
Your role is to screen AI-generated communications against the firm's compliance policies.
You must flag: MNPI references, market manipulation language, jailbreak patterns, PII leakage, 
  out-of-scope tool calls, ungrounded claims, and sanctions violations.
You return a structured compliance verdict: PASS / REVIEW / BLOCK with the specific rule triggered.
You have no ability to approve content — your REVIEW and BLOCK verdicts require human sign-off.
Regulatory context: FINRA Rule 3110 (supervision), MiFID II Art. 16 (organisational requirements), SEC 17 CFR 240.17a-4.`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: true, customCategories: ['Insider Trading', 'Market Manipulation', 'Front Running'],
    },
    riskLevel: 'Critical',
    controls: ['FINRA Rule 3110', 'MiFID II Art. 16', 'SEC 17 CFR 240.17a-4'],
    tags: ['compliance', 'internal-only', 'prod'],
  },
  {
    id: 'cab',
    name: 'Client Advisory Bot',
    category: 'Research & Advisory',
    platform: 'LangChain',
    model: 'gpt-4o-mini',
    status: 'Active',
    health: 0.92,
    role: 'Provides retail and HNW clients with portfolio summaries, market commentary, and FAQ responses.',
    systemPrompt: `You are a client-facing advisory assistant for wealth management clients.
You assist clients with portfolio summaries, market commentary, and product FAQs.
You MUST NOT provide personalised investment advice or specific trade recommendations.
You MUST include regulatory disclaimers on all market commentary.
You MUST NOT reference specific securities with buy/sell recommendations.
If a client asks to execute a trade, redirect them to their assigned relationship manager.
All responses must be in plain English, avoiding jargon.
Regulatory context: FCA COBS 4 (communicating with clients), MiFID II Art. 25 (suitability), GDPR (data minimisation).`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: false, customCategories: ['Market Manipulation'],
    },
    riskLevel: 'Medium',
    controls: ['FCA COBS 4', 'MiFID II Art. 25', 'GDPR Art. 5'],
    tags: ['client-facing', 'retail', 'hnw', 'prod'],
  },
  {
    id: 'mia',
    name: 'Market Intelligence Agent',
    category: 'Research & Advisory',
    platform: 'AutoGen',
    model: 'gpt-4o',
    status: 'Active',
    health: 0.95,
    role: 'Aggregates and summarises market news, earnings releases, and regulatory filings for internal distribution.',
    systemPrompt: `You are a market intelligence aggregation agent for a capital markets firm.
You summarise publicly available market news, earnings releases, central bank filings, and regulatory announcements.
All sources must be cited with a URL or publication reference.
You MUST NOT speculate on non-public events or reference MNPI.
Distribute internal summaries only — these are not for external distribution without compliance review.
Regulatory context: EU MAR (market abuse regulation), SEC Regulation FD (fair disclosure).`,
    guardrails: {
      contentFilter: true, promptShield: false, abuseMonitoring: true,
      groundedness: true, customCategories: ['Insider Trading'],
    },
    riskLevel: 'Medium',
    controls: ['EU MAR', 'SEC Regulation FD'],
    tags: ['research', 'internal-only', 'dev'],
  },
  {
    id: 'rsa',
    name: 'Regulatory Screening Agent',
    category: 'Risk & Compliance',
    platform: 'Azure AI Foundry',
    model: 'gpt-4o',
    status: 'Active',
    health: 0.98,
    role: 'Screens new products, strategies, and client onboarding documents against current regulatory requirements.',
    systemPrompt: `You are a regulatory screening AI for a global financial institution.
You screen new products, strategies, client onboarding documents, and proposed transactions against regulatory requirements.
You must check against: FATF AML guidelines, OFAC sanctions lists, PEP screening requirements, MiFID II product governance, and EMIR clearing obligations.
Output: structured screening report with CLEAR / ESCALATE / REJECT recommendation.
You DO NOT make final decisions — escalated and rejected items require human review.
Regulatory context: FATF Recommendation 10, OFAC SDN list, MiFID II Art. 24 (inducements), KYC/AML.`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: true, customCategories: ['Insider Trading', 'Market Manipulation', 'Front Running'],
    },
    riskLevel: 'Critical',
    controls: ['FATF Rec. 10', 'OFAC', 'MiFID II Art. 24', 'AML Directive'],
    tags: ['compliance', 'kyc', 'internal-only', 'prod'],
  },
  {
    id: 'fia',
    name: 'Fixed Income Analyst',
    category: 'Research & Advisory',
    platform: 'Semantic Kernel',
    model: 'gpt-4o-mini',
    status: 'Active',
    health: 0.91,
    role: 'Analyses bond markets, yield curves, credit spreads, and central bank policy for internal research distribution.',
    systemPrompt: `You are a fixed income research analyst AI for an institutional asset manager.
You analyse government bond markets, corporate credit spreads, yield curve dynamics, and central bank policy decisions.
Every statistical claim must reference a specific data source with date.
You MUST NOT publish predictions as certainties — frame all views as probabilistic scenarios.
Internal distribution only — output requires compliance review before external publication.
Regulatory context: MiFID II Article 20 (investment research), ESMA Guidelines on investment research.`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: true, customCategories: ['Market Manipulation'],
    },
    riskLevel: 'Medium',
    controls: ['MiFID II Art. 20', 'ESMA Investment Research Guidelines'],
    tags: ['fixed-income', 'research', 'internal-only', 'dev'],
  },
  {
    id: 'erb',
    name: 'Equity Research Bot',
    category: 'Research & Advisory',
    platform: 'AutoGen',
    model: 'gpt-4o',
    status: 'Active',
    health: 0.96,
    role: 'Generates structured equity research reports including fundamental analysis, valuation models, and risk factors.',
    systemPrompt: `You are an equity research AI for a sell-side investment bank.
You generate structured equity research including fundamental analysis, DCF valuation support, peer comparisons, and risk factor identification.
All valuations must be grounded in provided financial data — you cannot fabricate financial metrics.
You MUST include a conflicts-of-interest disclosure in every report.
Reports are for institutional clients only — not retail distribution without MiFID II inducements review.
Regulatory context: MiFID II Art. 20 (investment research), FINRA Rule 2241 (research analyst conflict disclosure).`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: true, customCategories: ['Insider Trading', 'Market Manipulation'],
    },
    riskLevel: 'High',
    controls: ['MiFID II Art. 20', 'FINRA Rule 2241'],
    tags: ['equities', 'research', 'institutional', 'prod'],
  },
  {
    id: 'dpa',
    name: 'Derivatives Pricing Agent',
    category: 'Trading',
    platform: 'Custom',
    model: 'Phi-4',
    status: 'Active',
    health: 0.88,
    role: 'Provides indicative pricing and Greeks for OTC derivatives based on market data inputs.',
    systemPrompt: `You are a derivatives pricing assistant for an OTC derivatives desk.
You provide indicative pricing and risk sensitivities (Greeks) for vanilla and exotic OTC derivatives.
All pricing is indicative only — not a binding quote or executable price.
You require: underlying price, volatility surface, interest rate inputs, notional, maturity, and trade type.
You MUST clearly state "INDICATIVE ONLY — NOT A BINDING QUOTE" on every output.
You do NOT book trades or communicate with external counterparties.
Regulatory context: EMIR (reporting obligations), Dodd-Frank Title VII (swap reporting), ISDA documentation requirements.`,
    guardrails: {
      contentFilter: true, promptShield: true, abuseMonitoring: true,
      groundedness: false, customCategories: ['Market Manipulation', 'Front Running'],
    },
    riskLevel: 'High',
    controls: ['EMIR', 'Dodd-Frank Title VII', 'ISDA MA'],
    tags: ['derivatives', 'fx', 'internal-only', 'prod'],
  },
]

const CATEGORIES = ['All', 'Trading', 'Risk & Compliance', 'Research & Advisory']

const RISK_COLOR = {
  Critical: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  High:     { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  Medium:   { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  Low:      { text: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
}

const PLATFORM_COLOR = {
  'Azure AI Foundry': '#8b5cf6',
  'AutoGen': '#3b82f6',
  'Semantic Kernel': '#06b6d4',
  'LangChain': '#10b981',
  'Custom': '#f59e0b',
}

const GUARDRAIL_ICONS = {
  contentFilter: { label: 'Content Filter', Icon: Shield },
  promptShield: { label: 'Prompt Shield', Icon: Zap },
  abuseMonitoring: { label: 'Abuse Monitor', Icon: Activity },
  groundedness: { label: 'Groundedness',  Icon: BookOpen },
}

function HealthBar({ score }) {
  const color = score >= 0.9 ? 'var(--accent-green)' : score >= 0.7 ? 'var(--accent-amber)' : 'var(--accent-red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score * 100}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.65rem', color, fontFamily: 'var(--font-mono)' }}>{(score * 100).toFixed(0)}%</span>
    </div>
  )
}

function AgentCard({ agent, isSelected, onSelect }) {
  const rc = RISK_COLOR[agent.riskLevel]
  const pc = PLATFORM_COLOR[agent.platform] || 'var(--text-muted)'
  return (
    <button
      onClick={() => onSelect(agent)}
      style={{
        width: '100%', textAlign: 'left', padding: '0.85rem',
        border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border)'}`,
        background: isSelected ? 'rgba(59,130,246,0.07)' : 'var(--bg-card)',
        borderRadius: 'var(--radius)', cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{agent.name}</div>
          <div style={{ fontSize: '0.65rem', color: pc, marginTop: 2 }}>{agent.platform} &bull; {agent.model}</div>
        </div>
        <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4, background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
          {agent.riskLevel}
        </span>
      </div>
      <HealthBar score={agent.health} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
        {agent.tags.map(t => (
          <span key={t} style={{ fontSize: '0.58rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{t}</span>
        ))}
      </div>
    </button>
  )
}

function GuardrailRow({ id, enabled }) {
  const gd = GUARDRAIL_ICONS[id]
  if (!gd) return null
  const GIcon = gd.Icon
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
      <GIcon size={13} color={enabled ? 'var(--accent-green)' : 'var(--text-muted)'} />
      <span style={{ flex: 1, fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{gd.label}</span>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: enabled ? 'var(--accent-green)' : 'var(--accent-red)' }}>
        {enabled ? 'ENABLED' : 'DISABLED'}
      </span>
      <Lock size={11} color="var(--text-muted)" />
    </div>
  )
}

export default function SettingsPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [selected, setSelected] = useState(AGENTS[0])
  const [showPrompt, setShowPrompt] = useState(false)

  const visible = AGENTS.filter(a =>
    (catFilter === 'All' || a.category === catFilter) &&
    (search === '' || a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()))
  )

  // Stats
  const critical = AGENTS.filter(a => a.riskLevel === 'Critical').length
  const allGuardsOn = AGENTS.filter(a =>
    a.guardrails.contentFilter && a.guardrails.promptShield && a.guardrails.abuseMonitoring
  ).length
  const prodAgents = AGENTS.filter(a => a.tags.includes('prod')).length

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Agent Registry</h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Read-only inventory of all registered AI agents — system prompts, guardrail configurations, and regulatory controls.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Agents', value: AGENTS.length, color: 'var(--accent-blue)' },
          { label: 'Production', value: prodAgents, color: 'var(--accent-green)' },
          { label: 'Critical Risk', value: critical, color: 'var(--accent-red)' },
          { label: 'Full Guardrails', value: `${allGuardsOn}/${AGENTS.length}`, color: 'var(--accent-amber)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + category filter */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: '0.45rem', paddingBottom: '0.45rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.75rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: catFilter === cat ? 700 : 400, border: `1px solid ${catFilter === cat ? 'var(--accent-blue)' : 'var(--border)'}`, background: catFilter === cat ? 'rgba(59,130,246,0.1)' : 'transparent', color: catFilter === cat ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem' }}>

        {/* Agent list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 'calc(100vh - 330px)', overflowY: 'auto' }}>
          {visible.length === 0
            ? <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '1rem' }}>No agents match your filter.</div>
            : visible.map(a => (
              <AgentCard key={a.id} agent={a} isSelected={selected?.id === a.id} onSelect={setSelected} />
            ))
          }
        </div>

        {/* Detail panel */}
        {selected && (() => {
          const rc = RISK_COLOR[selected.riskLevel]
          const pc = PLATFORM_COLOR[selected.platform] || 'var(--text-muted)'
          return (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 'calc(100vh - 330px)', overflowY: 'auto' }}>

              {/* Agent header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{selected.name}</div>
                  <div style={{ fontSize: '0.72rem', color: pc }}>{selected.platform} &bull; {selected.model}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{selected.role}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 5, background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                    {selected.riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* Category + health */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>CATEGORY</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{selected.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>HEALTH</div>
                  <HealthBar score={selected.health} />
                </div>
              </div>

              {/* Guardrails */}
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  GUARDRAIL CONFIGURATION
                  <Lock size={10} style={{ marginLeft: 5, verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.58rem', fontWeight: 400, background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, padding: '0.1rem 0.35rem', marginLeft: 6 }}>READ-ONLY</span>
                </div>
                {Object.entries(selected.guardrails)
                  .filter(([k]) => k !== 'customCategories')
                  .map(([k, v]) => <GuardrailRow key={k} id={k} enabled={v} />)
                }
                {selected.guardrails.customCategories.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', marginTop: '0.1rem' }}>
                    <Tag size={13} color="var(--accent-purple)" />
                    <span style={{ flex: 1, fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Custom Categories</span>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {selected.guardrails.customCategories.map(c => (
                        <span key={c} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.25)' }}>{c}</span>
                      ))}
                    </div>
                    <Lock size={11} color="var(--text-muted)" />
                  </div>
                )}
              </div>

              {/* Regulatory controls */}
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>REGULATORY CONTROLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {selected.controls.map(ctrl => (
                    <span key={ctrl} style={{ fontSize: '0.67rem', padding: '0.2rem 0.5rem', borderRadius: 5, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.25)' }}>{ctrl}</span>
                  ))}
                </div>
              </div>

              {/* System prompt */}
              <div>
                <button
                  onClick={() => setShowPrompt(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>SYSTEM PROMPT</span>
                  <Lock size={10} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.58rem', fontWeight: 400, background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, padding: '0.1rem 0.35rem' }}>READ-ONLY</span>
                  {showPrompt ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
                </button>
                {showPrompt && (
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#c4b5fd', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', overflowX: 'auto', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {selected.systemPrompt}
                  </pre>
                )}
                {!showPrompt && (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Click to reveal system prompt...
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>TAGS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
