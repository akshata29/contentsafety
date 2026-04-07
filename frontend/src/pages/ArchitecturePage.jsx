import { useState } from 'react'
import {
  Monitor, Server, GitMerge, ShieldCheck, Image, Zap,
  CheckCircle, BookOpen, Tag, ListFilter, Activity, Fingerprint,
  Shield, Globe, Layers, Cpu, Lock, X, ChevronRight,
  Database, AlertTriangle, BarChart2,
} from 'lucide-react'

// ── Card type color tokens ──────────────────────────────────────────────────
const CARD_COLORS = {
  service:       { border: '#3b82f6', icon: '#60a5fa', bg: 'rgba(59,130,246,0.07)',  badge: 'rgba(59,130,246,0.18)',  badgeText: '#93c5fd', dot: '#3b82f6' },
  orchestration: { border: '#8b5cf6', icon: '#a78bfa', bg: 'rgba(139,92,246,0.07)', badge: 'rgba(139,92,246,0.18)', badgeText: '#c4b5fd', dot: '#8b5cf6' },
  'ai-platform': { border: '#7c3aed', icon: '#a78bfa', bg: 'rgba(124,58,237,0.07)', badge: 'rgba(124,58,237,0.18)', badgeText: '#c4b5fd', dot: '#7c3aed' },
  auth:          { border: '#f59e0b', icon: '#fbbf24', bg: 'rgba(245,158,11,0.07)',  badge: 'rgba(245,158,11,0.18)',  badgeText: '#fcd34d', dot: '#f59e0b' },
  store:         { border: '#06b6d4', icon: '#22d3ee', bg: 'rgba(6,182,212,0.07)',   badge: 'rgba(6,182,212,0.18)',   badgeText: '#67e8f9', dot: '#06b6d4' },
}

// ── Architecture items ──────────────────────────────────────────────────────
const ARCH_ITEMS = [
  // ── Frontend ───────────────────────────────────────────────────────────────
  {
    id: 'frontend', label: 'React Frontend', sublabel: 'Vite 5.4 · port 5173', type: 'service', icon: Monitor,
    detail: {
      badge: 'Frontend',
      description: 'Single-page application built with React 18.3 and Vite 5.4. Provides 27+ pages covering the full Content Safety and Foundry Control Plane feature set. Uses react-router-dom v6 for client-side routing with a persistent sidebar layout. Styled entirely with CSS custom properties — no Tailwind.',
      dataFlow: [
        '1. User navigates to a page — react-router-dom renders the matching component',
        '2. Component calls fetch() against the FastAPI backend at /api/*',
        '3. The Layout component (Sidebar + Header + Outlet) wraps every page',
        '4. Recharts renders interactive bar/pie charts for analytics and quota data',
        '5. lucide-react provides all icons; clsx handles conditional class names',
        '6. CSS variables in index.css drive the dark theme (--bg-base, --accent-blue, etc.)',
      ],
      keyFacts: [
        'React 18.3 with concurrent rendering; no class components',
        'Vite 5.4 with @vitejs/plugin-react for hot module replacement',
        'react-router-dom 6.27 — all routes defined in App.jsx',
        'Recharts 2.13 for bar charts (quota, analytics) and pie charts (dashboard)',
        'lucide-react 0.462 for all icons (SVG, tree-shaken)',
        '27 routes across 4 navigation sections in Sidebar.jsx',
        'No Redux or Zustand — local useState per component',
        'Proxied via Vite dev server; no CORS issues in development',
      ],
      designDecision: 'Inline CSS with CSS custom properties was chosen over Tailwind CSS to avoid a build-time dependency and keep the bundle lean for a demo tool. The CSS variable system (60+ tokens in index.css) provides the same theming capability with zero configuration overhead.',
      files: ['frontend/src/App.jsx', 'frontend/src/main.jsx', 'frontend/src/index.css', 'frontend/vite.config.js', 'frontend/package.json', 'frontend/src/components/Layout/Layout.jsx', 'frontend/src/components/Layout/Sidebar.jsx', 'frontend/src/components/Layout/Header.jsx'],
      technology: ['React 18.3', 'Vite 5.4', 'react-router-dom 6.27', 'Recharts 2.13', 'lucide-react 0.462', 'clsx 2.1'],
    },
  },
  // ── Backend ────────────────────────────────────────────────────────────────
  {
    id: 'backend', label: 'FastAPI Backend', sublabel: 'FastAPI 0.115 · port 8000', type: 'service', icon: Server,
    detail: {
      badge: 'Backend API',
      description: 'FastAPI application with 5 routers covering all Content Safety, Compliance Pipeline, Content Filters, Foundry Control Plane, and Demo Data endpoints. Starts with a lifespan event that provisions demo blocklists, custom category incidents, and Foundry guardrails in the background. CORS is configured for localhost:5173 and localhost:3000.',
      dataFlow: [
        '1. Uvicorn receives HTTP request and dispatches to FastAPI',
        '2. CORSMiddleware validates origin before routing',
        '3. FastAPI router matches path and calls route handler',
        '4. Route handler delegates to service module (text_analysis, foundry_mgmt, etc.)',
        '5. Service calls Azure SDK or httpx REST client',
        '6. Pydantic response model validates and serialises the response',
        '7. Static files under /data/ are served directly (test images, etc.)',
      ],
      keyFacts: [
        'FastAPI 0.115.4 with async lifespan context manager',
        'Uvicorn 0.32 with --reload in development',
        '5 routers: /api/content-safety, /api/compliance, /api/content-filters, /api/foundry, /api/demo',
        'Pydantic 2.9 for all request/response models (schemas.py)',
        'pydantic-settings 2.6 reads .env from parent directory of backend/',
        'Windows SelectorEventLoop policy set at startup for aiohttp/SDK compatibility',
        'Background task provisions 4 custom category incidents at startup',
        'Static mount at /data/ serves test_flagged.jpg for image demo',
      ],
      designDecision: 'FastAPI was chosen over Flask for its native async support, automatic OpenAPI docs at /docs, and first-class Pydantic integration. The async lifespan pattern ensures demo resources are provisioned before the first request without blocking server startup.',
      files: ['backend/main.py', 'backend/config.py', 'backend/models/schemas.py', 'backend/routes/content_safety.py', 'backend/routes/compliance_pipeline.py', 'backend/routes/content_filters.py', 'backend/routes/foundry_control.py', 'backend/routes/demo_data.py'],
      technology: ['FastAPI 0.115.4', 'uvicorn 0.32', 'Pydantic 2.9', 'pydantic-settings 2.6', 'python-dotenv 1.0', 'python-multipart 0.0.12'],
    },
  },
  // ── Orchestration ──────────────────────────────────────────────────────────
  {
    id: 'pipeline', label: 'Compliance Pipeline', sublabel: 'asyncio.gather · parallel', type: 'orchestration', icon: GitMerge,
    detail: {
      badge: 'Orchestration',
      description: 'Runs 6-7 Content Safety services in parallel via asyncio.gather against a single trader communication or AI-generated text. Each service contributes a weighted verdict to produce a unified 0-100 risk score aligned to MiFID II Art. 16/25, FINRA Rule 3110, and SEC 17a-4. Returns PASS (<30), REVIEW (30-69), or BLOCK (>=70).',
      dataFlow: [
        '1. POST /api/compliance/pipeline with {text, grounding_source?, query?}',
        '2. Build coroutine dict for 6 mandatory checks + optional groundedness',
        '3. asyncio.gather runs all service coroutines concurrently',
        '4. Each result is mapped to a PipelineServiceResult with flagged/verdict/latency',
        '5. Weighted scores accumulate: Prompt Shields=20, Custom Categories=55 total, etc.',
        '6. Final score = sum(weight * flagged) / total_weight * 100',
        '7. Content Filter event recorded for analytics',
        '8. PipelineResponse returned with score, verdict, per-service breakdown',
      ],
      keyFacts: [
        'Parallel execution via asyncio.gather — all 6-7 checks run simultaneously',
        'Risk weights: Prompt Shields=20, Insider Trading=20, Market Manipulation=20, Front Running=15, Text Analysis=15, Protected Material=10, Groundedness=10',
        'Groundedness check only runs when grounding_source is provided in the request',
        'Service errors become ERROR verdicts; pipeline never raises 500 on partial failure',
        'Full latency is bounded by the slowest service (typically Custom Categories ~400 ms)',
        'Wall-clock latency returned in response for performance benchmarking',
        'Result recorded in filter analytics deque for the Filter Analytics dashboard',
        'Regulatory context (MiFID II, FINRA, SEC) attached to BLOCK/REVIEW verdicts',
      ],
      designDecision: 'asyncio.gather was chosen over a thread pool because all Content Safety services are I/O-bound HTTP calls. The gather approach avoids thread contention and GIL issues, and naturally surfaces partial failures without blocking the entire pipeline.',
      files: ['backend/routes/compliance_pipeline.py', 'backend/services/text_analysis.py', 'backend/services/prompt_shields.py', 'backend/services/custom_categories.py', 'backend/services/protected_material.py', 'backend/services/groundedness.py'],
      technology: ['asyncio', 'FastAPI', 'Python 3.11'],
    },
  },
  // ── Content Safety Services ────────────────────────────────────────────────
  {
    id: 'text_analysis', label: 'Text Analysis', sublabel: 'SDK 1.0.0 · harm categories', type: 'service', icon: ShieldCheck,
    detail: {
      badge: 'Content Safety',
      description: 'Detects Hate, Sexual, Violence, and SelfHarm content in trader communications using the azure-ai-contentsafety SDK 1.0.0. Returns per-category severity scores (0-6 scale) and blocklist matches. Severity >= 4 triggers a flagged verdict. Capital markets presets include threat messages, violent language, and harassment in trading contexts.',
      dataFlow: [
        '1. TextAnalysisRequest received with text, optional categories filter, optional blocklist_names',
        '2. ContentSafetyClient constructed with AzureKeyCredential and custom transport',
        '3. AnalyzeTextOptions built with categories and blocklist_names',
        '4. SDK client.analyze_text() called synchronously',
        '5. AnalyzeTextResult mapped to CategoryResult list with severity and filtered flag',
        '6. Blocklist matches extracted from result.blocklists_match',
        '7. TextAnalysisResponse returned: flagged, categories, blocklist_matches, severity_max',
      ],
      keyFacts: [
        'Harm categories: Hate, Sexual, Violence, SelfHarm',
        'Severity scale: 0 (safe) to 6 (high risk); flagged threshold is severity >= 4',
        'Custom blocklists (up to 10) can be scanned in the same call',
        'azure-ai-contentsafety 1.0.0 SDK with custom aiohttp transport for SSL retry',
        'API version: 2024-09-01',
        'Capital markets scenario: violence/threats in trade approval disputes',
        'Blocklist check catches ticker symbols, counterparty names, sanctioned terms',
        'Synchronous call wrapped in run_in_executor for pipeline parallelism',
      ],
      files: ['backend/services/text_analysis.py', 'backend/routes/content_safety.py', 'backend/services/_transport.py'],
      technology: ['azure-ai-contentsafety 1.0.0', 'Azure Key Credential', 'httpx'],
    },
  },
  {
    id: 'image_analysis', label: 'Image Analysis', sublabel: 'SDK 1.0.0 · visual content', type: 'service', icon: Image,
    detail: {
      badge: 'Content Safety',
      description: 'Classifies images for harmful visual content (Hate, Sexual, Violence, SelfHarm) using the azure-ai-contentsafety SDK. Accepts image URLs or base64-encoded uploads. For the demo test image (test_flagged.jpg), a representative mock violence response (severity 6) is returned because the real API cannot read text overlaid on images.',
      dataFlow: [
        '1. POST /api/content-safety/analyze/image with URL or base64',
        '2. If filename contains "test_flagged", return mock Violence severity=6 response',
        '3. For real images, construct ImageAnalysisRequest and call image_analysis service',
        '4. ContentSafetyClient.analyze_image() called with ImageData (url or base64)',
        '5. Per-category ImageAnalysisResult mapped to CategoryResult list',
        '6. ImageAnalysisResponse returned: flagged, severity_max, categories',
      ],
      keyFacts: [
        'Supports URL input and binary file upload (multipart/form-data)',
        'The Content Safety Image API is a visual scene classifier -- it does NOT read overlaid text (no OCR)',
        'Test asset: backend/data/test_flagged.jpg served at /data/test_flagged.jpg',
        'Real uploaded images always go to live API; only the demo asset is mocked',
        'Maximum image size: 4 MB; JPEG, PNG, GIF, BMP supported',
        'API version: 2024-09-01 (same as text)',
      ],
      files: ['backend/services/image_analysis.py', 'backend/routes/content_safety.py'],
      technology: ['azure-ai-contentsafety 1.0.0', 'Pillow 11.0', 'python-multipart 0.0.12'],
    },
  },
  {
    id: 'prompt_shields', label: 'Prompt Shields', sublabel: 'REST 2024-02-15-preview', type: 'service', icon: Zap,
    detail: {
      badge: 'Content Safety',
      description: 'Detects User Prompt attacks (jailbreak) and Document indirect attacks (XPIA) via the Content Safety REST API. Called directly with httpx because the azure-ai-contentsafety SDK 1.0.0 does not include Prompt Shields models. Used in both the standalone Prompt Shields page and as the highest-weight check (20) in the Compliance Pipeline.',
      dataFlow: [
        '1. PromptShieldRequest received: userPrompt + optional documents[]',
        '2. REST POST to {endpoint}/contentsafety/text:shieldPrompt?api-version=2024-02-15-preview',
        '3. Ocp-Apim-Subscription-Key header carries the Content Safety API key',
        '4. JSON response parsed: userPromptAnalysis.attackDetected + documentsAnalysis[]',
        '5. PromptShieldResponse built: user_prompt_detected, documents_detected, per-doc AttackResult',
      ],
      keyFacts: [
        'API version: 2024-02-15-preview',
        'Detects DAN, role-play jailbreak, "ignore previous instructions", and similar attacks',
        'Indirect attacks (XPIA): malicious instructions embedded in documents, emails, tool outputs',
        'Not in SDK 1.0.0 -- direct REST call via httpx sync_post helper',
        'Weight in Compliance Pipeline: 20 (highest alongside custom categories)',
        'Capital markets example: trader overriding AI safety to execute unauthorized trade',
        'Documents field accepts strings (email bodies, report text, tool call results)',
      ],
      files: ['backend/services/prompt_shields.py', 'backend/services/_transport.py'],
      technology: ['httpx 0.27', 'Azure Content Safety REST API'],
    },
  },
  {
    id: 'groundedness', label: 'Groundedness', sublabel: 'REST 2024-02-15-preview', type: 'service', icon: CheckCircle,
    detail: {
      badge: 'Content Safety',
      description: 'Detects whether AI-generated text is grounded in the provided source documents. Used to verify that AI-generated research reports cite and accurately represent the source data rather than hallucinating statistics, ratings, or regulatory guidance.',
      dataFlow: [
        '1. GroundednessRequest: text (AI output), grounding_sources, query, task (QnA or Summarization)',
        '2. REST POST to {endpoint}/contentsafety/text:detectGroundedness',
        '3. For QnA task, the qna.query field is included in the payload',
        '4. Response: ungroundedDetected, ungroundedPercentage, ungroundedDetails[]',
        '5. Optional AI reasoning field explains which segments contradict the sources',
      ],
      keyFacts: [
        'API version: 2024-02-15-preview',
        'Task modes: QnA (question + answer verification) and Summarization',
        'Returns ungroundedPercentage as a float 0.0-1.0',
        'ungroundedDetails lists specific text segments that contradict the grounding sources',
        'Reasoning field (optional) explains why a segment is ungrounded',
        'Weight in Compliance Pipeline: 10 (conditional -- only when grounding_source provided)',
        'Capital markets: verify AI analyst note is grounded in actual earnings data',
      ],
      files: ['backend/services/groundedness.py', 'backend/services/_transport.py'],
      technology: ['httpx 0.27', 'Azure Content Safety REST API'],
    },
  },
  {
    id: 'protected_material', label: 'Protected Material', sublabel: 'REST · copyright detect', type: 'service', icon: BookOpen,
    detail: {
      badge: 'Content Safety',
      description: 'Detects whether AI-generated text reproduces copyrighted material such as third-party analyst reports, proprietary research, or licensed financial data. Important for capital markets firms that license content from Bloomberg, Refinitiv, or independent research providers.',
      dataFlow: [
        '1. ProtectedMaterialRequest with text to check',
        '2. REST POST to Content Safety protected material endpoint',
        '3. Response: protectedMaterialDetected (bool), citationDetected (bool), detectionResult details',
        '4. ProtectedMaterialResponse returned to caller',
      ],
      keyFacts: [
        'Detects reproduction of copyrighted text: news articles, analyst reports, research papers',
        'Weight in Compliance Pipeline: 10',
        'API version: 2024-02-15-preview',
        'Not in SDK 1.0.0 -- direct REST call',
        'Capital markets: prevent AI from reproducing licensed Bloomberg Intelligence or Morgan Stanley research verbatim',
      ],
      files: ['backend/services/protected_material.py', 'backend/routes/content_safety.py'],
      technology: ['httpx 0.27', 'Azure Content Safety REST API'],
    },
  },
  {
    id: 'custom_categories', label: 'Custom Categories', sublabel: 'Incidents API · fin crime', type: 'service', icon: Tag,
    detail: {
      badge: 'Content Safety',
      description: 'Detects financial crime language using the Content Safety Incidents API. Four capital-markets-specific categories are provisioned at startup: MarketManipulation, InsiderTrading, FrontRunning, and FinancialFraud. Each incident is defined with a description and 2-3 example phrases, then deployed to the Content Safety resource.',
      dataFlow: [
        '1. provision_demo_incidents() at startup: PATCH incident, POST addIncidentSamples, POST deploy',
        '2. CustomCategoryRequest: text + category_name (MarketManipulation, InsiderTrading, etc.)',
        '3. REST POST to {endpoint}/contentsafety/text:detectIncidents with incidentName',
        '4. Response: incidentDetected (bool), incidentDetails',
        '5. CustomCategoryResponse returned with detected flag and detail',
      ],
      keyFacts: [
        'API version: 2024-02-15-preview',
        'Incidents deployed at startup: fin-market-manipulation, fin-insider-trading, fin-front-running, fin-financial-fraud',
        'Three checks run in parallel in Compliance Pipeline: MarketManipulation=20, InsiderTrading=20, FrontRunning=15',
        'Incidents use keyword + semantic matching, not pure keyword blocklist',
        'Example phrases: "push the price up before the announcement", "trade before the merger is announced"',
        'Requires Content Safety resource to be live; demo mode simulates responses',
        'Categories map: MarketManipulation -> fin-market-manipulation, etc. (URL-safe names)',
      ],
      files: ['backend/services/custom_categories.py', 'backend/routes/content_safety.py'],
      technology: ['httpx 0.27', 'Azure Content Safety Incidents API'],
    },
  },
  {
    id: 'blocklist', label: 'Blocklist Manager', sublabel: 'SDK 1.0.0 · sanctions', type: 'service', icon: ListFilter,
    detail: {
      badge: 'Content Safety',
      description: 'Manages firm-specific prohibited term lists using the azure-ai-contentsafety SDK. Pre-provisions a demo blocklist at startup with capital markets terms: restricted ISIN codes, sanctioned counterparty names, prohibited terms like "front-run", "layering", "spoofing", and "painting the tape". Blocklist checks are embedded in Text Analysis calls.',
      dataFlow: [
        '1. provision_demo_blocklist() at startup creates "capital-markets-demo" blocklist',
        '2. SDK: BlocklistsOperations.create_or_update_text_blocklist()',
        '3. SDK: BlocklistsOperations.add_or_update_blocklist_items() adds all demo terms',
        '4. At analysis time: blocklist_names=["capital-markets-demo"] in AnalyzeTextOptions',
        '5. Blocklist matches returned in AnalyzeTextResult.blocklists_match[]',
      ],
      keyFacts: [
        'SDK method: ContentSafetyClient.blocklists operations (included in 1.0.0)',
        'Demo blocklist: capital-markets-demo with 20+ financial crime terms',
        'Terms include: ISIN codes, counterparty IDs, "front-run", "wash trade", "spoofing"',
        'Multiple blocklists supported (up to 10 per request)',
        'UI can add/remove terms; CRUD operations exposed via /api/content-safety/blocklists endpoints',
        'Blocklist matches are separate from harm category violations; both can trigger a BLOCK verdict',
      ],
      files: ['backend/services/blocklist.py', 'backend/routes/content_safety.py'],
      technology: ['azure-ai-contentsafety 1.0.0'],
    },
  },
  {
    id: 'task_adherence', label: 'Task Adherence', sublabel: 'Azure OpenAI · gpt-4o', type: 'service', icon: Activity,
    detail: {
      badge: 'Content Safety',
      description: 'Verifies that an AI agent\'s tool calls and responses are aligned with its assigned role and task definition. Uses Azure OpenAI gpt-4o to evaluate whether the agent\'s actions are within its authorised scope. Critical for preventing trading AI from executing trades, data exfiltration, or scope creep.',
      dataFlow: [
        '1. TaskAdherenceRequest: task_description, tool_calls[], agent_response',
        '2. Structured prompt sent to Azure OpenAI gpt-4o deployment',
        '3. GPT-4o evaluates alignment on a 0.0-1.0 scale',
        '4. Misaligned actions (e.g. "execute trade" when role is "advisory only") flagged',
        '5. TaskAdherenceResponse: adherent (bool), score (float), violations[], reasoning',
      ],
      keyFacts: [
        'Uses Azure OpenAI gpt-4o for structured evaluation',
        'Alignment threshold: score >= 0.70 = adherent; below = REVIEW/BLOCK',
        'Tool calls are evaluated against both the system prompt role definition and the declared task',
        'Capital markets example: advisor AI attempting trade execution (scope violation)',
        'Falls back to demo mode if AZURE_OPENAI_ENDPOINT not configured',
        'openai 1.55.0 SDK targeting Azure OpenAI endpoint',
      ],
      files: ['backend/services/task_adherence.py', 'backend/routes/content_safety.py'],
      technology: ['openai 1.55.0', 'Azure OpenAI gpt-4o'],
    },
  },
  {
    id: 'pii_detection', label: 'PII Detection', sublabel: 'Language REST 2023-04-01', type: 'service', icon: Fingerprint,
    detail: {
      badge: 'Content Safety',
      description: 'Detects Personally Identifiable Information in text using the Azure AI Language PII Entity Recognition API. Identifies names, SSNs, credit card numbers, email addresses, phone numbers, government IDs, and Azure credentials in AI-generated communications before client distribution.',
      dataFlow: [
        '1. PIIDetectionRequest: text, optional categories filter, domain setting',
        '2. REST POST to {language_endpoint}/language/:analyze-text?api-version=2023-04-01',
        '3. Request body: kind=PiiEntityRecognition, documents[{id, language, text}]',
        '4. Response: results.documents[0].entities[] with text, category, offset, length',
        '5. PIIDetectionResponse: entities[], redactedText with [REDACTED] substitutions',
      ],
      keyFacts: [
        'API version: 2023-04-01',
        'Requires Azure AI Language endpoint (dedicated Language resource or multi-service AI Services)',
        'Does NOT work with a dedicated Content Safety resource endpoint',
        'Fallback chain: AZURE_AI_LANGUAGE_ENDPOINT > AZURE_AI_SERVICES_ENDPOINT',
        'PII categories: Name, PhoneNumber, Email, CreditCardNumber, SSN, Organization, AzureSubscriptionKey, etc.',
        'Financial domain setting enables finance-specific entity recognition',
        'redactedText replaces detected entities with [REDACTED] at exact character offsets',
      ],
      files: ['backend/services/pii_detection.py', 'backend/routes/content_safety.py'],
      technology: ['httpx 0.27', 'Azure AI Language REST API 2023-04-01'],
    },
  },
  {
    id: 'content_filters', label: 'Content Filters', sublabel: 'Foundry API 2025-05-15-preview', type: 'service', icon: Shield,
    detail: {
      badge: 'Content Filters',
      description: 'Manages Azure AI Foundry guardrail configurations (content filters) and tests their enforcement on real model and agent invocations. Exposes CRUD for guardrail profiles, live model/agent tests with pre-built capital markets scenarios, permissive vs. strict comparison, and an in-memory filter analytics event store.',
      dataFlow: [
        '1. PATCH /guardrails to create or update a Foundry guardrail policy',
        '2. Authenticate: ML bearer token via service-principal OAuth 2.0',
        '3. POST to Foundry project data-plane: /capabilities/connections/guardrails',
        '4. Model test: POST to /deployments/{name}/chat/completions with guardrail header',
        '5. Agent test: POST to /agents/{id}/messages through Foundry threads API',
        '6. Block event recorded to _FILTER_EVENTS deque (maxlen=1000)',
        '7. GET /analytics returns windowed block rate, category breakdown, entity heatmap',
      ],
      keyFacts: [
        'Foundry data-plane API version: 2025-05-15-preview',
        'Auth scope: https://ai.azure.com/.default (NOT cognitiveservices -- different audience)',
        'In-memory event store: collections.deque maxlen=1000, thread-safe with Lock',
        '7 pre-built model test scenarios: jailbreak, MNPI, market manipulation, XPIA, violence, CTR structuring, clean baseline',
        'Guardrail profiles: Permissive (warn-only), Standard (block on high severity), Strict (block on medium+)',
        'Filter analytics: block rate per hour, top blocked categories, entity heatmap',
        'provision_demo_guardrails_and_agents() fires at startup as background task',
      ],
      files: ['backend/services/content_filters.py', 'backend/routes/content_filters.py'],
      technology: ['httpx 0.27', 'Azure AI Foundry data-plane REST API', 'azure-identity 1.19.0'],
    },
  },
  {
    id: 'foundry_mgmt', label: 'Foundry Management', sublabel: 'azure-ai-projects 1.0.0b10', type: 'service', icon: Globe,
    detail: {
      badge: 'Foundry Control Plane',
      description: 'Aggregates AI fleet management data from multiple Azure APIs: agents via azure-ai-projects SDK, model deployments and guardrail policies via azure-mgmt-cognitiveservices, and security alerts via ARM REST (Defender for Cloud). All results cached with a 120-second TTL to avoid redundant API calls across dashboard refreshes.',
      dataFlow: [
        '1. GET /api/foundry/* endpoint is called by the frontend',
        '2. TTL cache checked; if fresh, return cached data',
        '3. _has_credentials() checks for service principal env vars',
        '4. If credentials present: SDK/REST calls to Azure APIs',
        '5. If no credentials: generate synthetic demo data via mock_data.py',
        '6. For agents: AIProjectClient.agents.list() via azure-ai-projects',
        '7. For deployments: CognitiveServicesManagementClient.deployments.list()',
        '8. Security alerts: ARM REST /subscriptions/{sub}/providers/Microsoft.Security/alerts',
        '9. Result cached and returned as JSON',
      ],
      keyFacts: [
        'azure-ai-projects 1.0.0b10 SDK for agent fleet enumeration',
        'azure-mgmt-cognitiveservices 13.5.0 for model deployments, RAI policies, quota',
        'azure-identity 1.19.0 ClientSecretCredential for service principal auth',
        'ARM REST for Defender for Cloud security alerts (no Python SDK for this endpoint)',
        'TTL cache: 120 seconds per endpoint; refreshable via POST /api/foundry/cache/refresh',
        'Mock data: 30 agents, 20 model deployments, 15 compliance policies, 25 security alerts',
        'All sync SDK calls wrapped in asyncio run_in_executor to avoid blocking the event loop',
      ],
      files: ['backend/services/foundry_mgmt.py', 'backend/routes/foundry_control.py', 'backend/services/mock_data.py'],
      technology: ['azure-ai-projects 1.0.0b10', 'azure-mgmt-cognitiveservices 13.5.0', 'azure-identity 1.19.0', 'httpx 0.27'],
    },
  },
  // ── Cloud Services ──────────────────────────────────────────────────────────
  {
    id: 'az_content_safety', label: 'Azure AI Content Safety', sublabel: 'SDK 1.0.0 · REST 2024-09-01', type: 'ai-platform', icon: ShieldCheck,
    detail: {
      badge: 'Azure Cloud',
      description: 'Azure AI Content Safety is the primary moderation and safety detection service. Provides text harm analysis (Hate, Sexual, Violence, SelfHarm), image analysis, prompt shield detection, groundedness verification, protected material detection, custom incident categories, blocklist management, and task adherence. REST API version 2024-09-01 for newer features.',
      dataFlow: [
        '1. SDK calls use ContentSafetyClient with AzureKeyCredential',
        '2. REST calls use Ocp-Apim-Subscription-Key header',
        '3. Endpoint resolves via: CONTENT_SAFETY_ENDPOINT > AZURE_AI_SERVICES_ENDPOINT',
        '4. Newer features (Prompt Shields, Groundedness) use 2024-02-15-preview API version',
        '5. Custom categories use Incidents API to define, train, and deploy categories',
      ],
      keyFacts: [
        'SDK: azure-ai-contentsafety 1.0.0 (text, image, blocklists)',
        'REST API versions: 2024-09-01 (stable), 2024-02-15-preview (newer features)',
        'Supported: text analysis, image analysis, prompt shields, groundedness, protected material, custom incidents, blocklists',
        'Endpoint type: dedicated Content Safety resource or multi-service AI Services (SKU S0)',
        'Authentication: API key via Ocp-Apim-Subscription-Key header or AzureKeyCredential',
        'Region: East US recommended for all preview features',
      ],
      files: ['backend/services/text_analysis.py', 'backend/services/prompt_shields.py', 'backend/services/groundedness.py', 'backend/services/protected_material.py', 'backend/services/custom_categories.py', 'backend/services/blocklist.py'],
      technology: ['azure-ai-contentsafety 1.0.0', 'Azure Content Safety REST API 2024-09-01'],
    },
  },
  {
    id: 'az_foundry', label: 'Azure AI Foundry', sublabel: 'azure-ai-projects 1.0.0b10', type: 'ai-platform', icon: Layers,
    detail: {
      badge: 'Azure Cloud',
      description: 'Azure AI Foundry provides the agent fleet management infrastructure, model deployment hosting, and guardrail enforcement. The platform uses Foundry both as a managed data-plane resource for guardrail configuration and as an inventory source for the Control Plane governance views.',
      dataFlow: [
        '1. Foundry project data-plane endpoint from FOUNDRY_PROJECT_ENDPOINT env var',
        '2. Guardrail CRUD via Foundry capabilities/connections/guardrails API',
        '3. Agent fleet enumeration via AIProjectClient.agents.list()',
        '4. Model deployments via CognitiveServicesManagementClient',
        '5. Bearer token for data-plane: https://ai.azure.com/.default (ML audience)',
      ],
      keyFacts: [
        'SDK: azure-ai-projects 1.0.0b10 (preview)',
        'Control-plane SDK: azure-mgmt-cognitiveservices 13.5.0',
        'Foundry projects are backed by Azure ML workspaces',
        'Guardrail API requires ML-scope bearer token, NOT cognitiveservices scope',
        'Agent threads API version: 2025-01-01-preview',
        'Guardrail API version: 2025-05-15-preview',
      ],
      files: ['backend/services/foundry_mgmt.py', 'backend/services/content_filters.py'],
      technology: ['azure-ai-projects 1.0.0b10', 'azure-mgmt-cognitiveservices 13.5.0'],
    },
  },
  {
    id: 'az_openai', label: 'Azure OpenAI', sublabel: 'openai 1.55.0 · gpt-4o', type: 'ai-platform', icon: Cpu,
    detail: {
      badge: 'Azure Cloud',
      description: 'Azure OpenAI provides the gpt-4o model used for Task Adherence evaluation. The openai 1.55.0 SDK targets the Azure OpenAI endpoint and deployment name from environment variables. Deployment version 2024-11-20 is the recommended stable version.',
      dataFlow: [
        '1. AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY loaded from settings',
        '2. openai.AzureOpenAI client constructed with api_version=2024-09-01-preview',
        '3. chat.completions.create() called with gpt-4o deployment name',
        '4. Structured evaluation prompt sent for task adherence scoring',
        '5. Response parsed for alignment score and violation details',
      ],
      keyFacts: [
        'SDK: openai 1.55.0',
        'Deployment: gpt-4o (version 2024-11-20)',
        'API version: 2024-09-01-preview',
        'Used exclusively for Task Adherence -- other services do NOT call OpenAI',
        'Falls back to mock structured evaluation in demo mode',
        'Accepts both AZURE_OPENAI_API_KEY and AZURE_OPENAI_KEY env var names (settings effective_openai_key property)',
      ],
      files: ['backend/services/task_adherence.py', 'backend/config.py'],
      technology: ['openai 1.55.0', 'Azure OpenAI gpt-4o 2024-11-20'],
    },
  },
  {
    id: 'az_language', label: 'Azure AI Language', sublabel: 'REST 2023-04-01 · PII', type: 'ai-platform', icon: Database,
    detail: {
      badge: 'Azure Cloud',
      description: 'Azure AI Language provides PII Entity Recognition, identifying names, financial account numbers, government IDs, and contact information in AI-generated communications. Requires a dedicated Language resource or multi-service AI Services resource (NOT a dedicated Content Safety resource).',
      dataFlow: [
        '1. Endpoint from: AZURE_AI_LANGUAGE_ENDPOINT > AZURE_AI_SERVICES_ENDPOINT',
        '2. API key from: AZURE_AI_LANGUAGE_API_KEY > CONTENT_SAFETY_API_KEY',
        '3. POST /language/:analyze-text?api-version=2023-04-01',
        '4. Request body: kind=PiiEntityRecognition with document and pii domain',
        '5. Response entities include text, category, offset, length for each PII item',
      ],
      keyFacts: [
        'REST API version: 2023-04-01',
        'PII task: PiiEntityRecognition',
        'Financial domain: recognises account numbers, ISIN codes, financial identifiers',
        'NOT available on a dedicated Content Safety resource endpoint',
        'Multi-service AI Services (SKU S0) supports both Content Safety and Language APIs',
        'redactedText returned with [REDACTED] replacing PII at exact character positions',
      ],
      files: ['backend/services/pii_detection.py', 'backend/config.py'],
      technology: ['httpx 0.27', 'Azure AI Language REST 2023-04-01'],
    },
  },
  {
    id: 'az_identity', label: 'Azure Identity', sublabel: 'azure-identity 1.19.0', type: 'auth', icon: Lock,
    detail: {
      badge: 'Azure Auth',
      description: 'Provides ClientSecretCredential for authenticating the service principal used to access Foundry Control Plane management APIs. Required for the azure-mgmt-cognitiveservices client and ARM REST calls for Defender alerts. Not required for Content Safety API key calls.',
      dataFlow: [
        '1. AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET loaded from settings',
        '2. ClientSecretCredential instantiated per API call (not cached at module level)',
        '3. Used with CognitiveServicesManagementClient(credential, subscription_id)',
        '4. ARM token fetched separately via OAuth 2.0 POST for Defender REST calls',
        '5. ML-scope token (ai.azure.com/.default) fetched for Foundry data-plane calls',
      ],
      keyFacts: [
        'SDK: azure-identity 1.19.0',
        'Credential type: ClientSecretCredential (service principal)',
        'Required scopes: management.azure.com (ARM), ai.azure.com (Foundry data-plane)',
        'Role required: Cognitive Services Contributor on the resource group',
        'All Foundry Management features degrade gracefully to synthetic data if credentials missing',
        'azure-mgmt-resource 23.1 used for resource group enumeration',
      ],
      files: ['backend/services/foundry_mgmt.py', 'backend/services/content_filters.py', 'backend/config.py'],
      technology: ['azure-identity 1.19.0', 'ClientSecretCredential', 'OAuth 2.0'],
    },
  },
]

// ── Section layout ──────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'frontend',    label: 'Frontend Layer',             items: ['frontend'] },
  { id: 'backend',     label: 'Backend API',                items: ['backend'] },
  { id: 'orch',        label: 'Orchestration',              items: ['pipeline'] },
  { id: 'cs',          label: 'Content Safety Services',    items: ['text_analysis','image_analysis','prompt_shields','groundedness','protected_material','custom_categories','blocklist','task_adherence','pii_detection'] },
  { id: 'infra',       label: 'Platform Services',          items: ['content_filters','foundry_mgmt'] },
  { id: 'cloud',       label: 'Azure Cloud Services',       items: ['az_content_safety','az_foundry','az_openai','az_language','az_identity'] },
]

// ── ArchCard component ──────────────────────────────────────────────────────
function ArchCard({ item, selected, onSelect }) {
  const c = CARD_COLORS[item.type] || CARD_COLORS.service
  const Icon = item.icon
  const isSelected = selected === item.id
  return (
    <div
      onClick={() => onSelect(isSelected ? null : item.id)}
      style={{
        background: isSelected ? c.bg : 'var(--bg-card)',
        border: `1px solid ${isSelected ? c.border : (isSelected ? c.border : 'var(--border-light)')}`,
        borderLeft: `3px solid ${c.border}`,
        borderRadius: 'var(--radius)',
        padding: '0.6rem 0.75rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
        minWidth: 0,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = c.bg }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card)' }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        background: c.badge, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={c.icon} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </div>
        <div style={{ fontSize: '0.65rem', color: c.icon, lineHeight: 1.3, marginTop: 1 }}>
          {item.sublabel}
        </div>
      </div>
      {isSelected && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <ChevronRight size={13} color={c.icon} />
        </div>
      )}
    </div>
  )
}

// ── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ item, onClose }) {
  if (!item) return null
  const c = CARD_COLORS[item.type] || CARD_COLORS.service
  const Icon = item.icon
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
      overflowY: 'auto', zIndex: 200, display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: c.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: c.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={c.icon} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: c.icon, background: c.badge, padding: '2px 7px', borderRadius: 20 }}>
              {item.detail.badge}
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>{item.label}</div>
            <div style={{ fontSize: '0.7rem', color: c.icon }}>{item.sublabel}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>

        <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {item.detail.description}
        </p>

        {/* Data Flow */}
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DATA FLOW</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {item.detail.dataFlow.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: c.icon, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', flexShrink: 0, minWidth: 18, marginTop: 1 }}>{i + 1}.</span>
                <span>{step.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Facts */}
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>KEY FACTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {item.detail.keyFacts.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: c.dot, flexShrink: 0, marginTop: 5, width: 5, height: 5, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Design Decision */}
        {item.detail.designDecision && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', marginBottom: '0.4rem' }}>DESIGN DECISION</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.detail.designDecision}</p>
          </div>
        )}

        {/* Source Files */}
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SOURCE FILES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {item.detail.files.map((f, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: '#7dd3fc', background: 'rgba(125,211,252,0.06)', padding: '2px 8px', borderRadius: 4 }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Technology Tags */}
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TECHNOLOGY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {item.detail.technology.map((t, i) => (
              <span key={i} style={{ fontSize: '0.65rem', color: c.badgeText, background: c.badge, padding: '2px 9px', borderRadius: 20, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ArchitecturePage() {
  const [selected, setSelected] = useState(null)

  const itemMap = Object.fromEntries(ARCH_ITEMS.map(i => [i.id, i]))
  const selectedItem = selected ? itemMap[selected] : null

  return (
    <div style={{ display: 'flex', minHeight: '100%', background: 'var(--bg-base)' }}>
      {/* Main content */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', paddingRight: selectedItem ? '440px' : '1.5rem', transition: 'padding-right 0.2s ease' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Architecture</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            End-to-end system architecture — Azure services, data flows, and design decisions. Click any component for details.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '0.6rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          {Object.entries(CARD_COLORS).map(([type, c]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          ))}
        </div>

        {/* Sections */}
        {SECTIONS.map(section => {
          const items = section.items.map(id => itemMap[id]).filter(Boolean)
          return (
            <div key={section.id} style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem', padding: '0 0.25rem' }}>
                {section.label}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: items.length === 1 ? '1fr' : items.length === 2 ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.5rem',
              }}>
                {items.map(item => (
                  <ArchCard key={item.id} item={item} selected={selected} onSelect={setSelected} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Stats footer */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span><strong style={{ color: 'var(--text-primary)' }}>16</strong> components</span>
          <span><strong style={{ color: 'var(--accent-blue)' }}>9</strong> Content Safety APIs</span>
          <span><strong style={{ color: 'var(--accent-purple)' }}>1</strong> Orchestration pipeline</span>
          <span><strong style={{ color: 'var(--accent-purple)' }}>5</strong> Azure cloud services</span>
          <span><strong style={{ color: 'var(--accent-amber)' }}>1</strong> Auth layer</span>
        </div>
      </div>

      {/* Detail panel */}
      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelected(null)} />}
    </div>
  )
}
