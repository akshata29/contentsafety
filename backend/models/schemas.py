"""Pydantic request/response schemas."""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------

class CategoryResult(BaseModel):
    category: str
    severity: int
    filtered: bool = False


class AnalysisResult(BaseModel):
    flagged: bool
    categories: List[CategoryResult]
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Text Analysis
# ---------------------------------------------------------------------------

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., max_length=10000)
    categories: Optional[List[str]] = None
    output_type: str = "FourSeverityLevels"
    blocklist_names: Optional[List[str]] = None


class TextAnalysisResponse(BaseModel):
    flagged: bool
    categories: List[CategoryResult]
    blocklist_matches: List[str] = []
    severity_max: int = 0


# ---------------------------------------------------------------------------
# Image Analysis
# ---------------------------------------------------------------------------

class ImageAnalysisRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None


class ImageAnalysisResponse(BaseModel):
    flagged: bool
    categories: List[CategoryResult]
    severity_max: int = 0


# ---------------------------------------------------------------------------
# Prompt Shields
# ---------------------------------------------------------------------------

class PromptShieldRequest(BaseModel):
    user_prompt: str = Field(..., max_length=10000)
    documents: Optional[List[str]] = Field(default=None, max_length=5)


class AttackResult(BaseModel):
    attack_detected: bool
    attack_type: Optional[str] = None


class PromptShieldResponse(BaseModel):
    user_prompt_detected: bool
    documents_detected: bool
    user_prompt_result: AttackResult
    documents_results: List[AttackResult] = []


# ---------------------------------------------------------------------------
# Groundedness Detection
# ---------------------------------------------------------------------------

class GroundednessRequest(BaseModel):
    domain: str = "Finance"
    task: str = "QnA"
    query: Optional[str] = None
    text: str = Field(..., max_length=7500)
    grounding_sources: str = Field(..., max_length=55000)
    reasoning: bool = False


class GroundednessResponse(BaseModel):
    ungrounded: bool
    contradicting_segments: List[Dict[str, Any]] = []
    confidence: float = 0.0
    reasoning: Optional[str] = None
    api_raw_response: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Protected Material Detection
# ---------------------------------------------------------------------------

class ProtectedMaterialRequest(BaseModel):
    text: str = Field(..., max_length=10000)


class ProtectedMaterialResponse(BaseModel):
    detected: bool
    citation: Optional[str] = None
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    match_type: Optional[str] = None
    ip_risk_level: Optional[str] = None
    confidence: float = 0.0


# ---------------------------------------------------------------------------
# Custom Categories
# ---------------------------------------------------------------------------

class CustomCategoryRequest(BaseModel):
    text: str = Field(..., max_length=1000)
    category_name: str


class CustomCategoryResponse(BaseModel):
    detected: bool
    category: str
    confidence: float = 0.0


# ---------------------------------------------------------------------------
# Blocklist Management
# ---------------------------------------------------------------------------

class BlocklistItem(BaseModel):
    text: str
    description: Optional[str] = None


class BlocklistRequest(BaseModel):
    blocklist_name: str
    items: List[BlocklistItem]


class BlocklistResponse(BaseModel):
    blocklist_name: str
    item_count: int
    items: List[BlocklistItem]


# ---------------------------------------------------------------------------
# Task Adherence
# ---------------------------------------------------------------------------

class TaskAdherenceRequest(BaseModel):
    conversation: List[Dict[str, str]]
    tool_calls: Optional[List[Dict[str, Any]]] = None


class TaskAdherenceResponse(BaseModel):
    violation_detected: bool
    violation_type: Optional[str] = None
    details: Optional[str] = None
    severity: Optional[int] = None
    api_raw_response: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# PII Detection
# ---------------------------------------------------------------------------

class PIIDetectionRequest(BaseModel):
    text: str = Field(..., max_length=10000)
    categories: Optional[List[str]] = None   # None = detect all
    domain: str = "none"                      # "none" or "phi" (HIPAA)


class PIIEntity(BaseModel):
    text: str
    category: str
    subcategory: Optional[str] = None
    offset: int
    length: int
    confidence: float


class PIIDetectionResponse(BaseModel):
    detected: bool
    entity_count: int
    entities: List[PIIEntity]
    redacted_text: str
    category_summary: Dict[str, int]


# ---------------------------------------------------------------------------
# Compliance Pipeline (combined multi-service analysis)
# ---------------------------------------------------------------------------

class PipelineRequest(BaseModel):
    text: str = Field(..., max_length=5000)
    grounding_source: Optional[str] = Field(default=None, max_length=10000)
    query: Optional[str] = None


class PipelineServiceResult(BaseModel):
    service: str                       # e.g. "Text Analysis"
    ran: bool = True
    flagged: bool = False
    verdict: str = "CLEAN"            # CLEAN | FLAGGED | SKIPPED | ERROR
    detail: Optional[str] = None       # human-readable summary
    latency_ms: int = 0
    raw: Optional[Dict[str, Any]] = None


class PipelineResponse(BaseModel):
    verdict: str                        # COMPLIANT | REVIEW | BLOCKED
    risk_score: int                     # 0-100
    total_latency_ms: int
    violations: int
    checks: List[PipelineServiceResult]
    regulatory_context: str             # narrative for the demo story
    recommended_action: str


# ---------------------------------------------------------------------------
# Content Filters / Guardrails (Azure AI Foundry)
# ---------------------------------------------------------------------------

class GuardrailControl(BaseModel):
    type: str                                   # Jailbreak, ContentSafety, IndirectAttack, PII, TaskAdherence, ProtectedMaterial, Blocklist
    category: Optional[str] = None             # For ContentSafety: Hate, Violence, Sexual, SelfHarm
    threshold: Optional[str] = None            # low, medium, high
    intervention_points: List[str] = []        # UserInput, Output, Documents
    action: str = "Block"                       # Block, Annotate


class GuardrailAssociation(BaseModel):
    type: str                                   # ModelDeployment, Agent
    id: str


class GuardrailSummary(BaseModel):
    name: str
    type: Optional[str] = None                 # System, Model, Agent
    applied_to: List[str] = []
    control_types: List[str] = []
    created_at: Optional[str] = None
    last_modified: Optional[str] = None
    is_system: bool = False


class GuardrailCreateRequest(BaseModel):
    name: str
    controls: List[GuardrailControl]
    associations: List[GuardrailAssociation] = []
    streaming_mode: str = "Default"


class FilterCategoryResult(BaseModel):
    category: str
    filtered: bool
    severity: str = "safe"                     # safe, low, medium, high
    point: str = "input"                       # input, output


class ModelFilterTestRequest(BaseModel):
    deployment: str
    messages: List[Dict[str, str]]
    system_prompt: str = ""
    filter_type: Optional[str] = None  # e.g. "pii" — enables supplemental checks


class ModelFilterTestResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    blocked: bool
    deployment: str
    block_reason: Optional[str] = None
    filter_categories: List[FilterCategoryResult] = []
    model_response: Optional[str] = None
    usage: Optional[Dict[str, Any]] = None


class AgentFilterTestRequest(BaseModel):
    agent_id: str
    agent_name: str = ""
    message: str
    filter_type: str = ""
    planned_tool_call: Optional[Dict[str, Any]] = None


class AgentFilterTestResponse(BaseModel):
    agent_id: str
    agent_name: str
    thread_id: Optional[str] = None
    run_id: Optional[str] = None
    status: str
    guardrail_triggered: bool
    assistant_response: Optional[str] = None
    filter_events: List[Dict[str, Any]] = []
    run_details: Optional[Dict[str, Any]] = None


class FilterConfigResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    label: str
    description: str
    color: str
    blocked: bool
    categories: List[FilterCategoryResult] = []
    model_response: Optional[str] = None


class FilterCompareRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    system_prompt: str = ""


class FilterCompareResponse(BaseModel):
    text: str
    deployment: str
    configs: List[FilterConfigResult]


# ---------------------------------------------------------------------------
# Foundry Control Plane
# ---------------------------------------------------------------------------

class AgentInfo(BaseModel):
    id: str
    name: str
    platform: str
    status: str
    health_score: float
    cost_usd: float
    token_usage: int
    run_completion_rate: float
    compliance_status: str
    alerts: int
    tags: List[str] = []


class ModelDeployment(BaseModel):
    id: str
    name: str
    model: str
    version: str
    region: str
    quota_used: float
    quota_limit: float
    content_filter_enabled: bool
    prompt_shield_enabled: bool
    abuse_monitoring_enabled: bool
    compliance_status: str


class CompliancePolicy(BaseModel):
    id: str
    name: str
    scope: str
    controls: List[str]
    violations: int
    total_assets: int
    status: str


class SecurityAlert(BaseModel):
    id: str
    severity: str
    title: str
    description: str
    resource: str
    timestamp: str
    source: str
    status: str


class QuotaInfo(BaseModel):
    model: str
    region: str
    deployment: str
    used: int
    limit: int
    unit: str


class FoundryOverview(BaseModel):
    active_agents: int
    total_models: int
    run_completion_rate: float
    compliance_score: float
    prevented_behaviors: int
    cost_this_month_usd: float
    total_token_usage: int
    open_alerts: int
    agents: List[AgentInfo]
    deployments: List[ModelDeployment]
    policies: List[CompliancePolicy]
    security_alerts: List[SecurityAlert]
    quotas: List[QuotaInfo]
