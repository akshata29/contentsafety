"""
Pattern Pipeline Route

Demonstrates the five When-to-Use-What architectural patterns against realistic
capital-markets scenarios. Each pattern runs a targeted subset of Content Safety
services with flow-step annotations so the caller knows exactly which step in the
architecture caught (or cleared) the content and why.

Patterns:
  ingestion-shield       CS API only; screen before indexing / LLM call
  defense-in-depth       CS API pre + CF (platform, simulated) + CS API post
  multi-provider-safety  CS API wraps all model calls; CF only on Azure hops
  agent-safety           Prompt Shields user turn + tool results + Task Adherence
  tiered-safety          CF baseline all; CS API for premium / regulated tiers
"""
import asyncio
import time
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from models.schemas import (
    TextAnalysisRequest,
    PromptShieldRequest,
    ProtectedMaterialRequest,
    CustomCategoryRequest,
    GroundednessRequest,
    PIIDetectionRequest,
    TaskAdherenceRequest,
)
from services import (
    text_analysis,
    prompt_shields,
    protected_material,
    custom_categories,
    groundedness,
)
from services.pii_detection import detect_pii
from services.task_adherence import detect_task_adherence

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PatternPipelineRequest(BaseModel):
    pattern_id: str  # ingestion-shield | defense-in-depth | multi-provider-safety | agent-safety | tiered-safety
    text: str = Field(..., max_length=5000)
    grounding_source: Optional[str] = Field(default=None, max_length=10000)
    query: Optional[str] = None
    document_text: Optional[str] = None        # external doc / tool result for XPIA check
    tool_calls: Optional[List[Dict[str, Any]]] = None  # planned agent actions for task adherence
    tier: Optional[str] = "regulated"          # standard | premium | regulated (tiered-safety only)


class PatternServiceResult(BaseModel):
    service: str
    flow_step: str           # human-readable step label in the pattern flow
    flow_step_index: int     # 0-based position in the pattern architecture
    flow_step_type: str      # pre | model | post | gate | check | cf_platform | skipped
    ran: bool
    flagged: bool = False
    verdict: str             # FLAGGED | CLEAN | SKIPPED | ERROR | CF_PLATFORM
    detail: str = ""
    latency_ms: int = 0
    raw: Optional[Dict[str, Any]] = None


class PatternPipelineResponse(BaseModel):
    pattern_id: str
    verdict: str             # COMPLIANT | REVIEW | BLOCKED
    risk_score: int
    total_latency_ms: int
    violations: int
    checks: List[PatternServiceResult]
    regulatory_context: str
    recommended_action: str
    pattern_narrative: str


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _run(coro):
    t0 = time.monotonic()
    try:
        result = await coro
        return result, int((time.monotonic() - t0) * 1000), None
    except Exception as exc:
        return None, int((time.monotonic() - t0) * 1000), str(exc)


def _cf_platform(step_name: str, step_index: int, note: str) -> PatternServiceResult:
    return PatternServiceResult(
        service="Content Filters",
        flow_step=step_name,
        flow_step_index=step_index,
        flow_step_type="cf_platform",
        ran=False,
        flagged=False,
        verdict="CF_PLATFORM",
        detail=note,
        latency_ms=0,
    )


def _skipped(service: str, step_name: str, step_index: int, reason: str) -> PatternServiceResult:
    return PatternServiceResult(
        service=service,
        flow_step=step_name,
        flow_step_index=step_index,
        flow_step_type="skipped",
        ran=False,
        flagged=False,
        verdict="SKIPPED",
        detail=reason,
        latency_ms=0,
    )


# ---------------------------------------------------------------------------
# Result parsers
# ---------------------------------------------------------------------------

def _parse_cs(svc: str, idx: int, step: str, stype: str, result, ms: int, err: Optional[str]) -> PatternServiceResult:
    if err:
        return PatternServiceResult(
            service=svc, flow_step=step, flow_step_index=idx,
            flow_step_type=stype, ran=True, flagged=False,
            verdict="ERROR", detail=err, latency_ms=ms,
        )
    if result is None:
        return PatternServiceResult(
            service=svc, flow_step=step, flow_step_index=idx,
            flow_step_type=stype, ran=False, flagged=False,
            verdict="SKIPPED", detail="Service unavailable", latency_ms=ms,
        )

    flagged, detail, raw = False, "", {}
    slug = svc.lower()

    if "text analysis" in slug:
        flagged = result.flagged
        cats = [c.category for c in result.categories if c.severity >= 4]
        detail = (
            f"Severity {result.severity_max} -- flagged: {', '.join(cats)}"
            if cats else f"Max severity {result.severity_max} -- all categories within threshold"
        )
        raw = {"severity_max": result.severity_max, "categories": [c.dict() for c in result.categories]}

    elif "prompt shields" in slug:
        flagged = result.user_prompt_detected or result.documents_detected
        if result.user_prompt_detected:
            detail = "Jailbreak / adversarial injection detected in user prompt"
        elif result.documents_detected:
            detail = "Indirect injection (XPIA) attack detected in documents or tool results"
        else:
            detail = "No jailbreak or injection attack detected"
        raw = {
            "user_prompt_detected": result.user_prompt_detected,
            "documents_detected": result.documents_detected,
        }

    elif any(x in slug for x in ("market manipulation", "insider trading", "front running")):
        flagged = result.detected
        pct = int(result.confidence * 100)
        detail = f"Detected ({pct}% confidence)" if flagged else f"Not detected ({pct}% confidence)"
        raw = {"detected": result.detected, "confidence": result.confidence}

    elif "protected material" in slug:
        flagged = result.detected
        detail = (
            f"Protected content detected -- {result.citation}" if flagged
            else "No protected or copyrighted material found"
        )
        raw = {"detected": result.detected, "citation": result.citation}

    elif "groundedness" in slug:
        flagged = result.ungrounded
        detail = result.reasoning or (
            "Content is ungrounded -- hallucination risk" if flagged
            else "Content is grounded in provided sources"
        )
        raw = {"ungrounded": result.ungrounded, "confidence": result.confidence}

    return PatternServiceResult(
        service=svc, flow_step=step, flow_step_index=idx,
        flow_step_type=stype, ran=True, flagged=flagged,
        verdict="FLAGGED" if flagged else "CLEAN",
        detail=detail, latency_ms=ms, raw=raw,
    )


def _parse_pii(idx: int, step: str, result, ms: int, err: Optional[str]) -> PatternServiceResult:
    if err:
        return PatternServiceResult(
            service="PII Detection", flow_step=step, flow_step_index=idx,
            flow_step_type="check", ran=True, flagged=False,
            verdict="ERROR", detail=err, latency_ms=ms,
        )
    flagged = result.detected
    cats = ", ".join(sorted({e.category for e in result.entities[:6]}))
    detail = (
        f"Detected {result.entity_count} PII entities: {cats}" if flagged
        else "No PII entities detected"
    )
    return PatternServiceResult(
        service="PII Detection", flow_step=step, flow_step_index=idx,
        flow_step_type="check", ran=True, flagged=flagged,
        verdict="FLAGGED" if flagged else "CLEAN",
        detail=detail, latency_ms=ms,
        raw={"entity_count": result.entity_count, "categories": dict(result.category_summary)},
    )


def _parse_task_adherence(idx: int, step: str, result, ms: int, err: Optional[str]) -> PatternServiceResult:
    if err:
        return PatternServiceResult(
            service="Task Adherence", flow_step=step, flow_step_index=idx,
            flow_step_type="gate", ran=True, flagged=False,
            verdict="ERROR", detail=err, latency_ms=ms,
        )
    flagged = result.violation_detected
    sev = f" (severity {result.severity}/5)" if result.severity else ""
    detail = (
        f"{result.violation_type}{sev}: {result.details}" if flagged
        else (result.details or "Planned action is aligned with user intent")
    )
    return PatternServiceResult(
        service="Task Adherence", flow_step=step, flow_step_index=idx,
        flow_step_type="gate", ran=True, flagged=flagged,
        verdict="FLAGGED" if flagged else "CLEAN",
        detail=detail, latency_ms=ms,
        raw={
            "violation_detected": result.violation_detected,
            "violation_type": result.violation_type,
            "severity": result.severity,
        },
    )


# ---------------------------------------------------------------------------
# Pattern runners
# ---------------------------------------------------------------------------

async def _ingestion_shield(req: PatternPipelineRequest) -> List[PatternServiceResult]:
    """
    0  Text Analysis       -- harm categories on uploaded content
    1  Prompt Shields XPIA -- adversarial injection embedded in document
    2  Market Manipulation -- custom category domain screen
    3  Insider Trading     -- custom category domain screen
    4  Protected Material  -- copyright / IP detection
    """
    text = req.text
    doc = req.document_text or req.text

    tasks = [
        ("Text Analysis",       0, "Ingestion Screen -- Harm Categories",                   "pre"),
        ("Prompt Shields XPIA", 1, "Ingestion Screen -- Indirect Injection in Upload",       "pre"),
        ("Market Manipulation", 2, "Ingestion Screen -- Custom Category",                    "pre"),
        ("Insider Trading",     3, "Ingestion Screen -- Custom Category",                    "pre"),
        ("Protected Material",  4, "Ingestion Screen -- Copyright Detection",                "pre"),
    ]
    coros = [
        asyncio.to_thread(text_analysis.analyze_text, TextAnalysisRequest(text=text)),
        asyncio.to_thread(prompt_shields.analyze_prompt_shield, PromptShieldRequest(user_prompt="", documents=[doc[:4096]])),
        asyncio.to_thread(custom_categories.analyze_custom_category, CustomCategoryRequest(text=text[:1000], category_name="MarketManipulation")),
        asyncio.to_thread(custom_categories.analyze_custom_category, CustomCategoryRequest(text=text[:1000], category_name="InsiderTrading")),
        asyncio.to_thread(protected_material.detect_protected_material, ProtectedMaterialRequest(text=text)),
    ]
    raw = await asyncio.gather(*[_run(c) for c in coros])
    checks = [_parse_cs(svc, idx, step, stype, r, ms, err) for (svc, idx, step, stype), (r, ms, err) in zip(tasks, raw)]

    if not any(c.flagged for c in checks):
        checks.append(PatternServiceResult(
            service="Vector Index / LLM", flow_step="Content Cleared -- Proceed to Indexing", flow_step_index=5,
            flow_step_type="model", ran=False, flagged=False, verdict="CLEAN",
            detail="All ingestion checks passed. Safe to index into vector store or forward to LLM.",
            latency_ms=0,
        ))
    return checks


async def _defense_in_depth(req: PatternPipelineRequest) -> List[PatternServiceResult]:
    """
    0  CS API Prompt Shields  -- pre-inference: jailbreak detection (numeric audit scores)
    1  CS API Text Analysis   -- pre-inference: harm categories (numeric severity for audit)
    2  Content Filters        -- model layer: platform-enforced (simulated)
    3  CS API Groundedness    -- post-inference: hallucination detection
    4  CS API Protected Mat.  -- post-inference: copyright / IP screen
    """
    text = req.text
    tasks = [
        ("Prompt Shields", 0, "Pre-Inference -- Jailbreak + Injection Shield", "pre"),
        ("Text Analysis",  1, "Pre-Inference -- Harm Categories (numeric scores for MiFID II audit)", "pre"),
        ("Protected Material", 4, "Post-Inference -- Copyright / IP Screen", "post"),
    ]
    coros = [
        asyncio.to_thread(prompt_shields.analyze_prompt_shield, PromptShieldRequest(user_prompt=text)),
        asyncio.to_thread(text_analysis.analyze_text, TextAnalysisRequest(text=text)),
        asyncio.to_thread(protected_material.detect_protected_material, ProtectedMaterialRequest(text=text)),
    ]

    if req.grounding_source:
        tasks.append(("Groundedness", 3, "Post-Inference -- Hallucination Detection", "post"))
        coros.append(asyncio.to_thread(groundedness.detect_groundedness, GroundednessRequest(
            text=text, grounding_sources=req.grounding_source, query=req.query or "", reasoning=True,
        )))

    raw = await asyncio.gather(*[_run(c) for c in coros])
    checks = [_parse_cs(svc, idx, step, stype, r, ms, err) for (svc, idx, step, stype), (r, ms, err) in zip(tasks, raw)]

    checks.append(_cf_platform(
        "Model-Layer Enforcement -- Azure OpenAI Content Filters",
        2,
        "Platform-enforced by Azure OpenAI. Cannot be bypassed by application code. "
        "Fires synchronously during inference with no additional network round-trip. "
        "Failure mode (documented): when CF is unavailable, requests complete with HTTP 200 and no filtering -- "
        "the independent CS API call is the second failure boundary that prevents silent bypass.",
    ))
    if not req.grounding_source:
        checks.append(_skipped("Groundedness", "Post-Inference -- Hallucination Detection", 3,
                               "Provide a grounding source document to enable post-inference hallucination detection."))

    checks.sort(key=lambda c: c.flow_step_index)
    return checks


async def _multi_provider_safety(req: PatternPipelineRequest) -> List[PatternServiceResult]:
    """
    0  CS API Prompt Shields     -- pre-screen: all model paths (no CF for Llama / Claude)
    1  CS API Text Analysis      -- pre-screen: all model paths
    2  CS API Custom Categories  -- domain risk: all model paths
    3  Content Filters           -- Azure OpenAI / Foundry hops only (simulated)
    4  CS API Groundedness       -- post-screen: all model paths
    5  CS API Protected Material -- post-screen: all model paths
    """
    text = req.text
    tasks = [
        ("Prompt Shields",      0, "Pre-Screen All Models -- Jailbreak + Injection",        "pre"),
        ("Text Analysis",       1, "Pre-Screen All Models -- Harm Categories",               "pre"),
        ("Market Manipulation", 2, "Pre-Screen All Models -- Domain Custom Category",        "pre"),
        ("Front Running",       2, "Pre-Screen All Models -- Domain Custom Category",        "pre"),
        ("Protected Material",  5, "Post-Screen All Models -- Copyright Detection",          "post"),
    ]
    coros = [
        asyncio.to_thread(prompt_shields.analyze_prompt_shield, PromptShieldRequest(user_prompt=text)),
        asyncio.to_thread(text_analysis.analyze_text, TextAnalysisRequest(text=text)),
        asyncio.to_thread(custom_categories.analyze_custom_category, CustomCategoryRequest(text=text[:1000], category_name="MarketManipulation")),
        asyncio.to_thread(custom_categories.analyze_custom_category, CustomCategoryRequest(text=text[:1000], category_name="FrontRunning")),
        asyncio.to_thread(protected_material.detect_protected_material, ProtectedMaterialRequest(text=text)),
    ]

    if req.grounding_source:
        tasks.append(("Groundedness", 4, "Post-Screen All Models -- Hallucination Detection", "post"))
        coros.append(asyncio.to_thread(groundedness.detect_groundedness, GroundednessRequest(
            text=text, grounding_sources=req.grounding_source, query=req.query or "", reasoning=True,
        )))

    raw = await asyncio.gather(*[_run(c) for c in coros])
    checks = [_parse_cs(svc, idx, step, stype, r, ms, err) for (svc, idx, step, stype), (r, ms, err) in zip(tasks, raw)]

    checks.append(_cf_platform(
        "Azure OpenAI / Foundry Hops Only -- Content Filters",
        3,
        "Content Filters only attach to Azure OpenAI and AI Foundry model deployments. "
        "For Llama 3, Claude, Mistral, or any self-hosted model in this orchestration, "
        "this step does not exist -- CS API pre/post screening is the only available mechanism. "
        "This is the core architectural reason CS API is used here rather than relying on CF alone.",
    ))
    if not req.grounding_source:
        checks.append(_skipped("Groundedness", "Post-Screen All Models -- Hallucination Detection", 4,
                               "Add a grounding source to enable post-screen hallucination detection across all models."))

    checks.sort(key=lambda c: c.flow_step_index)
    return checks


async def _agent_safety(req: PatternPipelineRequest) -> List[PatternServiceResult]:
    """
    0  CS API Prompt Shields (user)     -- direct jailbreak on user turn
    1  Agent LLM + Content Filters      -- backbone (platform, simulated)
    2  CS API Prompt Shields (document) -- XPIA in tool result / retrieved doc
    3  CS API Task Adherence            -- planned action alignment gate
    4  CS API Groundedness              -- final output grounding
    """
    text = req.text
    doc = req.document_text or ""

    tasks = [
        ("Prompt Shields (User Turn)", 0, "User Turn -- Direct Jailbreak Detection", "pre"),
    ]
    coros = [
        asyncio.to_thread(prompt_shields.analyze_prompt_shield, PromptShieldRequest(user_prompt=text)),
    ]

    if doc:
        tasks.append(("Prompt Shields (Tool Result)", 2, "Tool Result / Retrieved Doc -- XPIA Detection", "gate"))
        coros.append(asyncio.to_thread(prompt_shields.analyze_prompt_shield,
                                       PromptShieldRequest(user_prompt="", documents=[doc[:4096]])))

    if req.tool_calls:
        conversation = [{"role": "user", "content": text}]
        tasks.append(("Task Adherence", 3, "Agent Action Gate -- Scope Alignment Check", "gate"))
        coros.append(asyncio.to_thread(detect_task_adherence, TaskAdherenceRequest(
            conversation=conversation, tool_calls=req.tool_calls,
        )))

    if req.grounding_source:
        tasks.append(("Groundedness", 4, "Final Output -- Hallucination Detection", "post"))
        coros.append(asyncio.to_thread(groundedness.detect_groundedness, GroundednessRequest(
            text=text, grounding_sources=req.grounding_source, query=req.query or "", reasoning=True,
        )))

    raw = await asyncio.gather(*[_run(c) for c in coros])
    checks = []
    for (svc, idx, step, stype), (r, ms, err) in zip(tasks, raw):
        if svc == "Task Adherence":
            checks.append(_parse_task_adherence(idx, step, r, ms, err))
        else:
            checks.append(_parse_cs(svc, idx, step, stype, r, ms, err))

    checks.append(_cf_platform(
        "Agent LLM Backbone -- Content Filters",
        1,
        "Platform-enforced at the LLM backbone: blocks harmful content the model produces. "
        "Does NOT screen tool return values or retrieved documents before they enter agent context -- "
        "that gap is covered by Prompt Shields for Documents (CS API, Step 2, XPIA detection). "
        "Task Adherence (CS API, Step 3) has no CF equivalent for action-level alignment.",
    ))

    if not doc:
        checks.append(_skipped("Prompt Shields (Tool Result)",
                               "Tool Result / Retrieved Doc -- XPIA Detection", 2,
                               "Provide document_text (retrieved email, search result, web page) to simulate XPIA."))
    if not req.tool_calls:
        checks.append(_skipped("Task Adherence", "Agent Action Gate -- Scope Alignment Check", 3,
                               "Provide tool_calls (planned agent actions) to run action alignment check."))
    if not req.grounding_source:
        checks.append(_skipped("Groundedness", "Final Output -- Hallucination Detection", 4,
                               "Add a grounding source to enable final output hallucination detection."))

    checks.sort(key=lambda c: c.flow_step_index)
    return checks


async def _tiered_safety(req: PatternPipelineRequest) -> List[PatternServiceResult]:
    """
    0  Content Filters (CF)   -- baseline all tenants (platform, simulated)
    1  Custom Categories      -- market-specific risk (premium + regulated tiers)
    2  PII Detection           -- data privacy (premium + regulated tiers)
    3  Groundedness            -- hallucination detection (regulated tier only)
    """
    tier = (req.tier or "regulated").lower()
    text = req.text
    is_premium = tier in ("premium", "regulated")
    is_regulated = tier == "regulated"

    tasks = []
    coros = []

    if is_premium:
        tasks += [
            ("Market Manipulation", 1, "Premium Tier -- Domain Custom Category", "check"),
            ("Insider Trading",     1, "Premium Tier -- Domain Custom Category", "check"),
            ("PII Detection",       2, "Premium Tier -- Data Privacy Screen",    "check"),
        ]
        coros += [
            asyncio.to_thread(custom_categories.analyze_custom_category, CustomCategoryRequest(text=text[:1000], category_name="MarketManipulation")),
            asyncio.to_thread(custom_categories.analyze_custom_category, CustomCategoryRequest(text=text[:1000], category_name="InsiderTrading")),
            asyncio.to_thread(detect_pii, PIIDetectionRequest(text=text)),
        ]

    if is_regulated and req.grounding_source:
        tasks.append(("Groundedness", 3, "Regulated Tier -- Hallucination Detection + Audit Log", "post"))
        coros.append(asyncio.to_thread(groundedness.detect_groundedness, GroundednessRequest(
            text=text, grounding_sources=req.grounding_source, query=req.query or "", reasoning=True,
        )))

    raw = await asyncio.gather(*[_run(c) for c in coros]) if coros else []
    checks = []
    for (svc, idx, step, stype), (r, ms, err) in zip(tasks, raw):
        if svc == "PII Detection":
            checks.append(_parse_pii(idx, step, r, ms, err))
        else:
            checks.append(_parse_cs(svc, idx, step, stype, r, ms, err))

    # CF baseline (always present -- platform layer)
    checks.insert(0, _cf_platform(
        "All Tenants -- Content Filters Baseline (Platform Layer)",
        0,
        "Zero-marginal-cost safety floor bundled with Azure OpenAI pricing. "
        "Platform-enforced and cannot be bypassed by tenant code. "
        "Applies uniformly to every API caller. "
        "Prerequisite: all tenant traffic must route through Azure OpenAI or AI Foundry -- "
        "the CF floor is not available for non-Azure model deployments.",
    ))

    if not is_premium:
        checks += [
            _skipped("Custom Categories", "Premium Tier -- Domain Custom Category", 1,
                     "Standard tier: Custom Categories not included. Upgrade to Premium for domain-specific risk detection."),
            _skipped("PII Detection", "Premium Tier -- Data Privacy Screen", 2,
                     "Standard tier: PII Detection not included. Upgrade to Premium for data privacy screening."),
        ]
    if not is_regulated:
        checks.append(_skipped("Groundedness", "Regulated Tier -- Hallucination Detection + Audit Log", 3,
                               "Regulated tier only. Standard and Premium tiers do not include Groundedness checking."))
    elif not req.grounding_source:
        checks.append(_skipped("Groundedness", "Regulated Tier -- Hallucination Detection + Audit Log", 3,
                               "Provide a grounding source to enable Groundedness checking for the regulated tier."))

    checks.sort(key=lambda c: c.flow_step_index)
    return checks


# ---------------------------------------------------------------------------
# Scoring and verdict synthesis
# ---------------------------------------------------------------------------

_WEIGHTS = {
    "Prompt Shields (User Turn)":    25,
    "Prompt Shields (Tool Result)":  20,
    "Prompt Shields":                20,
    "Prompt Shields XPIA":           20,
    "Task Adherence":                20,
    "Market Manipulation":           20,
    "Insider Trading":               20,
    "Front Running":                 15,
    "Text Analysis":                 15,
    "Groundedness":                  15,
    "PII Detection":                 10,
    "Protected Material":            10,
}

_NARRATIVES = {
    "ingestion-shield": (
        "Ingestion Shield pattern: all external content -- documents, uploads, trader communications -- "
        "passes through CS API before reaching the LLM or vector store. "
        "Content Filters are not applicable here: they only activate during Azure OpenAI inference calls "
        "and cannot screen documents or images before the model processes them. "
        "This is the primary reason CS API is the only viable mechanism for this pattern."
    ),
    "defense-in-depth": (
        "Defense in Depth pattern: CS API provides numeric 0-6 severity scores per category before and after inference -- "
        "the per-request quantified evidence required by MiFID II, FINRA, and HIPAA auditors. "
        "Content Filters provide the platform-enforced guarantee during inference that app-layer code cannot bypass. "
        "The independent CS API call also covers the documented CF failure mode: "
        "when CF is unavailable, requests complete with HTTP 200 and no filtering applied. "
        "Two independent safety boundaries, each catching what the other may miss."
    ),
    "multi-provider-safety": (
        "Multi-Provider Safety pattern: CS API is the only mechanism that applies uniformly across "
        "Azure OpenAI, Llama, Claude, Mistral, and any self-hosted or fine-tuned model. "
        "Content Filters are Azure OpenAI/AI Foundry exclusive -- for all other model hops, "
        "CS API pre- and post-screening is the only available safety mechanism. "
        "Centralising CS API calls in the orchestrator prevents per-team safety policy drift "
        "when different teams or products use different underlying models."
    ),
    "agent-safety": (
        "Agent Safety pattern: agents face three attack surfaces that simple chat does not. "
        "(1) User turn -- direct jailbreak: Prompt Shields detects override attempts before inference. "
        "(2) Tool results and retrieved documents -- XPIA: Prompt Shields for Documents screens external content "
        "for adversarial instructions before they enter agent context; Content Filters do not screen tool return values. "
        "(3) Planned agent actions -- misaligned tool use: Task Adherence detects when the agent plans an action "
        "outside the user intent (e.g. execute trade when asked for analysis); no CF equivalent exists."
    ),
    "tiered-safety": (
        "Tiered Safety pattern: Content Filters provide a zero-marginal-cost platform safety floor for all tenants -- "
        "bundled with Azure OpenAI pricing, platform-enforced, cannot be bypassed by tenant code. "
        "Premium tenants add CS API Custom Categories for domain-specific risk that standard harm categories miss. "
        "Regulated tenants add CS API PII Detection and Groundedness for per-request audit evidence. "
        "Known constraints: Custom Categories (standard) is English-only, max 3 per resource, takes hours to train. "
        "Prerequisite: all tenant traffic must flow through Azure OpenAI or AI Foundry."
    ),
}

_REGULATORY = {
    "COMPLIANT": (
        "All pattern-specific safety checks passed. "
        "Content cleared for downstream processing. "
        "Log check results to the audit trail per SEC 17a-4 and MiFID II Article 25 retention requirements."
    ),
    "REVIEW": (
        "One or more low-severity signals detected. "
        "Under FCA Market Abuse Regulation (MAR) and SEC Rule 10b-5, borderline content must be reviewed before action. "
        "Suspend automated processing and route to the compliance review queue within 24 hours."
    ),
    "BLOCKED": (
        "Critical violations detected. "
        "MiFID II Article 16(2) and FINRA Rule 2010 require escalation to the Chief Compliance Officer. "
        "MAR Article 16 mandates regulator notification within one business day if market abuse is suspected. "
        "Do not allow this content to reach trading systems or clients."
    ),
}

_ACTIONS = {
    "COMPLIANT": "Content cleared. Log to audit trail and proceed with downstream processing.",
    "REVIEW": "Route to compliance officer. Suspend automated processing pending human review.",
    "BLOCKED": "BLOCK. Escalate to Chief Compliance Officer. File SAR if market abuse is confirmed.",
}


def _synthesize(pattern_id: str, checks: List[PatternServiceResult]):
    live = [c for c in checks if c.ran and c.verdict not in ("CF_PLATFORM", "SKIPPED")]
    flagged_w = sum(_WEIGHTS.get(c.service, 10) for c in live if c.flagged)
    total_w = sum(_WEIGHTS.get(c.service, 10) for c in live)
    risk_score = int((flagged_w / max(total_w, 1)) * 100)
    violations = sum(1 for c in live if c.flagged)

    if violations == 0:
        verdict = "COMPLIANT"
    elif risk_score >= 30:
        verdict = "BLOCKED"
    else:
        verdict = "REVIEW"

    return (
        verdict,
        risk_score,
        violations,
        _REGULATORY[verdict],
        _ACTIONS[verdict],
        _NARRATIVES.get(pattern_id, ""),
    )


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

_RUNNERS = {
    "ingestion-shield":       _ingestion_shield,
    "defense-in-depth":       _defense_in_depth,
    "multi-provider-safety":  _multi_provider_safety,
    "agent-safety":           _agent_safety,
    "tiered-safety":          _tiered_safety,
}


@router.post("/pattern-pipeline", response_model=PatternPipelineResponse)
async def run_pattern_pipeline(req: PatternPipelineRequest):
    runner = _RUNNERS.get(req.pattern_id)
    if not runner:
        raise HTTPException(status_code=400, detail=f"Unknown pattern_id: {req.pattern_id!r}")

    t0 = time.monotonic()
    checks = await runner(req)
    verdict, risk_score, violations, reg_ctx, rec_action, narrative = _synthesize(req.pattern_id, checks)
    total_ms = int((time.monotonic() - t0) * 1000)

    return PatternPipelineResponse(
        pattern_id=req.pattern_id,
        verdict=verdict,
        risk_score=risk_score,
        total_latency_ms=total_ms,
        violations=violations,
        checks=checks,
        regulatory_context=reg_ctx,
        recommended_action=rec_action,
        pattern_narrative=narrative,
    )
