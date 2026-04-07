"""
Compliance Pipeline Route
Runs all applicable Content Safety services in parallel against a single input,
then synthesises a unified compliance decision with regulatory context.

Business story: A capital markets firm's AI system ingests trader communications,
research outputs, and AI-generated content. Before any of it reaches clients or
trading systems every piece of content must pass through a multi-layer safety
pipeline aligned to MiFID II (Art. 16, 25), FINRA Rule 3110, and SEC 17a-4.
"""
import asyncio
import time
from fastapi import APIRouter, HTTPException

from models.schemas import (
    PipelineRequest, PipelineResponse, PipelineServiceResult,
    TextAnalysisRequest, PromptShieldRequest, ProtectedMaterialRequest,
    CustomCategoryRequest, GroundednessRequest,
)
from services import text_analysis, prompt_shields, protected_material, custom_categories, groundedness
from services.content_filters import record_filter_event

router = APIRouter()

# Custom category checks most relevant for unstructured trader text
_CUSTOM_CATEGORIES = ["MarketManipulation", "InsiderTrading", "FrontRunning"]

# Risk weights per service (used to compute 0-100 score)
_WEIGHTS = {
    "Text Analysis":       15,
    "Prompt Shields":      20,
    "Market Manipulation": 20,
    "Insider Trading":     20,
    "Front Running":       15,
    "Protected Material":  10,
    "Groundedness":        10,  # only counted when grounding source provided
}


async def _run(coro, service_name: str) -> PipelineServiceResult:
    t0 = time.monotonic()
    try:
        result = await coro
        ms = int((time.monotonic() - t0) * 1000)
        return result, ms, None
    except Exception as e:
        ms = int((time.monotonic() - t0) * 1000)
        return None, ms, str(e)


@router.post("/pipeline", response_model=PipelineResponse)
async def run_pipeline(req: PipelineRequest):
    wall_start = time.monotonic()

    # Build coroutines — all service functions are synchronous (blocking SDK/HTTP calls),
    # so wrap each with asyncio.to_thread to run them concurrently in a thread pool
    # without blocking the event loop.
    coros = {
        "Text Analysis": asyncio.to_thread(
            text_analysis.analyze_text,
            TextAnalysisRequest(text=req.text),
        ),
        "Prompt Shields": asyncio.to_thread(
            prompt_shields.analyze_prompt_shield,
            PromptShieldRequest(user_prompt=req.text),
        ),
        "Market Manipulation": asyncio.to_thread(
            custom_categories.analyze_custom_category,
            CustomCategoryRequest(text=req.text, category_name="MarketManipulation"),
        ),
        "Insider Trading": asyncio.to_thread(
            custom_categories.analyze_custom_category,
            CustomCategoryRequest(text=req.text, category_name="InsiderTrading"),
        ),
        "Front Running": asyncio.to_thread(
            custom_categories.analyze_custom_category,
            CustomCategoryRequest(text=req.text, category_name="FrontRunning"),
        ),
        "Protected Material": asyncio.to_thread(
            protected_material.detect_protected_material,
            ProtectedMaterialRequest(text=req.text),
        ),
    }

    if req.grounding_source:
        coros["Groundedness"] = asyncio.to_thread(
            groundedness.detect_groundedness,
            GroundednessRequest(
                text=req.text,
                grounding_sources=req.grounding_source,
                query=req.query or "",
                reasoning=True,
            ),
        )

    # Run all in parallel
    keys = list(coros.keys())
    raw_results = await asyncio.gather(*[_run(c, k) for k, c in coros.items()], return_exceptions=False)

    # Build per-service result objects
    checks: list[PipelineServiceResult] = []
    weighted_score = 0
    total_weight = 0
    violations = 0

    for key, (result, ms, err) in zip(keys, raw_results):
        weight = _WEIGHTS.get(key, 10)
        total_weight += weight

        if err:
            checks.append(PipelineServiceResult(
                service=key, ran=True, flagged=False,
                verdict="ERROR", detail=err, latency_ms=ms,
            ))
            continue

        flagged = False
        detail = ""
        raw_data = {}

        if key == "Text Analysis":
            flagged = result.flagged
            cats_flagged = [c.category for c in result.categories if c.severity >= 4]
            if cats_flagged:
                detail = f"Severity {result.severity_max} — flagged: {', '.join(cats_flagged)}"
            elif result.blocklist_matches:
                flagged = True
                detail = f"Blocklist matches: {', '.join(result.blocklist_matches)}"
            else:
                detail = f"Max severity {result.severity_max} — all categories within threshold"
            raw_data = {"severity_max": result.severity_max, "categories": [c.dict() for c in result.categories]}

        elif key == "Prompt Shields":
            flagged = result.user_prompt_detected or result.documents_detected
            if result.user_prompt_detected:
                detail = "Jailbreak / adversarial prompt injection detected"
            elif result.documents_detected:
                detail = "Indirect (XPIA) document attack detected"
            else:
                detail = "No jailbreak or injection attack detected"
            raw_data = {"user_prompt_detected": result.user_prompt_detected, "documents_detected": result.documents_detected}

        elif key in ("Market Manipulation", "Insider Trading", "Front Running"):
            flagged = result.detected
            conf_pct = int(result.confidence * 100)
            detail = f"Detected ({conf_pct}% confidence)" if flagged else f"Not detected ({conf_pct}% confidence)"
            raw_data = {"detected": result.detected, "confidence": result.confidence}

        elif key == "Protected Material":
            flagged = result.detected
            detail = f"Protected content detected — {result.citation}" if flagged else "No protected/copyrighted material found"
            raw_data = {"detected": result.detected, "citation": result.citation}

        elif key == "Groundedness":
            flagged = result.ungrounded
            detail = result.reasoning or ("Content is ungrounded — hallucination risk" if flagged else "Content is grounded in provided sources")
            raw_data = {"ungrounded": result.ungrounded, "confidence": result.confidence}

        if flagged:
            violations += 1
            weighted_score += weight

        checks.append(PipelineServiceResult(
            service=key, ran=True, flagged=flagged,
            verdict="FLAGGED" if flagged else "CLEAN",
            detail=detail, latency_ms=ms, raw=raw_data,
        ))

    # Add SKIPPED marker for groundedness when no source provided
    if not req.grounding_source:
        checks.append(PipelineServiceResult(
            service="Groundedness", ran=False,
            verdict="SKIPPED",
            detail="Provide a grounding source document to enable hallucination detection",
            latency_ms=0,
        ))
        # Don't count groundedness weight in denominator
        total_weight -= _WEIGHTS.get("Groundedness", 0)

    risk_score = int((weighted_score / max(total_weight, 1)) * 100)

    # Determine verdict
    if violations == 0:
        verdict = "COMPLIANT"
    elif risk_score >= 35:
        verdict = "BLOCKED"
    else:
        verdict = "REVIEW"

    # Determine recommended action with regulatory framing
    if verdict == "COMPLIANT":
        recommended_action = "Content cleared for processing. Log to audit trail per SEC 17a-4 retention requirements."
        regulatory_context = (
            "This communication has passed all Capital Markets AI safety checks. "
            "Under MiFID II Article 16 and FINRA Rule 3110, firms must surveil all electronic communications. "
            "A clean pipeline result confirms no market abuse, AI manipulation, or IP violations were detected."
        )
    elif verdict == "REVIEW":
        recommended_action = "Route to compliance officer for manual review. Suspend AI-assisted processing until reviewed."
        regulatory_context = (
            "One or more low-severity signals were detected. "
            "Under FCA Market Abuse Regulation (MAR) and SEC Rule 10b-5, borderline communications must be reviewed before action. "
            "Recommend logging this event and scheduling a compliance review within 24 hours."
        )
    else:
        recommended_action = "BLOCK — Do not process. Escalate to Chief Compliance Officer. File SAR if market abuse is confirmed."
        regulatory_context = (
            "Critical violations detected. "
            "MiFID II Article 16(2) requires firms to detect and report suspected market manipulation. "
            "FINRA Rule 2010 prohibits deceptive acts. MAR Article 16 mandates reporting to the regulator within one business day. "
            "This content must not reach trading systems or clients."
        )

    total_ms = int((time.monotonic() - wall_start) * 1000)

    # Record flagged checks to the Filter Analytics event store
    if verdict in ("BLOCKED", "REVIEW"):
        _SERVICE_TO_CATEGORY = {
            "Prompt Shields": None,  # handled below based on sub-type
            "Text Analysis": None,   # handled below based on flagged categories
            "Market Manipulation": "Market Manipulation",
            "Insider Trading": "Insider Trading",
            "Front Running": "Front Running",
            "Protected Material": "Protected Material",
            "Groundedness": "Content Safety",
        }
        for chk in checks:
            if not chk.flagged:
                continue
            svc = chk.service
            sev = "High" if verdict == "BLOCKED" else "Medium"
            if svc == "Prompt Shields":
                raw = getattr(chk, "raw", {}) or {}
                cat = "Indirect Attack" if raw.get("documents_detected") else "Jailbreak"
            elif svc == "Text Analysis":
                raw = getattr(chk, "raw", {}) or {}
                cats_flagged = [c["category"] for c in raw.get("categories", []) if c.get("severity", 0) >= 4]
                cat = cats_flagged[0] if cats_flagged else "Content Safety"
            else:
                cat = _SERVICE_TO_CATEGORY.get(svc, svc)
            if cat:
                record_filter_event(
                    entity="compliance-pipeline",
                    entity_type="Pipeline",
                    guardrail="CompliancePipeline",
                    category=cat,
                    severity=sev,
                    action="Blocked",
                    preview=req.text[:120],
                )

    return PipelineResponse(
        verdict=verdict,
        risk_score=risk_score,
        total_latency_ms=total_ms,
        violations=violations,
        checks=checks,
        regulatory_context=regulatory_context,
        recommended_action=recommended_action,
    )
