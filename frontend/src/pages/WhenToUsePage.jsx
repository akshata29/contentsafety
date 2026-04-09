import { useState } from 'react'
import {
  ShieldCheck, Shield, ChevronRight, AlertTriangle, Layers,
  GitBranch, Globe, Lock, BarChart2, Cpu, Users, Database,
  AlertOctagon, BookOpen, Settings, CheckCircle, X,
  Code, MessageSquare, TrendingUp, Award, Target, Zap,
  FileWarning, Compass, Scale, Info, Activity, Server, ExternalLink,
} from 'lucide-react'

// â”€â”€ Color tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C_BLUE   = { text: '#3b82f6', border: 'rgba(59,130,246,0.35)',  bg: 'rgba(59,130,246,0.07)',  badge: 'rgba(59,130,246,0.20)',  badgeText: '#93c5fd',  dot: '#3b82f6'  }
const C_AMBER  = { text: '#f59e0b', border: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.07)',  badge: 'rgba(245,158,11,0.20)',  badgeText: '#fcd34d',  dot: '#f59e0b' }
const C_GREEN  = { text: '#10b981', border: 'rgba(16,185,129,0.35)',  bg: 'rgba(16,185,129,0.07)',  badge: 'rgba(16,185,129,0.20)',  badgeText: '#6ee7b7',  dot: '#10b981' }
const C_PURPLE = { text: '#8b5cf6', border: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.07)', badge: 'rgba(139,92,246,0.20)', badgeText: '#c4b5fd', dot: '#8b5cf6' }
const C_CYAN   = { text: '#06b6d4', border: 'rgba(6,182,212,0.35)',   bg: 'rgba(6,182,212,0.07)',   badge: 'rgba(6,182,212,0.20)',   badgeText: '#67e8f9',  dot: '#06b6d4'  }
const C_RED    = { text: '#ef4444', border: 'rgba(239,68,68,0.35)',   bg: 'rgba(239,68,68,0.07)',   badge: 'rgba(239,68,68,0.20)',   badgeText: '#fca5a5',  dot: '#ef4444'  }

// â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS = [
  { id: 'overview',    label: 'Overview'        },
  { id: 'decision',    label: 'Decision Guide'  },
  { id: 'scenarios',   label: 'Scenarios'       },
  { id: 'patterns',    label: 'Arch. Patterns'  },
  { id: 'practices',   label: 'Best Practices'  },
  { id: 'customer',    label: 'Customer Guide'  },
  { id: 'references',  label: 'References'      },
]

// â”€â”€ Overview data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COMPARISON_ROWS = [
  { label: 'Integration model',  cs: 'Explicit API call from your code',          cf: 'Attached to model deployment, auto-enforced'  },
  { label: 'Works with',         cs: 'Any AI model or non-AI pipeline',            cf: 'Azure OpenAI & AI Foundry only'               },
  { label: 'Developer effort',   cs: 'Code integration required',                  cf: 'Near-zero code; configure in portal or SDK'   },
  { label: 'Enforcement',        cs: 'App-layer (app can skip if coded wrong)',    cf: 'Platform-layer (cannot be bypassed by app)'   },
  { label: 'Latency impact',     cs: 'Extra network round-trip (~80-250ms)',       cf: 'Inline with model inference, minimal overhead'},
  { label: 'Pricing',            cs: 'Per-transaction pricing per capability',     cf: 'Included with Azure OpenAI pricing'           },
  { label: 'Audit / raw scores', cs: 'Full severity scores per category',         cf: 'Block/allow verdicts only (no raw scores)'    },
  { label: 'Unique capabilities',cs: 'PII detection, Groundedness, Custom Categories, Blocklists, Image Analysis', cf: 'Standard harm categories, Jailbreak (via Prompt Shields add-on)' },
  { label: 'Custom thresholds',  cs: 'Per-call threshold control',                cf: 'Policy-level thresholds (same for all calls)' },
  { label: 'Screen non-AI content', cs: 'Yes - documents, user uploads, images',  cf: 'No - only LLM request/response traffic'       },
]

const CS_STRENGTHS = [
  'Platform-agnostic: works with OpenAI, Anthropic, Llama, or no LLM at all',
  'Full audit trail with raw severity scores for each harm category',
  'Unique APIs: Groundedness Detection, PII redaction, Custom Categories',
  'Pre-screen inputs before expensive model calls to save cost',
  'Custom blocklists and domain-specific incident categories',
  'Screen documents, images, and tool outputs in agent pipelines',
  'Per-request threshold control for fine-grained policy enforcement',
  'Provable, deterministic safety checks for regulatory evidence',
]

const CF_STRENGTHS = [
  'Zero-code deployment: attach a policy to a model deployment in minutes',
  'Platform-enforced: the model refuses harmful content regardless of app code',
  'No additional network latency beyond the inference call itself',
  'No per-call cost: safety is bundled into Azure OpenAI pricing',
  'Covers every API caller uniformly in multi-tenant apps',
  'Jailbreak and indirect injection detection (with add-on policy)',
  'Protected material and copyrighted content detection at model layer',
  'Ideal for standardising safety across large engineering teams',
]

// â”€â”€ Decision Guide data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DECISION_CRITERIA = [
  {
    question: 'Are you using Azure OpenAI or AI Foundry exclusively?',
    ifYes: { label: 'Content Filters', c: C_AMBER, note: 'Content Filters cover you at the platform layer with zero code.' },
    ifNo:  { label: 'Content Safety API', c: C_BLUE,  note: 'Only Content Safety API works across non-Azure models.' },
  },
  {
    question: 'Do you need to screen user-uploaded documents or images?',
    ifYes: { label: 'Content Safety API', c: C_BLUE,  note: 'Filters only apply to LLM traffic. For file/image ingestion, use CS API.' },
    ifNo:  { label: 'Either', c: C_GREEN, note: 'Both options cover text-based LLM scenarios.' },
  },
  {
    question: 'Do regulations require documented, per-request audit trails with severity scores?',
    ifYes: { label: 'Content Safety API', c: C_BLUE,  note: 'CS API returns numeric severity (0-6) per harm category for audit logging.' },
    ifNo:  { label: 'Either', c: C_GREEN, note: 'Both provide block/allow decisions adequate for general logging.' },
  },
  {
    question: 'Do you have domain-specific risks (market manipulation, medical misinformation, fraud)?',
    ifYes: { label: 'Content Safety API', c: C_BLUE,  note: 'Custom Categories and Incidents API let you define domain-specific harm classifiers.' },
    ifNo:  { label: 'Content Filters', c: C_AMBER, note: 'Standard harm categories in Content Filters cover most general-purpose risks.' },
  },
  {
    question: 'Is this a high-risk regulated application (finance, healthcare, legal)?',
    ifYes: { label: 'Both layers', c: C_PURPLE, note: 'Defense-in-depth: Content Filters as a baseline + CS API for custom checks and audit.' },
    ifNo:  { label: 'Content Filters', c: C_AMBER, note: 'Filters alone are appropriate for standard commercial applications.' },
  },
  {
    question: 'Are agentic workflows involved with tool calls or external document retrieval?',
    ifYes: { label: 'Both layers', c: C_PURPLE, note: 'Filters protect the LLM backbone; CS API screens tool outputs and documents for XPIA.' },
    ifNo:  { label: 'Content Filters', c: C_AMBER, note: 'Simple chat/completion scenarios are well-served by Filters alone.' },
  },
  {
    question: 'Are you mixing open-source or fine-tuned models with Azure OpenAI?',
    ifYes: { label: 'Content Safety API', c: C_BLUE,  note: 'CS API is the only option that applies uniformly across all model providers.' },
    ifNo:  { label: 'Either', c: C_GREEN, note: 'All-Azure deployments can leverage both options.' },
  },
  {
    question: 'Do you need PII detection or redaction in outputs?',
    ifYes: { label: 'Content Safety API', c: C_BLUE,  note: 'Content Filters do not offer PII detection. Use the CS API PII endpoint.' },
    ifNo:  { label: 'Either', c: C_GREEN, note: 'Standard harm detection is available in both.' },
  },
]

// â”€â”€ Scenario data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SCENARIOS = [
  {
    title: 'Enterprise GPT-4o Customer Chatbot',
    icon: MessageSquare,
    industry: 'Retail / General',
    risk: 'Medium',
    riskColor: C_AMBER,
    recommendation: 'Content Filters',
    recColor: C_AMBER,
    rationale: 'A single Azure OpenAI model serves all conversations. Content Filters block hate, violence, and jailbreaks at the platform layer. Add Groundedness CS API call on RAG responses to prevent hallucinations from reaching customers.',
    keyServices: ['Content Filters (Hate, Violence, Sexual, Self-Harm)', 'Content Safety API - Groundedness (for RAG)'],
    pitfall: 'Relying on prompt engineering alone for safety is insufficient. Always enable platform filters.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter', label: 'Content Filters' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness', label: 'Groundedness' },
    ],
  },
  {
    title: 'Capital Markets Research Copilot',
    icon: TrendingUp,
    industry: 'Financial Services',
    risk: 'Critical',
    riskColor: C_RED,
    recommendation: 'Both (Defense in Depth)',
    recColor: C_PURPLE,
    rationale: 'MiFID II, FINRA 3110, and SEC 17a-4 require provable audit trails. Content Filters provide the baseline; CS API adds Custom Categories for market manipulation and insider trading detection, plus Prompt Shields against jailbreak attacks on the compliance model.',
    keyServices: ['Content Filters (all categories)', 'CS API - Custom Categories (market manipulation)', 'CS API - Prompt Shields', 'CS API - Protected Material', 'CS API - Groundedness'],
    pitfall: 'Without raw severity scores from CS API, you cannot produce the per-request audit evidence regulators expect.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/custom-categories', label: 'Custom Categories' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection', label: 'Prompt Shields' },
    ],
  },
  {
    title: 'Multi-Model RAG Pipeline (GPT-4 + Llama 3)',
    icon: Layers,
    industry: 'Enterprise / Cross-industry',
    risk: 'High',
    riskColor: C_RED,
    recommendation: 'Content Safety API',
    recColor: C_BLUE,
    rationale: 'Content Filters only apply to Azure OpenAI models. When Llama 3 or other open-source models are part of the orchestration, CS API is the only consistent safety layer that works across all of them.',
    keyServices: ['CS API - Text Analysis (pre and post each model call)', 'CS API - Groundedness', 'CS API - Prompt Shields'],
    pitfall: 'Apply Content Filters only to the Azure OpenAI hops; CS API to all other model calls.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview', label: 'CS API Overview' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness', label: 'Groundedness' },
    ],
  },
  {
    title: 'User-Generated Content Moderation Platform',
    icon: Users,
    industry: 'Social / Media / Marketplace',
    risk: 'High',
    riskColor: C_RED,
    recommendation: 'Content Safety API',
    recColor: C_BLUE,
    rationale: 'This is not an AI pipeline at all - users are submitting text and images directly. Content Filters are irrelevant here. CS API text and image analysis endpoints are the correct tool, with custom categories and blocklists for platform-specific violations.',
    keyServices: ['CS API - Text Analysis', 'CS API - Image Analysis', 'CS API - Custom Categories', 'CS API - Blocklists'],
    pitfall: 'Do not confuse content moderation (screening submitted content) with LLM safety. These are different problem spaces.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-text', label: 'Text Analysis' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-image', label: 'Image Analysis' },
    ],
  },
  {
    title: 'Internal Code Generation Assistant',
    icon: Code,
    industry: 'Software Engineering',
    risk: 'Low',
    riskColor: C_GREEN,
    recommendation: 'Content Filters',
    recColor: C_AMBER,
    rationale: 'Internal developer tool on Azure OpenAI. Standard harm categories via Content Filters are sufficient. The primary risk is accidental generation of insecure code, not classical harm categories - address that with system prompts and output validation, not safety APIs.',
    keyServices: ['Content Filters (Hate, Violence; relaxed for explicit code strings)', 'Prompt Shields (anti-jailbreak for internal policy)'],
    pitfall: 'Avoid over-tightening code-related filters; legitimate security research prompts may trigger false positives.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters', label: 'Configure Filters' },
    ],
  },
  {
    title: 'Document Ingestion Pipeline (Pre-LLM Screening)',
    icon: Database,
    industry: 'Enterprise Knowledge Management',
    risk: 'High',
    riskColor: C_RED,
    recommendation: 'Content Safety API',
    recColor: C_BLUE,
    rationale: 'Documents are uploaded before they ever reach an LLM. Content Filters have no role here. CS API text and image endpoints screen each document chunk for harmful content and potential XPIA payloads before indexing into the vector store.',
    keyServices: ['CS API - Text Analysis (each chunk)', 'CS API - Image Analysis (embedded images)', 'CS API - Prompt Shields (XPIA detection on documents)'],
    pitfall: 'Skipping pre-ingestion screening allows adversarial content to sit in the knowledge base and attack every future user session.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection', label: 'Prompt Shields (XPIA)' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/quickstart-text', label: 'Text Analysis' },
    ],
  },
  {
    title: 'AI Agent with Web Search and Tool Use',
    icon: Settings,
    industry: 'Enterprise Automation',
    risk: 'Critical',
    riskColor: C_RED,
    recommendation: 'Both (Defense in Depth)',
    recColor: C_PURPLE,
    rationale: 'Agents face three distinct attack surfaces: the user input, the LLM backbone, and the external data/tools. Content Filters protect the backbone. CS API Prompt Shields screen user inputs and each tool result for XPIA. Task Adherence checks ensure the agent stays within its authorised scope.',
    keyServices: ['Content Filters (backbone LLM)', 'CS API - Prompt Shields (user input + tool results)', 'CS API - Task Adherence (scope enforcement)', 'CS API - Groundedness (final output)'],
    pitfall: 'Agents that do not screen tool outputs are vulnerable to indirect prompt injection embedded in web pages, emails, or search results.',
  },
  {
    title: 'Domain Fine-Tuned Model Deployment',
    icon: Cpu,
    industry: 'Specialised AI Products',
    risk: 'High',
    riskColor: C_RED,
    recommendation: 'Content Safety API',
    recColor: C_BLUE,
    rationale: 'Fine-tuning on domain data often degrades a model\'s built-in safety alignment. Even when hosted on Azure, fine-tuned models may need CS API in addition to Content Filters since fine-tuning can weaken the model\'s refusal behaviour for off-topic requests.',
    keyServices: ['Content Filters (re-enabled after fine-tune verification)', 'CS API - Text Analysis (post-output)', 'CS API - Prompt Shields'],
    pitfall: 'Never assume a fine-tuned model retains its original safety properties. Always run a red-team evaluation after fine-tuning.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/fine-tuning', label: 'Fine-Tuning Docs' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview', label: 'CS API Overview' },
    ],
  },
  {
    title: 'Multi-Tenant SaaS AI Platform',
    icon: Globe,
    industry: 'SaaS / ISV',
    risk: 'High',
    riskColor: C_RED,
    recommendation: 'Content Filters (baseline) + CS API (premium)',
    recColor: C_CYAN,
    rationale: 'Content Filters provide a uniform safety floor across all tenants at zero marginal cost. Premium tenants who need compliance reporting, custom categories, or PII redaction can be routed through CS API as a value-added tier.',
    keyServices: ['Content Filters (all tenants)', 'CS API - Custom Categories (premium tenants)', 'CS API - PII Detection (data-sensitive tenants)', 'CS API - Groundedness (RAG-enabled tenants)'],
    pitfall: 'Never let tenant configuration bypass platform-level Content Filters. Filters must remain the non-negotiable floor.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter', label: 'Content Filters' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/custom-categories', label: 'Custom Categories' },
    ],
  },
  {
    title: 'Healthcare Patient Communication AI',
    icon: Activity,
    industry: 'Healthcare',
    risk: 'Critical',
    riskColor: C_RED,
    recommendation: 'Both (Defense in Depth)',
    recColor: C_PURPLE,
    rationale: 'HIPAA requires PII protection and audit trails. Self-harm detection must be tuned carefully (medical context vs. harmful context). CS API provides the PII redaction and raw score logging. Content Filters provide the always-on platform guarantee. Custom categories can be created for medical misinformation.',
    keyServices: ['Content Filters (Self-Harm category critical)', 'CS API - PII Detection (HIPAA compliance)', 'CS API - Custom Categories (medical misinformation)', 'CS API - Groundedness (clinical accuracy)', 'CS API - Text Analysis (audit trail)'],
    pitfall: 'Self-harm category thresholds must be carefully tuned - medical discussions of medication dosages can trigger false positives. Always involve clinical reviewers in threshold calibration.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/pii-detection', label: 'PII Detection' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness', label: 'Groundedness' },
    ],
  },
]

// â”€â”€ Architectural patterns data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PATTERNS = [
  {
    id: 'ingestion-shield',
    title: 'Ingestion Shield',
    subtitle: 'Screen before you index or process',
    color: C_BLUE,
    summary: 'All external content passes through CS API before reaching the LLM or the vector store. Text Analysis catches harm categories (hate, violence, sexual, self-harm) with 0-6 severity scores. Prompt Shields detects both direct jailbreaks and document-embedded indirect attacks (XPIA) in uploaded files - a capability that covers all model vendors, not just Azure OpenAI. Image Analysis screens images up to 4 MB. Harmful content is blocked before it incurs inference cost or contaminates the knowledge base. Content Filters are not applicable here: they only operate on content flowing through an Azure OpenAI inference call and cannot screen documents or images before the model sees them.',
    flow: [
      { label: 'User Input / Document Upload', type: 'start' },
      { label: 'CS API: Text + Image Analysis + Prompt Shields', type: 'check' },
      { label: 'Block if flagged; log severity scores', type: 'gate' },
      { label: 'LLM Inference / Vector Indexing', type: 'model' },
    ],
    bestFor: ['Document ingestion pipelines', 'User-generated content platforms', 'Cost optimisation (reject before paying for inference)', 'RAG knowledge base protection - preventing vector store poisoning'],
    tradeoff: 'Adds latency to every input path; use async screening for batch ingestion. Known limitations: Custom Categories (standard) is English-only, max 3 categories per resource, can take hours to train. Image analysis supports JPEG/PNG/GIF/BMP/TIFF/WEBP up to 4 MB. Blocklist additions take up to 5 minutes to propagate - not suitable as a real-time incident response.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview', label: 'CS API Overview' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection', label: 'Prompt Shields' },
    ],
  },
  {
    id: 'defense-in-depth',
    title: 'Defense in Depth',
    subtitle: 'Multi-layer safety for regulated industries',
    color: C_PURPLE,
    summary: 'CS API screens inputs pre-inference: Prompt Shields + Text Analysis reject jailbreaks and harmful content before the model sees the payload, saving inference cost and producing numeric 0-6 severity scores required for per-request audit evidence. Content Filters enforce safety at the model layer during inference: they are platform-enforced and cannot be bypassed by application code - a guarantee the app-layer CS API call alone cannot provide. CS API then post-processes outputs for three specific, docs-verified reasons: (1) CF Groundedness requires special document-embedding prompt markup and has region restrictions; CS API Groundedness works on any output text. (2) CF PII detection covers only model completions - not content your app assembles post-response from retriever results or tool outputs. (3) CF returns binary block/allow verdicts only; CS API returns numeric severity scores per category - the per-request quantified evidence MiFID II, HIPAA, and FINRA auditors require. An independent failure boundary also matters: Microsoft documents that when CF is unavailable, requests complete with HTTP 200 and no filtering applied. CS API as a separate service ensures safety cannot be silently skipped when the model-layer filter degrades.',
    flow: [
      { label: 'User Input', type: 'start' },
      { label: 'CS API: Prompt Shields + Text Analysis', type: 'check' },
      { label: 'LLM w/ Content Filters (Hate, Violence, Jailbreak)', type: 'model' },
      { label: 'CS API: Groundedness + PII + Protected Material', type: 'check' },
      { label: 'Audit log all scores; deliver response', type: 'outcome' },
    ],
    bestFor: ['Financial services (MiFID II, FINRA) - regulations require per-request severity evidence, not just block/allow', 'Healthcare (HIPAA) - PII audit trail must be independent of the model layer', 'Legal and compliance workflows requiring documented separation of duties', 'Any application generating externally-distributed AI content subject to liability'],
    tradeoff: 'Two CS API round-trips plus inference - the highest latency of all five patterns. Profile end-to-end latency before adopting if SLA is under 2 seconds. Groundedness (CS API) is English-only and requires caller-supplied grounding sources. Content Filters require Azure OpenAI or AI Foundry - this pattern only works if your model layer is on those platforms.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter', label: 'Content Filters' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview', label: 'Responsible AI' },
    ],
  },
  {
    id: 'multi-provider-safety',
    title: 'Multi-Provider Safety Layer',
    subtitle: 'Uniform safety across heterogeneous model portfolio',
    color: C_CYAN,
    summary: 'An orchestration layer routes requests to the appropriate LLM (GPT-4o, Llama 3.1, Claude, etc.). CS API wraps every model call uniformly because it is platform-agnostic and works with any model or non-AI pipeline. Content Filters are Azure OpenAI and AI Foundry exclusive - they cannot be attached to Llama, Claude, Mistral, or any non-Azure-hosted model. For non-Azure hops, CS API is the only available safety mechanism. The pattern enables consistent Prompt Shields, harm detection, and output scoring regardless of which model handled the request - critical for enforcing a uniform safety policy when different teams or products use different models.',
    flow: [
      { label: 'Orchestrator receives request', type: 'start' },
      { label: 'CS API: Pre-screen input (all model paths)', type: 'check' },
      { label: 'Route to model (Azure AOAI / Llama / Claude)', type: 'model' },
      { label: 'Content Filters (Azure OpenAI/Foundry hops only)', type: 'gate' },
      { label: 'CS API: Post-screen output (all model paths)', type: 'check' },
    ],
    bestFor: ['Multi-model architectures with Azure and non-Azure models', 'AI platforms serving multiple product teams using different models', 'Vendor diversification strategies where model can be swapped without changing the safety contract', 'Benchmarking / model evaluation pipelines needing consistent safety baselines'],
    tradeoff: 'CS API must be called twice per request (pre and post). Centralise these calls in the orchestrator to avoid per-team drift. Prompt Shields supports Chinese, English, French, German, Spanish, Italian, Japanese, and Portuguese with high quality; other languages are best-effort. CS API Groundedness is English-only - post-screening for factual accuracy is only available for English output across all model providers.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview', label: 'CS API Overview' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/model-inference/overview', label: 'AI Foundry Inference' },
    ],
  },
  {
    id: 'agent-safety',
    title: 'Agent Safety Pattern',
    subtitle: 'Protect agentic AI across all attack surfaces',
    color: C_RED,
    summary: 'AI agents face three attack surfaces that simple chat does not. (1) User turn - direct jailbreak: Prompt Shields detects attempts to override the system prompt or manipulate the model persona before inference. CF Prompt Shields also catches these but only within the Azure OpenAI inference path. (2) Tool results and retrieved documents - XPIA (cross-prompt injection): Prompt Shields for Documents analyzes external content (emails, web pages, search results, database rows) for embedded adversarial instructions before injecting them into agent context. This is a CS API-only capability - Content Filters do not screen tool return values. (3) Agent-generated actions - misaligned tool use: Task Adherence (CS API, preview) detects when the agent plans to invoke a tool that does not match the user intent - e.g., calling change_data_plan() when the user asked to view their usage. Content Filters have no equivalent for action-level alignment checking.',
    flow: [
      { label: 'User Turn', type: 'start' },
      { label: 'CS API: Prompt Shields (direct jailbreak detection)', type: 'check' },
      { label: 'Agent LLM with Content Filters', type: 'model' },
      { label: 'Tool Result / Retrieved Document', type: 'start' },
      { label: 'CS API: Prompt Shields (XPIA in tool results)', type: 'check' },
      { label: 'CS API: Task Adherence (action in scope?)', type: 'gate' },
      { label: 'CS API: Groundedness (output grounded?)', type: 'check' },
    ],
    bestFor: ['Autonomous agents with tool access', 'Email/calendar AI assistants', 'Web browsing agents', 'Code execution agents', 'Financial or medical agents with real-world consequences'],
    tradeoff: 'Task Adherence and Groundedness add meaningful latency. Task Adherence is in preview and data may be processed in US/EU regions regardless of your resource region - verify this against your data residency requirements before deploying in regulated environments. Groundedness is English-only. Cache grounding documents where possible and consider running post-action checks asynchronously for non-blocking flows.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection', label: 'Prompt Shields' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/task-adherence', label: 'Task Adherence' },
    ],
  },
  {
    id: 'tiered-safety',
    title: 'Tiered Safety Pattern',
    subtitle: 'Balance cost and compliance across tenant tiers',
    color: C_GREEN,
    summary: 'Content Filters provide a zero-marginal-cost safety floor for all tenants - they are bundled into Azure OpenAI pricing, apply uniformly to every API caller, and cannot be bypassed by tenant code. Standard tenants get this floor automatically. Premium tenants are routed through CS API Custom Categories to enforce domain-specific policies and CS API PII Detection for data-sensitive scenarios. Regulated tenants add CS API Groundedness for RAG accuracy verification and full per-request audit logging with numeric severity scores. This tiered escalation makes safety economically viable at scale while delivering the compliance evidence that regulated tenants specifically require. Prerequisite: this pattern requires all tenant model traffic to flow through Azure OpenAI or AI Foundry - the Content Filter floor is not available for non-Azure model deployments.',
    flow: [
      { label: 'All tenants: Content Filters (platform baseline)', type: 'gate' },
      { label: 'Standard tier: filters only, proceed to response', type: 'outcome' },
      { label: 'Premium tier: + CS API Custom Categories + PII', type: 'check' },
      { label: 'Regulated tier: + CS API Groundedness + Audit log', type: 'check' },
    ],
    bestFor: ['Multi-tenant SaaS platforms on Azure OpenAI', 'Developer-facing AI APIs with compliance add-on tiers', 'Platforms with free and paid tiers needing cost-proportional safety depth', 'B2B platforms serving regulated and non-regulated industries simultaneously'],
    tradeoff: 'Tier routing logic must be carefully maintained and hardened. Ensure tenant classification cannot be spoofed to downgrade safety tier. Known limitations of CS API add-ons: Custom Categories (standard) is English-only, max 3 categories per resource, 5 RPS, and takes hours to train - not suitable for dynamic policy changes. Custom Categories (rapid) is faster and supports images but uses an LLM-based classifier with no training time guarantee. Groundedness is English-only. Plan for these constraints when defining what each paid tier promises.',
    refs: [
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter', label: 'Content Filters' },
      { url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview', label: 'CS API Overview' },
    ],
  },
]

// â”€â”€ Best practices data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SECURITY_PRACTICES = [
  {
    priority: 'Critical',
    priorityColor: C_RED,
    title: 'Always enable Content Filters on every Azure OpenAI deployment',
    detail: 'There is no operational scenario where disabling all Content Filters is acceptable in production. Even the most permissive policy should retain Self-Harm detection at a minimum. "Filter Off" deployments should only exist in isolated red-team test environments.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters',
  },
  {
    priority: 'Critical',
    priorityColor: C_RED,
    title: 'Apply Prompt Shields on every user-facing chat turn',
    detail: 'Jailbreak and indirect injection attacks are not edge cases in production AI. Every user input to a customer-facing model should pass through Prompt Shields before inference. The cost is approximately 100ms and fractions of a cent.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection',
  },
  {
    priority: 'Critical',
    priorityColor: C_RED,
    title: 'Screen tool results and retrieved documents in agent pipelines',
    detail: 'XPIA (cross-prompt injection attacks) embedded in web pages, emails, or search results are the primary new attack vector for agentic AI. Any external data an agent retrieves must pass through Prompt Shields before being injected into the agent context.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection',
  },
  {
    priority: 'High',
    priorityColor: C_AMBER,
    title: 'Use managed identity for CS API and Azure OpenAI authentication',
    detail: 'Avoid API keys in application code or environment variables in production. Use Managed Identity with minimum-privilege RBAC roles (Cognitive Services User for inference, no Owner/Contributor for production inference paths).',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/authentication',
  },
  {
    priority: 'High',
    priorityColor: C_AMBER,
    title: 'Log severity scores, not just block/allow verdicts',
    detail: 'Block/allow logs tell you what was stopped. Severity score logs (0-6 per category) tell you where the risk is trending. A rising distribution of score-4 responses that are just below your block threshold is a leading indicator of an attack in progress.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/monitor-content-safety',
  },
  {
    priority: 'High',
    priorityColor: C_AMBER,
    title: 'Never log raw user content in production telemetry',
    detail: 'Log a hash of the content, the verdict, and the severity scores. Raw content in logs creates a secondary data exposure risk and may violate GDPR, CCPA, or HIPAA depending on context. Store raw content only in SOC-controlled audit storage with strict access controls.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview',
  },
  {
    priority: 'High',
    priorityColor: C_AMBER,
    title: 'Validate Content Filter policy after every model or deployment change',
    detail: 'When you update a model deployment (version bump, fine-tune swap), re-verify that your Content Filter policy is still attached and active. Deployment updates can silently reset to the default policy in some SDK versions.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters',
  },
  {
    priority: 'Medium',
    priorityColor: C_CYAN,
    title: 'Rate-limit CS API consumers to prevent abuse amplification',
    detail: 'An adversary who discovers your application calls CS API on user input can flood the API with high-volume probing requests. Rate-limit at the application gateway before the safety check to prevent your safety layer from becoming a denial-of-service target.',
    ref: 'https://learn.microsoft.com/en-us/azure/api-management/api-management-sample-send-request',
  },
  {
    priority: 'Medium',
    priorityColor: C_CYAN,
    title: 'Red-team your safety configuration every 90 days',
    detail: 'Jailbreak techniques evolve rapidly. Schedule quarterly adversarial testing against your deployed Content Filter policies and CS API thresholds. Log red-team results as compliance evidence. Adjust thresholds based on findings.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/red-teaming',
  },
]

const GENERAL_PRACTICES = [
  {
    icon: Target,
    title: 'Start with Content Filters as the mandatory baseline',
    detail: 'Every Azure OpenAI deployment should have a Content Filter policy attached before it serves any traffic. This is a 5-minute configuration step that provides material safety coverage at zero marginal cost.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters',
  },
  {
    icon: Layers,
    title: 'Add CS API calls incrementally based on risk profile',
    detail: 'Begin with Prompt Shields and Text Analysis. Add Groundedness once RAG is in scope. Add Custom Categories when domain-specific risks are identified. Avoid implementing every CS API capability on day one - match capability investment to actual risk.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview',
  },
  {
    icon: BarChart2,
    title: 'Monitor severity score distributions, not just block rates',
    detail: 'A 0.1% block rate tells you little. The distribution of scores across all requests shows you content trends. Set alerts when the percentage of requests scoring 3+ in any category exceeds a threshold - this catches a rising risk before it reaches your block threshold.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/monitor-content-safety',
  },
  {
    icon: CheckCircle,
    title: 'Run Groundedness checks on all RAG-generated responses',
    detail: 'Even a well-prompted RAG system will occasionally hallucinate citations or generate claims not supported by the retrieved context. Groundedness Detection catches these before they become user-visible errors or, worse, regulatory incidents.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness',
  },
  {
    icon: BookOpen,
    title: 'Use Blocklists for known-bad terms; Custom Categories for concept-level risks',
    detail: 'Blocklists are fast and deterministic - use them for ticker symbols, competitor names, and banned product claims. Custom Categories use embedding-based semantic matching - use them for complex concepts like "market manipulation" or "coercive selling" that cannot be expressed as keyword lists.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/custom-categories',
  },
  {
    icon: GitBranch,
    title: 'Build a human review queue for borderline verdicts',
    detail: 'Do not binary block/allow on severity scores. Define a middle tier (e.g., score 3-4 out of 6) that routes to a human reviewer queue. Purely automated safety creates adversarial optimisation pressure; human review in the loop prevents score-gaming.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview',
  },
  {
    icon: Settings,
    title: 'Document your safety architecture as compliance evidence',
    detail: 'For regulated industries, the safety architecture diagram, Content Filter policies, CS API threshold configuration, and audit log retention plan are all potential regulator evidence items. Maintain this documentation alongside your system design documentation.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview',
  },
  {
    icon: TrendingUp,
    title: 'Re-evaluate safety configuration when your use case evolves',
    detail: 'A chatbot that gains agentic capabilities, access to additional data sources, or new user populations has a fundamentally different risk profile. Treat safety configuration as a living artefact that is reviewed every time there is a material scope change.',
    ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview',
  },
]

// â”€â”€ Customer Guide data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DISCOVERY_QUESTIONS = [
  {
    phase: 'AI Architecture',
    phaseColor: C_BLUE,
    questions: [
      'Are you deploying exclusively on Azure OpenAI, or mixing multiple model providers?',
      'Are you using Azure AI Foundry, or managing model deployments directly via REST?',
      'Is your application agentic - does it use tools, function calling, or external data retrieval?',
      'Do you have fine-tuned models in scope? How were they fine-tuned and tested for safety?',
    ],
  },
  {
    phase: 'Regulatory & Compliance',
    phaseColor: C_RED,
    questions: [
      'What regulatory frameworks govern your AI deployment (MiFID II, FINRA, HIPAA, EU AI Act)?',
      'Do regulators or auditors require documented evidence of safety controls per request?',
      'What is your data residency requirement for content safety processing?',
      'Do your AI outputs get distributed externally, or are they internal tools only?',
    ],
  },
  {
    phase: 'Risk Profile',
    phaseColor: C_AMBER,
    questions: [
      'What domain-specific harms are unique to your business (market manipulation, medical misinformation, PII breach)?',
      'What is the cost to your business if the AI produces a harmful or incorrect output?',
      'Who are your users - employees, consumers, vulnerable populations?',
      'Have you conducted a red-team exercise against your current AI deployment?',
    ],
  },
  {
    phase: 'Operations',
    phaseColor: C_GREEN,
    questions: [
      'Does your engineering team have capacity to integrate explicit API calls, or do you need zero-code safety?',
      'What observability and logging infrastructure does your AI deployment use?',
      'How do you handle false positives today - do over-blocks have a significant business cost?',
      'What is your current incident response process when an AI produces harmful output?',
    ],
  },
]

const OBJECTION_HANDLERS = [
  {
    objection: '"Content Filters is good enough - we do not need CS API."',
    response: 'Content Filters are an excellent baseline, but they only cover the Azure OpenAI inference call. They cannot screen documents before ingestion, provide PII redaction, produce audit-grade severity scores, or detect domain-specific risks like market manipulation. If your risk profile requires any of these, CS API fills the gap.',
  },
  {
    objection: '"CS API adds too much latency to our response time budget."',
    response: 'Pre-screening with CS API typically adds 80-200ms. For inputs already going to an LLM inference call measured in 1,000-5,000ms, this is a 5-15% overhead. For inputs being blocked before an inference call, it saves the entire inference cost. Consider async post-processing for non-blocking output checks.',
  },
  {
    objection: '"We will handle safety in the system prompt."',
    response: 'System prompt instructions can be overridden by well-crafted jailbreak attacks. Prompt Shields and Content Filters are deterministic safety controls that operate independently of the model\'s compliance with instructions. Safety that depends on a language model\'s cooperation is not a verifiable safety control.',
  },
  {
    objection: '"We are just an internal tool - our users are employees, not the public."',
    response: 'Internal tools face the same jailbreak and indirect injection risks. Additionally, insider threat scenarios (employees extracting proprietary information via an AI assistant) are a real risk that Prompt Shields and DLP-style PII detection can mitigate. Regulated data does not become less sensitive because access is internal.',
  },
  {
    objection: '"We already have a firewall and WAF in front of the AI."',
    response: 'WAFs and firewalls block network-layer and known-signature attacks. They have no understanding of AI-specific attacks: jailbreaks embedded in semantically valid sentences, indirect injection in retrieved documents, model-specific bypasses. CS API and Content Filters are semantic-layer controls purpose-built for these threat classes.',
  },
]

const NEXT_STEPS = [
  { step: '1', title: 'Risk Profile Assessment', detail: 'Conduct a 1-hour structured risk workshop. Map the application to: regulated industry? external users? agentic? multi-model? outputs distributed externally? The answers directly determine which capabilities are required.', color: C_BLUE, ref: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview' },
  { step: '2', title: 'Audit Current Deployment', detail: 'Review every Azure OpenAI deployment: Is a Content Filter policy attached? What is the policy configuration? Are Prompt Shields enabled? Are there any deployments with filters disabled? This audit almost always surfaces quick wins.', color: C_AMBER, ref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters' },
  { step: '3', title: 'CS API Capability Gap Analysis', detail: 'Based on the risk profile, identify which CS API capabilities are missing: Groundedness for RAG? PII for HIPAA? Custom Categories for domain risks? Prompt Shields for agentic flows? Scope a targeted integration sprint for each gap.', color: C_PURPLE, ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview' },
  { step: '4', title: 'Architecture Review', detail: 'Map the current system architecture and overlay the recommended safety pattern (Ingestion Shield, Defense-in-Depth, Agent Safety, etc.). Identify where CS API calls need to be inserted and how audit logging will be implemented.', color: C_CYAN, ref: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/content-filtering' },
  { step: '5', title: 'Red-Team and Threshold Calibration', detail: 'Run adversarial tests against the proposed configuration. Adjust Content Filter policy thresholds and CS API severity cutoffs based on findings. Document baseline false positive and false negative rates before go-live.', color: C_RED, ref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/red-teaming' },
  { step: '6', title: 'Operationalise and Monitor', detail: 'Instrument severity score distributions into the existing observability stack. Set alerts for block rate anomalies and score distribution shifts. Schedule quarterly red-team reviews. Assign ownership for safety policy changes.', color: C_GREEN, ref: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/monitor-content-safety' },
]

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Badge({ c, children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: c.badge, color: c.badgeText, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em',
    }}>{children}</span>
  )
}

function SectionHeading({ icon: Icon, children, color, noMargin }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: noMargin ? 0 : 20 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color.bg, border: `1px solid ${color.border}`,
      }}>
        <Icon size={17} color={color.text} />
      </div>
      <h2 style={{ color: '#e8edf5', fontSize: 16, fontWeight: 700 }}>{children}</h2>
    </div>
  )
}

function PriorityDot({ label, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color.dot, display: 'inline-block' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: color.text, letterSpacing: '0.04em' }}>{label}</span>
    </span>
  )
}

function DocLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, color: '#4d6480', textDecoration: 'none',
        borderRadius: 4, padding: '2px 6px',
        border: '1px solid rgba(77,100,128,0.3)',
        background: 'rgba(77,100,128,0.07)',
        transition: 'color 0.12s, border-color 0.12s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#06b6d4'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#4d6480'; e.currentTarget.style.borderColor = 'rgba(77,100,128,0.3)' }}
    >
      <ExternalLink size={10} />
      {label || 'Source'}
    </a>
  )
}

// â”€â”€ Flow node renderer (used in patterns) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FLOW_STYLES = {
  start:   { border: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   text: '#cffafe' },
  check:   { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  text: '#dbeafe' },
  gate:    { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  text: '#fef3c7' },
  model:   { border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', text: '#ede9fe' },
  outcome: { border: '#10b981', bg: 'rgba(16,185,129,0.08)', text: '#d1fae5' },
}

function FlowNode({ node, isLast }) {
  const s = FLOW_STYLES[node.type] || FLOW_STYLES.check
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        padding: '8px 16px', borderRadius: 8, border: `1px solid ${s.border}`,
        background: s.bg, color: s.text, fontSize: 12, fontWeight: 500,
        textAlign: 'center', width: '100%',
      }}>{node.label}</div>
      {!isLast && (
        <div style={{ width: 2, height: 16, background: '#1e2d42', margin: '2px 0' }} />
      )}
    </div>
  )
}

// â”€â”€ Tab renderers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OverviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Hero summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Content Safety API */}
        <div style={{ border: `1px solid ${C_BLUE.border}`, borderRadius: 12, background: C_BLUE.bg, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: `1px solid ${C_BLUE.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color={C_BLUE.text} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5' }}>Content Safety API</div>
              <div style={{ fontSize: 12, color: '#8fa3c0' }}>Explicit, code-integrated, platform-agnostic</div>
            </div>
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview" label="MS Docs" />
          </div>
          <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7, marginBottom: 16 }}>
            A standalone Azure AI service you call explicitly from your code at any point in the processing pipeline. Works with any model, any platform, any language. Returns rich structured results including numeric severity scores per harm category.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {CS_STRENGTHS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle size={13} color={C_BLUE.text} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Filters */}
        <div style={{ border: `1px solid ${C_AMBER.border}`, borderRadius: 12, background: C_AMBER.bg, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: `1px solid ${C_AMBER.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color={C_AMBER.text} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5' }}>Content Filters</div>
              <div style={{ fontSize: 12, color: '#8fa3c0' }}>Platform-enforced, zero-code, Azure OpenAI native</div>
            </div>
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter" label="MS Docs" />
          </div>
          <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7, marginBottom: 16 }}>
            Safety policies attached directly to Azure OpenAI or AI Foundry model deployments. Automatically applied to every request and response without any application code changes. Cannot be bypassed by application logic.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {CF_STRENGTHS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle size={13} color={C_AMBER.text} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <SectionHeading icon={Scale} color={C_CYAN} noMargin>Side-by-Side Comparison</SectionHeading>
          <div style={{ display: 'flex', gap: 8 }}>
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview" label="CS API Docs" />
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters" label="Filters Docs" />
          </div>
        </div>
        <div style={{ border: '1px solid #1e2d42', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#151b2b' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#4d6480', letterSpacing: '0.06em', width: '26%', borderBottom: '1px solid #1e2d42' }}>DIMENSION</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C_BLUE.text, letterSpacing: '0.06em', borderBottom: '1px solid #1e2d42' }}>CONTENT SAFETY API</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C_AMBER.text, letterSpacing: '0.06em', borderBottom: '1px solid #1e2d42' }}>CONTENT FILTERS</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#8fa3c0', borderBottom: '1px solid rgba(30,45,66,0.5)' }}>{row.label}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#b0c4d8', borderBottom: '1px solid rgba(30,45,66,0.5)', borderLeft: `2px solid ${C_BLUE.border}` }}>{row.cs}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#b0c4d8', borderBottom: '1px solid rgba(30,45,66,0.5)', borderLeft: `2px solid ${C_AMBER.border}` }}>{row.cf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* When to combine */}
      <div style={{ border: `1px solid ${C_PURPLE.border}`, borderRadius: 12, background: C_PURPLE.bg, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Layers size={18} color={C_PURPLE.text} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf5' }}>When to Use Both Together</span>
          <Badge c={C_PURPLE}>Recommended for regulated industries</Badge>
          <div style={{ marginLeft: 'auto' }}>
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview" label="Responsible AI Docs" />
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7 }}>
          Content Filters and Content Safety API are complementary, not competing. Content Filters provide the non-negotiable platform-layer safety baseline for all Azure OpenAI deployments. CS API adds the explicit, auditable, domain-customisable layer on top.
          <strong style={{ color: C_PURPLE.badgeText }}> The combination is the recommended architecture for financial services, healthcare, and any application where the cost of a safety failure is regulatory, reputational, or financial.</strong>
        </p>
      </div>

    </div>
  )
}

function DecisionTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Decision matrix */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionHeading icon={GitBranch} color={C_CYAN} noMargin>Decision Matrix - Answer These Questions</SectionHeading>
          <div style={{ display: 'flex', gap: 8 }}>
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview" label="CS API" />
            <DocLink href="https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter" label="Content Filters" />
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8fa3c0', marginBottom: 20, lineHeight: 1.7 }}>
          Work through these questions for your specific use case. Each answer maps to a capability recommendation. Most real-world applications will answer several questions, and the union of the answers defines your full safety architecture.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DECISION_CRITERIA.map((item, i) => (
            <div key={i} style={{ background: '#1a2235', border: '1px solid #1e2d42', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2d42', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: '#243350', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#8fa3c0', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e8edf5' }}>{item.question}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                <div style={{ padding: '12px 18px', borderRight: '1px solid #1e2d42', background: 'rgba(16,185,129,0.03)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4d6480', letterSpacing: '0.05em', marginBottom: 6 }}>IF YES</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.ifYes.c.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.ifYes.c.text }}>{item.ifYes.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#8fa3c0', marginTop: 4, lineHeight: 1.5 }}>{item.ifYes.note}</p>
                </div>
                <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.02)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4d6480', letterSpacing: '0.05em', marginBottom: 6 }}>IF NO</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.ifNo.c.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.ifNo.c.text }}>{item.ifNo.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#8fa3c0', marginTop: 4, lineHeight: 1.5 }}>{item.ifNo.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick picks */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <SectionHeading icon={Target} color={C_GREEN} noMargin>Quick Reference: Start Here</SectionHeading>
          <DocLink href="https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/content-filtering" label="AI Foundry Guardrails" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            {
              c: C_AMBER, label: 'Use Content Filters when',
              items: ['Azure OpenAI only deployment', 'Zero-code safety requirement', 'Fast time-to-market', 'Multi-tenant uniform enforcement', 'Budget-sensitive (no per-call cost)', 'Simple chat or completion workloads'],
            },
            {
              c: C_BLUE, label: 'Use Content Safety API when',
              items: ['Non-Azure models in the stack', 'User-generated content / doc ingestion', 'Regulatory audit trail required', 'PII detection or redaction needed', 'Domain-specific risks (custom categories)', 'Fine-tuned models in deployment'],
            },
            {
              c: C_PURPLE, label: 'Use Both when',
              items: ['Financial services / healthcare / legal', 'Agentic AI with external tool access', 'External distribution of AI outputs', 'Compliance evidence required per-request', 'Multi-model orchestration', 'Any high-stakes or critical-risk application'],
            },
          ].map((col, i) => (
            <div key={i} style={{ border: `1px solid ${col.c.border}`, borderRadius: 10, background: col.c.bg, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: col.c.text, marginBottom: 12 }}>{col.label}</div>
              {col.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 7 }}>
                  <ChevronRight size={13} color={col.c.text} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function ScenariosTab() {
  const [expanded, setExpanded] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7 }}>
        Ten common customer scenarios with specific capability recommendations and implementation pitfalls. Click any scenario to expand the detail.
      </p>
      {SCENARIOS.map((s, i) => {
        const isOpen = expanded === i
        const Icon = s.icon
        return (
          <div key={i} style={{ border: `1px solid ${isOpen ? s.recColor.border : '#1e2d42'}`, borderRadius: 10, background: isOpen ? s.recColor.bg : '#1a2235', transition: 'all 0.15s' }}>
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.recColor.badge, border: `1px solid ${s.recColor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={s.recColor.text} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#8fa3c0', marginTop: 2 }}>{s.industry}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge c={s.riskColor}>{s.risk} Risk</Badge>
                <Badge c={s.recColor}>{s.recommendation}</Badge>
                <ChevronRight size={15} color='#4d6480' style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${s.recColor.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10, marginBottom: 4 }}>
                  {s.refs && s.refs.map((r, ri) => <DocLink key={ri} href={r.url} label={r.label} />)}
                </div>
                <p style={{ fontSize: 13, color: '#b0c4d8', lineHeight: 1.7, marginBottom: 14 }}>{s.rationale}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: '#151b2b', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4d6480', letterSpacing: '0.05em', marginBottom: 8 }}>KEY SERVICES TO ENABLE</div>
                    {s.keyServices.map((svc, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                        <CheckCircle size={12} color={s.recColor.text} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.5 }}>{svc}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em', marginBottom: 8 }}>COMMON PITFALL</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <AlertTriangle size={13} color='#ef4444' style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>{s.pitfall}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PatternsTab() {
  const [selected, setSelected] = useState(0)
  const p = PATTERNS[selected]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7 }}>
        Five proven architectural patterns for deploying Content Safety API and Content Filters. Select a pattern to see the detail.
      </p>

      {/* Pattern selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {PATTERNS.map((pt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${i === selected ? pt.color.border : '#1e2d42'}`,
              background: i === selected ? pt.color.bg : '#1a2235', color: i === selected ? pt.color.text : '#8fa3c0',
              fontSize: 12, fontWeight: i === selected ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {pt.title}
          </button>
        ))}
      </div>

      {/* Pattern detail */}
      <div style={{ border: `1px solid ${p.color.border}`, borderRadius: 12, background: p.color.bg, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e8edf5' }}>{p.title}</span>
          <Badge c={p.color}>{p.subtitle}</Badge>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {p.refs && p.refs.map((r, ri) => <DocLink key={ri} href={r.url} label={r.label} />)}
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7, marginBottom: 22 }}>{p.summary}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
          {/* Flow */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4d6480', letterSpacing: '0.05em', marginBottom: 10 }}>FLOW</div>
            {p.flow.map((node, i) => (
              <FlowNode key={i} node={node} isLast={i === p.flow.length - 1} />
            ))}
          </div>

          {/* Best for + tradeoff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4d6480', letterSpacing: '0.05em', marginBottom: 10 }}>BEST FOR</div>
              {p.bestFor.map((item, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                  <CheckCircle size={13} color={p.color.text} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em', marginBottom: 8 }}>TRADEOFF TO CONSIDER</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={13} color='#f59e0b' style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#fcd34d', lineHeight: 1.5 }}>{p.tradeoff}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(FLOW_STYLES).map(([type, s]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.bg, border: `1px solid ${s.border}`, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#4d6480' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PracticesTab() {
  const [section, setSection] = useState('security')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 4, background: '#151b2b', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'security', label: 'Security Practices' },
          { id: 'general',  label: 'General Practices'  },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: section === t.id ? '#1a2235' : 'transparent',
            color: section === t.id ? '#e8edf5' : '#4d6480', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {section === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7 }}>
            Security-specific practices for deploying Content Safety API and Content Filters. Prioritised by criticality.
          </p>
          {SECURITY_PRACTICES.map((p, i) => (
            <div key={i} style={{ background: '#1a2235', border: `1px solid ${p.priorityColor.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <PriorityDot label={p.priority} color={p.priorityColor} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5', flex: 1 }}>{p.title}</span>
                {p.ref && <DocLink href={p.ref} label="Source" />}
              </div>
              <p style={{ fontSize: 12, color: '#8fa3c0', lineHeight: 1.7, paddingLeft: 14 }}>{p.detail}</p>
            </div>
          ))}
        </div>
      )}

      {section === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {GENERAL_PRACTICES.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} style={{ background: '#1a2235', border: '1px solid #1e2d42', borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <Icon size={16} color={C_CYAN.text} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5', flex: 1 }}>{p.title}</span>
                  {p.ref && <DocLink href={p.ref} label="Source" />}
                </div>
                <p style={{ fontSize: 12, color: '#8fa3c0', lineHeight: 1.7 }}>{p.detail}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CustomerTab() {
  const [section, setSection] = useState('discovery')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 4, background: '#151b2b', borderRadius: 8, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'discovery',  label: 'Discovery Questions' },
          { id: 'objections', label: 'Objection Handlers'  },
          { id: 'nextsteps',  label: 'Next Steps'          },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: section === t.id ? '#1a2235' : 'transparent',
            color: section === t.id ? '#e8edf5' : '#4d6480', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {section === 'discovery' && (
        <div>
          <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7, marginBottom: 20 }}>
            Use these questions in customer discovery to understand their risk profile and map it to the correct capability combination.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {DISCOVERY_QUESTIONS.map((group, i) => (
              <div key={i} style={{ border: `1px solid ${group.phaseColor.border}`, borderRadius: 10, background: group.phaseColor.bg, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: group.phaseColor.text, marginBottom: 12, letterSpacing: '0.04em' }}>{group.phase.toUpperCase()}</div>
                {group.questions.map((q, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: group.phaseColor.text, flexShrink: 0, marginTop: 1, width: 16, height: 16, borderRadius: 4, background: group.phaseColor.badge, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {j + 1}
                    </span>
                    <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.6 }}>{q}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'objections' && (
        <div>
          <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7, marginBottom: 20 }}>
            Common customer objections and how to address them with specific technical and business justifications.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {OBJECTION_HANDLERS.map((item, i) => (
              <div key={i} style={{ background: '#1a2235', border: '1px solid #1e2d42', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <X size={13} color='#ef4444' />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', fontStyle: 'italic' }}>{item.objection}</span>
                  </div>
                </div>
                <div style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle size={13} color={C_GREEN.text} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#b0c4d8', lineHeight: 1.7 }}>{item.response}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'nextsteps' && (
        <div>
          <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7, marginBottom: 20 }}>
            A structured six-step engagement path from initial customer discovery to production-grade operationalised safety.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {NEXT_STEPS.map((step, i) => (
              <div key={i} style={{ border: `1px solid ${step.color.border}`, borderRadius: 10, background: step.color.bg, padding: 18, display: 'flex', gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: step.color.badge, border: `1px solid ${step.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: step.color.text }}>{step.step}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5', flex: 1 }}>{step.title}</span>
                    {step.ref && <DocLink href={step.ref} label="Source" />}
                  </div>
                  <p style={{ fontSize: 12, color: '#8fa3c0', lineHeight: 1.7 }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€ References data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const REFERENCE_GROUPS = [
  {
    label: 'Azure AI Content Safety API',
    color: C_BLUE,
    icon: ShieldCheck,
    links: [
      { title: 'Content Safety - Overview',                   sub: 'Service overview, capabilities, and quotas',                                  url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview' },
      { title: 'Text Analysis API',                           sub: 'Analyze text for harm categories (hate, violence, sexual, self-harm)',          url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/use-text-api' },
      { title: 'Image Analysis API',                          sub: 'Analyze images for harmful visual content',                                   url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/use-image-api' },
      { title: 'Prompt Shields (Jailbreak & XPIA Detection)', sub: 'Direct jailbreak attacks and indirect prompt injection (XPIA)',                url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection' },
      { title: 'Groundedness Detection',                      sub: 'Detect hallucinations - claims not supported by the retrieved context',        url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/groundedness' },
      { title: 'Protected Material Detection',                sub: 'Detect copyrighted text, song lyrics, articles, and source code',             url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/protected-material' },
      { title: 'Custom Categories',                           sub: 'Define domain-specific harm classifiers using the Incidents API',              url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/custom-categories' },
      { title: 'Blocklists',                                  sub: 'Restrict specific terms, phrases, and patterns',                              url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/how-to/use-blocklist' },
      { title: 'Harm Categories Reference',                   sub: 'Severity levels (0-6) and category definitions for all harm types',           url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/harm-categories' },
      { title: 'Pricing',                                     sub: 'Per-transaction pricing for each CS API capability',                          url: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/content-safety/' },
    ],
  },
  {
    label: 'Content Safety in AI Foundry',
    color: C_BLUE,
    icon: ShieldCheck,
    links: [
      { title: 'Task Adherence',                              sub: 'Detect when an AI agent strays outside its assigned task scope',              url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/task-adherence' },
      { title: 'PII Detection (Azure AI Language)',           sub: 'Recognize and redact personally identifiable information in text',            url: 'https://learn.microsoft.com/en-us/azure/ai-services/language-service/personally-identifiable-information/overview' },
    ],
  },
  {
    label: 'Azure OpenAI Content Filters',
    color: C_AMBER,
    icon: Shield,
    links: [
      { title: 'Content Filtering - Overview',                sub: 'How content filters work with Azure OpenAI deployments',                      url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter' },
      { title: 'Configure Content Filters',                   sub: 'Create and assign content filter policies in the Azure portal',               url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/content-filters' },
      { title: 'Prompt Shields in Content Filters',           sub: 'Enable jailbreak and indirect attack detection in filter policies',           url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter#prompt-shields' },
      { title: 'Azure OpenAI Overview',                       sub: 'Azure OpenAI service overview and model capabilities',                        url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/overview' },
      { title: 'Azure OpenAI Pricing',                        sub: 'Token-based pricing - content filters included at no extra cost',             url: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/' },
    ],
  },
  {
    label: 'Azure AI Foundry & Responsible AI',
    color: C_PURPLE,
    icon: Globe,
    links: [
      { title: 'Azure AI Foundry Overview',                   sub: 'AI platform for building, evaluating, and deploying AI applications',         url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/what-is-ai-foundry' },
      { title: 'Content Safety in AI Foundry',               sub: 'Apply guardrails and content safety policies in Foundry projects',            url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/content-filtering' },
      { title: 'Microsoft Responsible AI Principles',         sub: 'Fairness, reliability, privacy, inclusiveness, transparency, accountability', url: 'https://www.microsoft.com/en-us/ai/responsible-ai' },
      { title: 'Responsible AI in Azure AI Services',         sub: 'RAI practices, transparency notes, and policy guidance',                     url: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview' },
      { title: 'Azure AI Content Safety Studio',             sub: 'Interactive portal for testing and configuring content safety',               url: 'https://contentsafety.cognitive.azure.com/' },
    ],
  },
  {
    label: 'Security & Identity',
    color: C_GREEN,
    icon: Lock,
    links: [
      { title: 'Managed Identity Overview',                   sub: 'Eliminate API key management with Azure AD-based authentication',            url: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview' },
      { title: 'Authenticate to Azure AI Services',           sub: 'API key vs. Entra ID (managed identity) authentication patterns',            url: 'https://learn.microsoft.com/en-us/azure/ai-services/authentication' },
      { title: 'Azure RBAC for Cognitive Services',           sub: 'Role assignments: Cognitive Services User, Contributor, Owner',              url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control' },
      { title: 'OWASP LLM Top 10',                           sub: 'Top 10 security risks for Large Language Model applications',                url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
      { title: 'Microsoft AI Red Team',                       sub: 'AI red-teaming methodology and tooling (PyRIT)',                            url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/red-teaming' },
    ],
  },
  {
    label: 'Regulatory Frameworks',
    color: C_RED,
    icon: BookOpen,
    links: [
      { title: 'EU AI Act',                                   sub: 'EU regulatory framework for artificial intelligence systems (2024)',         url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
      { title: 'FINRA Rule 3110',                             sub: 'Supervision requirements for AI-assisted communications and recommendations',  url: 'https://www.finra.org/rules-guidance/rulebook/finra-rules/3110' },
      { title: 'MiFID II (ESMA)',                             sub: 'Markets in Financial Instruments Directive - AI governance obligations',     url: 'https://www.esma.europa.eu/policy-rules/mifid-ii-and-mifir' },
      { title: 'SEC Rule 17a-4',                              sub: 'Electronic recordkeeping for AI-generated communications (broker-dealers)',   url: 'https://www.ecfr.gov/current/title-17/chapter-II/part-240/section-240.17a-4' },
      { title: 'HIPAA (HHS)',                                 sub: 'Health Insurance Portability and Accountability Act - PHI protection',       url: 'https://www.hhs.gov/hipaa/index.html' },
      { title: 'GDPR (Official Text)',                        sub: 'EU General Data Protection Regulation - applies to AI output PII',           url: 'https://gdpr-info.eu/' },
      { title: 'CCPA (California DOJ)',                       sub: 'California Consumer Privacy Act - consumer data rights',                     url: 'https://oag.ca.gov/privacy/ccpa' },
    ],
  },
]

function ReferencesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.7 }}>
        All claims, capability descriptions, security practices, and regulatory references on this page link to their primary official source below. Click any link to verify the documentation.
      </p>
      {REFERENCE_GROUPS.map((group, gi) => {
        const GIcon = group.icon
        return (
          <div key={gi}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: group.color.badge, border: `1px solid ${group.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GIcon size={13} color={group.color.text} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>{group.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
              {group.links.map((link, li) => (
                <a
                  key={li}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                    padding: '11px 14px', borderRadius: 8, textDecoration: 'none',
                    border: `1px solid ${group.color.border}`, background: group.color.bg,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = group.color.badge; e.currentTarget.style.borderColor = group.color.text }}
                  onMouseLeave={e => { e.currentTarget.style.background = group.color.bg; e.currentTarget.style.borderColor = group.color.border }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: group.color.text, marginBottom: 3 }}>{link.title}</div>
                    <div style={{ fontSize: 11, color: '#8fa3c0', lineHeight: 1.5, wordBreak: 'break-word' }}>{link.sub}</div>
                  </div>
                  <ExternalLink size={13} color={group.color.text} style={{ flexShrink: 0, marginTop: 2 }} />
                </a>
              ))}
            </div>
          </div>
        )
      })}

      <div style={{ borderTop: '1px solid #1e2d42', paddingTop: 18, marginTop: 4 }}>
        <p style={{ fontSize: 11, color: '#4d6480', lineHeight: 1.7 }}>
          Documentation is sourced from Microsoft Learn (learn.microsoft.com), official EU regulatory portals, FINRA, SEC ECFR, HHS, and OWASP.
          All links open in a new browser tab. Content was verified against documentation available as of April 2026.
          Regulatory references are provided for informational purposes only and do not constitute legal advice.
        </p>
      </div>
    </div>
  )
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function WhenToUsePage() {
  const [tab, setTab] = useState('overview')

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={22} color='#06b6d4' />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.02em' }}>When to Use What</h1>
            <p style={{ fontSize: 13, color: '#8fa3c0', marginTop: 2 }}>Content Safety API vs. Content Filters - Use cases, scenarios, patterns, and best practices</p>
          </div>
        </div>

        {/* Capability pill summary */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {[
            { label: 'Content Safety API', c: C_BLUE },
            { label: 'Content Filters', c: C_AMBER },
            { label: 'Decision Guide', c: C_GREEN },
            { label: '10 Scenarios', c: C_CYAN },
            { label: '5 Arch. Patterns', c: C_PURPLE },
            { label: 'Security Practices', c: C_RED },
            { label: 'Customer Guide', c: C_CYAN },
          ].map((pill, i) => (
            <span key={i} style={{ padding: '3px 10px', borderRadius: 6, background: pill.c.badge, color: pill.c.badgeText, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #1e2d42', marginBottom: 28 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: tab === t.id ? '#06b6d4' : '#4d6480',
              borderBottom: `2px solid ${tab === t.id ? '#06b6d4' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab />}
      {tab === 'decision'  && <DecisionTab />}
      {tab === 'scenarios' && <ScenariosTab />}
      {tab === 'patterns'  && <PatternsTab />}
      {tab === 'practices'  && <PracticesTab />}
      {tab === 'customer'   && <CustomerTab />}
      {tab === 'references' && <ReferencesTab />}

    </div>
  )
}
