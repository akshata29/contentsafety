import { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

// ── Node type styles ─────────────────────────────────────────────────────────
const NODE_STYLE = {
  start:   { box: '#0e1e32', border: '#22d3ee', text: '#cffafe', sub: '#67e8f9',  dot: '#22d3ee', stroke: '#22d3ee' },
  service: { box: '#0d1b2e', border: '#3b82f6', text: '#dbeafe', sub: '#93c5fd',  dot: '#3b82f6', stroke: '#3b82f6' },
  agent:   { box: '#130d2b', border: '#8b5cf6', text: '#ede9fe', sub: '#c4b5fd',  dot: '#8b5cf6', stroke: '#8b5cf6' },
  gate:    { box: '#1e1007', border: '#f59e0b', text: '#fef3c7', sub: '#fbbf24',  dot: '#f59e0b', stroke: '#f59e0b' },
  store:   { box: '#0d1228', border: '#6366f1', text: '#e0e7ff', sub: '#a5b4fc',  dot: '#6366f1', stroke: '#6366f1' },
  outcome: { box: '#071a10', border: '#10b981', text: '#d1fae5', sub: '#6ee7b7',  dot: '#10b981', stroke: '#10b981' },
}

// ── Workflow definitions ─────────────────────────────────────────────────────
const WORKFLOWS = [
  {
    id: 'compliance',
    label: 'Compliance Pipeline',
    description: 'A single trader communication or AI-generated text is screened in parallel by 6-7 Azure AI safety services. Weighted verdicts are combined into a 0-100 risk score. Result: PASS (<30), REVIEW (30-69), or BLOCK (>=70). MiFID II Art. 16/25, FINRA 3110, and SEC 17a-4 aligned.',
    canvasH: 800,
    nodes: [
      {
        id: 'n_input', label: 'Input Content', sublabel: 'Trader message or AI output', type: 'start',
        x: 340, y: 20, w: 200, h: 50,
        detail: {
          badge: 'Entry Point',
          description: 'A trader communication, AI-generated research note, or agent output is submitted for compliance screening.',
          files: ['backend/routes/compliance_pipeline.py'],
          responsibilities: ['Accept PipelineRequest with text, optional grounding_source, optional query', 'Validate input via Pydantic PipelineRequest model', 'Reject empty text before dispatching any API calls'],
          technology: ['FastAPI', 'Pydantic 2.9'],
        },
      },
      {
        id: 'n_api', label: 'API Ingestion', sublabel: 'POST /api/compliance/pipeline', type: 'service',
        x: 340, y: 110, w: 200, h: 50,
        detail: {
          badge: 'Backend API',
          description: 'FastAPI route receives the pipeline request and kicks off the parallel coroutine execution.',
          files: ['backend/routes/compliance_pipeline.py'],
          responsibilities: ['Receive POST request at /api/compliance/pipeline', 'Build coroutine dict for each applicable check', 'Record wall-clock start time for total latency measurement', 'Return PipelineResponse with all check results and final verdict'],
          technology: ['FastAPI 0.115.4', 'asyncio'],
        },
      },
      // Parallel service nodes (row y=230)
      {
        id: 'n_text', label: 'Text Analysis', sublabel: 'weight=15', type: 'agent',
        x: 10, y: 230, w: 120, h: 50,
        detail: {
          badge: 'Weight: 15',
          description: 'Screens for Hate, Sexual, Violence, and SelfHarm harm categories plus custom blocklist matches.',
          files: ['backend/services/text_analysis.py'],
          responsibilities: ['Call ContentSafetyClient.analyze_text() via SDK', 'Check all 4 harm categories', 'Match against capital-markets-demo blocklist', 'Return flagged=True if severity >= 4 or blocklist match'],
          technology: ['azure-ai-contentsafety 1.0.0'],
        },
      },
      {
        id: 'n_shields', label: 'Prompt Shields', sublabel: 'weight=20', type: 'agent',
        x: 150, y: 230, w: 120, h: 50,
        detail: {
          badge: 'Weight: 20',
          description: 'Detects jailbreak attacks (User Prompt) and indirect prompt injections (XPIA via documents).',
          files: ['backend/services/prompt_shields.py'],
          responsibilities: ['POST to /contentsafety/text:shieldPrompt', 'Detect userPromptAnalysis.attackDetected', 'Detect documentsAnalysis[].attackDetected for XPIA', 'Return user_prompt_detected and documents_detected flags'],
          technology: ['httpx 0.27', 'Azure Content Safety REST 2024-02-15-preview'],
        },
      },
      {
        id: 'n_manip', label: 'Market Manip.', sublabel: 'weight=20', type: 'agent',
        x: 290, y: 230, w: 120, h: 50,
        detail: {
          badge: 'Weight: 20',
          description: 'Custom category: detects market manipulation language using the Content Safety Incidents API (incident: fin-market-manipulation).',
          files: ['backend/services/custom_categories.py'],
          responsibilities: ['POST to /contentsafety/text:detectIncidents with incidentName=fin-market-manipulation', 'Check for wash trading, spoofing, and pump-and-dump language', 'Return incidentDetected flag'],
          technology: ['httpx 0.27', 'Azure Content Safety Incidents API 2024-02-15-preview'],
        },
      },
      {
        id: 'n_insider', label: 'Insider Trading', sublabel: 'weight=20', type: 'agent',
        x: 430, y: 230, w: 120, h: 50,
        detail: {
          badge: 'Weight: 20',
          description: 'Custom category: detects MNPI-related language using incident fin-insider-trading.',
          files: ['backend/services/custom_categories.py'],
          responsibilities: ['POST to /contentsafety/text:detectIncidents with incidentName=fin-insider-trading', 'Detect references to non-public information, tip-offs, or pre-announcement trading', 'Return incidentDetected flag'],
          technology: ['httpx 0.27', 'Azure Content Safety Incidents API'],
        },
      },
      {
        id: 'n_front', label: 'Front Running', sublabel: 'weight=15', type: 'agent',
        x: 570, y: 230, w: 120, h: 50,
        detail: {
          badge: 'Weight: 15',
          description: 'Custom category: detects front-running language using incident fin-front-running.',
          files: ['backend/services/custom_categories.py'],
          responsibilities: ['POST to /contentsafety/text:detectIncidents with incidentName=fin-front-running', 'Detect trading ahead of client orders or proprietary use of order knowledge', 'Return incidentDetected flag'],
          technology: ['httpx 0.27', 'Azure Content Safety Incidents API'],
        },
      },
      {
        id: 'n_protected', label: 'Protected Material', sublabel: 'weight=10', type: 'agent',
        x: 710, y: 230, w: 120, h: 50,
        detail: {
          badge: 'Weight: 10',
          description: 'Detects copyrighted material (licensed analyst reports, Bloomberg data) in AI outputs.',
          files: ['backend/services/protected_material.py'],
          responsibilities: ['POST to Content Safety protected material endpoint', 'Detect verbatim reproduction of copyrighted text', 'Return protectedMaterialDetected and citationDetected flags'],
          technology: ['httpx 0.27', 'Azure Content Safety REST API'],
        },
      },
      // Optional groundedness node
      {
        id: 'n_ground', label: 'Groundedness', sublabel: 'weight=10 (optional)', type: 'agent',
        x: 340, y: 340, w: 200, h: 50,
        detail: {
          badge: 'Weight: 10 (optional)',
          description: 'Only runs when grounding_source is provided. Verifies AI text is grounded in the source document.',
          files: ['backend/services/groundedness.py'],
          responsibilities: ['Only executes if PipelineRequest.grounding_source is set', 'POST to /contentsafety/text:detectGroundedness', 'Return ungroundedDetected and ungroundedPercentage', 'Adds 10 to total_weight when active'],
          technology: ['httpx 0.27', 'Azure Content Safety REST API'],
        },
      },
      {
        id: 'n_agg', label: 'Risk Aggregator', sublabel: 'weighted score 0-100', type: 'service',
        x: 340, y: 440, w: 200, h: 50,
        detail: {
          badge: 'Orchestration',
          description: 'Combines all service verdicts using pre-defined weights into a single 0-100 risk score.',
          files: ['backend/routes/compliance_pipeline.py'],
          responsibilities: ['Sum weights of flagged services', 'Divide by total weight to get normalised score (0-100)', 'Attach per-service latency_ms to each result', 'Record filter event in analytics deque'],
          technology: ['Python 3.11', 'asyncio'],
        },
      },
      {
        id: 'n_gate', label: 'Compliance Gate', sublabel: 'PASS / REVIEW / BLOCK', type: 'gate',
        x: 340, y: 540, w: 200, h: 50,
        detail: {
          badge: 'Human-in-Loop Gate',
          description: 'Applies thresholds to the weighted risk score. REVIEW (30-69) requires a human compliance officer decision before content is routed. This gate satisfies MiFID II Art. 16 supervisory control requirements.',
          files: ['backend/routes/compliance_pipeline.py'],
          responsibilities: ['score < 30: PASS -- route content automatically', 'score 30-69: REVIEW -- escalate to human compliance officer', 'score >= 70: BLOCK -- reject content and log alert', 'Attach regulatory context (MiFID II, FINRA, SEC) to BLOCK/REVIEW verdicts'],
          technology: ['Python 3.11'],
        },
      },
      {
        id: 'n_pass', label: 'Compliant', sublabel: 'Route to client / system', type: 'outcome',
        x: 80, y: 650, w: 200, h: 50,
        detail: {
          badge: 'Outcome: Pass',
          description: 'Content passed all safety checks. Score < 30. Safe to route to client terminal, trading system, or distribution channel.',
          files: ['backend/routes/compliance_pipeline.py'],
          responsibilities: ['Return verdict=PASS in PipelineResponse', 'Include all per-service results for audit trail', 'Content may proceed to its intended destination'],
          technology: ['FastAPI', 'Pydantic 2.9'],
        },
      },
      {
        id: 'n_block', label: 'Blocked + Alert', sublabel: 'Score >= 70, escalated', type: 'outcome',
        x: 600, y: 650, w: 200, h: 50,
        detail: {
          badge: 'Outcome: Block',
          description: 'Content blocked. Score >= 70 OR REVIEW escalation. Alert raised, content quarantined. Regulatory record produced.',
          files: ['backend/routes/compliance_pipeline.py'],
          responsibilities: ['Return verdict=BLOCK or REVIEW in PipelineResponse', 'Include flagging services and per-service severity', 'Event recorded to filter analytics deque', 'Regulatory context (MiFID II Art. 16) attached to response'],
          technology: ['FastAPI', 'Pydantic 2.9'],
        },
      },
      {
        id: 'n_audit', label: 'Audit Record', sublabel: 'timestamp + weighted breakdown', type: 'store',
        x: 340, y: 745, w: 200, h: 50,
        detail: {
          badge: 'Data Store',
          description: 'Every pipeline execution produces a timestamped audit record with per-service latency, verdict, and weighted score breakdown — ready for SEC 17a-4 electronic record-keeping.',
          files: ['backend/services/content_filters.py'],
          responsibilities: ['PipelineResponse contains full structured JSON audit data', 'record_filter_event() writes to in-memory _FILTER_EVENTS deque', '_FILTER_EVENTS deque maxlen=1000, thread-safe with Lock', 'Frontend Filter Analytics page queries /api/content-filters/analytics'],
          technology: ['Python collections.deque', 'threading.Lock'],
        },
      },
    ],
    edges: [
      { from: 'n_input',    to: 'n_api' },
      // Fan out to 6 parallel services
      { from: 'n_api', to: 'n_text',      toFx: -280 },
      { from: 'n_api', to: 'n_shields',   toFx: -140 },
      { from: 'n_api', to: 'n_manip',     toFx: 0 },
      { from: 'n_api', to: 'n_insider',   toFx: 140 },
      { from: 'n_api', to: 'n_front',     toFx: 280 },
      { from: 'n_api', to: 'n_protected', toFx: 420 },
      // Fan in from parallel services to aggregator
      { from: 'n_text',      to: 'n_agg', fromFx: -280 },
      { from: 'n_shields',   to: 'n_agg', fromFx: -140 },
      { from: 'n_manip',     to: 'n_agg', fromFx: 0 },
      { from: 'n_insider',   to: 'n_agg', fromFx: 140 },
      { from: 'n_front',     to: 'n_agg', fromFx: 280 },
      { from: 'n_protected', to: 'n_agg', fromFx: 420 },
      // Groundedness optional path
      { from: 'n_api', to: 'n_ground', dashed: true, fromFx: 100, toFx: 100 },
      { from: 'n_ground', to: 'n_agg', dashed: true, fromFx: 100, toFx: 100 },
      // Main flow
      { from: 'n_agg',   to: 'n_gate' },
      { from: 'n_gate',  to: 'n_pass',  toFx: -250 },
      { from: 'n_gate',  to: 'n_block', toFx: 250 },
      { from: 'n_pass',  to: 'n_audit', fromFx: -150 },
      { from: 'n_block', to: 'n_audit', fromFx: 250 },
    ],
  },
  {
    id: 'filter_test',
    label: 'Content Filter Test',
    description: 'An engineer selects a pre-built capital markets attack scenario, chooses a guardrail configuration, and invokes a Foundry model or agent through the guardrail. The result is recorded to the filter analytics event store. Used to validate guardrail coverage before production deployment.',
    canvasH: 680,
    nodes: [
      {
        id: 'ft_start', label: 'Select Scenario', sublabel: 'Pre-built attack scenarios', type: 'start',
        x: 340, y: 20, w: 200, h: 50,
        detail: {
          badge: 'Entry Point',
          description: 'Engineer selects one of 7 pre-built capital markets scenarios: clean baseline, jailbreak, market manipulation, MNPI/insider trading, XPIA, violence/threat, or CTR structuring.',
          files: ['backend/routes/content_filters.py'],
          responsibilities: ['7 MODEL_SCENARIOS defined with id, label, category, system_prompt, message, expected verdict', 'GET /api/content-filters/scenarios returns scenario list', 'Each scenario includes a system_prompt representing the governed AI agent'],
          technology: ['FastAPI', 'Python 3.11'],
        },
      },
      {
        id: 'ft_guardrail', label: 'Guardrail Selection', sublabel: 'Permissive / Standard / Strict', type: 'service',
        x: 340, y: 115, w: 200, h: 50,
        detail: {
          badge: 'Guardrail Config',
          description: 'Engineer selects the guardrail profile to apply: Permissive (warn-only), Standard (block high severity), or Strict (block medium+ severity).',
          files: ['backend/services/content_filters.py', 'backend/routes/content_filters.py'],
          responsibilities: ['GET /api/content-filters/guardrails lists available profiles', 'Guardrail profiles backed by Foundry data-plane API or demo config', 'Selected guardrail ID included in subsequent model/agent test request'],
          technology: ['httpx 0.27', 'Azure AI Foundry API 2025-05-15-preview'],
        },
      },
      {
        id: 'ft_auth', label: 'ML Bearer Token', sublabel: 'https://ai.azure.com/.default', type: 'service',
        x: 340, y: 210, w: 200, h: 50,
        detail: {
          badge: 'Auth',
          description: 'Service principal OAuth 2.0 token exchange for the AI ML scope, required by all Foundry data-plane calls.',
          files: ['backend/services/content_filters.py'],
          responsibilities: ['POST to /oauth2/v2.0/token with scope=https://ai.azure.com/.default', 'client_credentials flow with AZURE_CLIENT_ID + AZURE_CLIENT_SECRET', 'Token used as Bearer in Foundry data-plane Authorization header', 'Falls back to demo mode if credentials not configured'],
          technology: ['httpx 0.27', 'OAuth 2.0 client_credentials'],
        },
      },
      {
        id: 'ft_model', label: 'Model Invocation', sublabel: 'Foundry /chat/completions', type: 'agent',
        x: 160, y: 310, w: 180, h: 50,
        detail: {
          badge: 'Model Test',
          description: 'Calls the Foundry deployment chat completions endpoint with the scenario message and system prompt under the selected guardrail configuration.',
          files: ['backend/services/content_filters.py'],
          responsibilities: ['POST to Foundry project /deployments/{name}/chat/completions', 'x-guardrail header carries the selected guardrail profile ID', 'System prompt and user message from the selected scenario', 'Response includes guardrail_result block when a filter triggers'],
          technology: ['httpx 0.27', 'Azure AI Foundry Model Inference API'],
        },
      },
      {
        id: 'ft_agent', label: 'Agent Invocation', sublabel: 'Foundry Threads API', type: 'agent',
        x: 540, y: 310, w: 180, h: 50,
        detail: {
          badge: 'Agent Test',
          description: 'Creates a Foundry thread, posts the scenario message, runs the agent, and polls for completion.',
          files: ['backend/services/content_filters.py'],
          responsibilities: ['POST /threads to create a new thread', 'POST /threads/{id}/messages with scenario message', 'POST /threads/{id}/runs to invoke the agent', 'Poll /threads/{id}/runs/{run_id} until terminal state'],
          technology: ['httpx 0.27', 'Azure AI Foundry Threads API 2025-01-01-preview'],
        },
      },
      {
        id: 'ft_result', label: 'Response Analysis', sublabel: 'Block / Pass verdict', type: 'service',
        x: 340, y: 420, w: 200, h: 50,
        detail: {
          badge: 'Analysis',
          description: 'Parses the model/agent response to extract guardrail enforcement action: whether the content was blocked, flagged, or allowed through.',
          files: ['backend/services/content_filters.py'],
          responsibilities: ['Parse response body for guardrail_result.action (block / warn / pass)', 'Extract blocked_by category and severity from guardrail metadata', 'Build ModelFilterTestResponse / AgentFilterTestResponse with expected vs. actual verdict'],
          technology: ['Python 3.11', 'JSON parsing'],
        },
      },
      {
        id: 'ft_record', label: 'Event Recorder', sublabel: '_FILTER_EVENTS deque', type: 'service',
        x: 340, y: 515, w: 200, h: 50,
        detail: {
          badge: 'Analytics',
          description: 'Writes the test result as a structured filter event to the in-memory event store, which powers the Filter Analytics dashboard.',
          files: ['backend/services/content_filters.py'],
          responsibilities: ['Call record_filter_event(entity, entity_type, guardrail, category, severity, action, preview)', 'Thread-safe write to collections.deque maxlen=1000', 'Event includes timestamp, entity name, guardrail used, category, severity, action', 'GET /api/content-filters/analytics queries this store for dashboard charts'],
          technology: ['Python collections.deque', 'threading.Lock'],
        },
      },
      {
        id: 'ft_analytics', label: 'Filter Analytics', sublabel: 'In-memory event store', type: 'store',
        x: 340, y: 610, w: 200, h: 50,
        detail: {
          badge: 'Data Store',
          description: 'In-memory deque of up to 1000 filter events, queryable for block rate, category breakdown, entity heatmap, and time-series charts.',
          files: ['backend/services/content_filters.py', 'backend/routes/content_filters.py'],
          responsibilities: ['Stores events from model tests, agent tests, and compliance pipeline runs', 'GET /api/content-filters/analytics computes block rate per category and entity', 'Events reset on process restart (demo tool -- not production persistent store)', 'Accessed by Filter Analytics frontend page'],
          technology: ['Python collections.deque', 'threading.Lock', 'FastAPI'],
        },
      },
    ],
    edges: [
      { from: 'ft_start',    to: 'ft_guardrail' },
      { from: 'ft_guardrail', to: 'ft_auth' },
      { from: 'ft_auth',     to: 'ft_model',   toFx: -130 },
      { from: 'ft_auth',     to: 'ft_agent',   toFx: 130 },
      { from: 'ft_model',    to: 'ft_result',  fromFx: -130 },
      { from: 'ft_agent',    to: 'ft_result',  fromFx: 130 },
      { from: 'ft_result',   to: 'ft_record' },
      { from: 'ft_record',   to: 'ft_analytics' },
    ],
  },
]

// ── SVG canvas utilities ─────────────────────────────────────────────────────
function nodeCx(node) { return node.x + node.w / 2 }
function nodeCy(node) { return node.y + node.h / 2 }

function buildPath(from, to, fxOff, txOff) {
  const fx = nodeCx(from) + (fxOff || 0)
  const fy = from.y + from.h
  const tx = nodeCx(to) + (txOff || 0)
  const ty = to.y
  const mid = (fy + ty) / 2
  return `M ${fx},${fy} C ${fx},${mid} ${tx},${mid} ${tx},${ty}`
}

function Arrowhead({ x, y, color }) {
  return (
    <polygon
      points={`${x},${y} ${x - 5},${y - 8} ${x + 5},${y - 8}`}
      fill={color}
    />
  )
}

// ── WorkflowNode (foreignObject) ─────────────────────────────────────────────
function WorkflowNode({ node, selected, onSelect }) {
  const s = NODE_STYLE[node.type] || NODE_STYLE.service
  const isSelected = selected === node.id
  return (
    <foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        style={{
          width: '100%', height: '100%',
          background: s.box,
          border: `1px solid ${isSelected ? s.border : s.border + '88'}`,
          borderTop: `2px solid ${s.border}`,
          borderRadius: 8,
          padding: '4px 10px',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          transition: 'all 0.15s',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: s.text, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.label}
        </div>
        {node.sublabel && (
          <div style={{ fontSize: '0.6rem', color: s.sub, lineHeight: 1.3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.sublabel}
          </div>
        )}
      </div>
    </foreignObject>
  )
}

// ── Detail panel ─────────────────────────────────────────────────────────────
function NodeDetail({ node, onClose }) {
  if (!node) return null
  const s = NODE_STYLE[node.type] || NODE_STYLE.service
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
      overflowY: 'auto', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: `${s.box}dd` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: s.dot, background: `${s.border}22`, padding: '2px 7px', borderRadius: 20 }}>
              {node.detail.badge}
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: s.text, marginTop: 4 }}>{node.label}</div>
            {node.sublabel && <div style={{ fontSize: '0.7rem', color: s.sub }}>{node.sublabel}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
        <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{node.detail.description}</p>

        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RESPONSIBILITIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {node.detail.responsibilities.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: s.dot, flexShrink: 0, marginTop: 6, width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SOURCE FILES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {node.detail.files.map((f, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: '#7dd3fc', background: 'rgba(125,211,252,0.06)', padding: '2px 8px', borderRadius: 4 }}>{f}</div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TECHNOLOGY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {node.detail.technology.map((t, i) => (
              <span key={i} style={{ fontSize: '0.65rem', color: s.sub, background: `${s.border}22`, padding: '2px 9px', borderRadius: 20, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  const types = [
    { type: 'start',   label: 'Entry Point' },
    { type: 'service', label: 'Service / API' },
    { type: 'agent',   label: 'AI Service' },
    { type: 'gate',    label: 'Human Gate' },
    { type: 'store',   label: 'Data Store' },
    { type: 'outcome', label: 'Outcome' },
  ]
  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
      {types.map(({ type, label }) => {
        const s = NODE_STYLE[type]
        return (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.dot, display: 'inline-block' }} />
            {label}
          </div>
        )
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
        <svg width="20" height="10"><line x1="0" y1="5" x2="14" y2="5" stroke="#666" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
        Optional path
      </div>
    </div>
  )
}

// ── WorkflowCanvas ────────────────────────────────────────────────────────────
function WorkflowCanvas({ workflow, selected, onSelect }) {
  const nodeMap = Object.fromEntries(workflow.nodes.map(n => [n.id, n]))
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="880" height={workflow.canvasH} style={{ display: 'block' }}>
        {/* Edges */}
        {workflow.edges.map((e, i) => {
          const from = nodeMap[e.from]
          const to = nodeMap[e.to]
          if (!from || !to) return null
          const d = buildPath(from, to, e.fromFx, e.toFx)
          const toS = NODE_STYLE[to.type] || NODE_STYLE.service
          const tx = nodeCx(to) + (e.toFx || 0)
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={e.dashed ? '#4b5a6e' : '#334155'}
                strokeWidth={e.dashed ? 1.5 : 1.5}
                strokeDasharray={e.dashed ? '6 3' : undefined}
              />
              <Arrowhead x={tx} y={to.y} color={e.dashed ? '#4b5a6e' : toS.stroke} />
            </g>
          )
        })}

        {/* Nodes */}
        {workflow.nodes.map(node => (
          <WorkflowNode key={node.id} node={node} selected={selected} onSelect={onSelect} />
        ))}
      </svg>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState(WORKFLOWS[0].id)
  const [selected, setSelected] = useState(null)

  const workflow = WORKFLOWS.find(w => w.id === activeTab)
  const allNodes = WORKFLOWS.flatMap(w => w.nodes)
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n]))
  const selectedNode = selected ? nodeMap[selected] : null

  const handleTabChange = (id) => {
    setActiveTab(id)
    setSelected(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg-base)' }}>
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', paddingRight: selectedNode ? '420px' : '1.5rem', transition: 'padding-right 0.2s ease' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Workflow</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Step-by-step data flows for each major platform workflow. Click any node for details.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {WORKFLOWS.map(w => (
            <button
              key={w.id}
              onClick={() => handleTabChange(w.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${activeTab === w.id ? 'var(--accent-blue)' : 'var(--border)'}`,
                background: activeTab === w.id ? 'rgba(59,130,246,0.12)' : 'var(--bg-surface)',
                color: activeTab === w.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          {workflow.description}
        </p>

        <Legend />

        {/* Canvas */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-surface)', padding: '1rem', overflowX: 'auto' }}>
          <WorkflowCanvas workflow={workflow} selected={selected} onSelect={setSelected} />
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>{workflow.nodes.length}</strong> nodes</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{workflow.edges.length}</strong> edges</span>
          <span><strong style={{ color: '#f59e0b' }}>{workflow.nodes.filter(n => n.type === 'gate').length}</strong> human gates</span>
          <span><strong style={{ color: '#10b981' }}>{workflow.nodes.filter(n => n.type === 'outcome').length}</strong> outcomes</span>
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && <NodeDetail node={selectedNode} onClose={() => setSelected(null)} />}
    </div>
  )
}
