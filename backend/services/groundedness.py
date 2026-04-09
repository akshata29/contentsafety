"""
Azure AI Content Safety - Groundedness Detection Service
Detects whether AI-generated text is grounded in source materials.

API version: 2024-02-15-preview
Payload shape:
  { "task": "QnA", "qna": {"query": "..."}, "text": "...",
    "groundingSources": ["..."], "reasoning": false }
  For Summarization omit the "qna" field.
Response shape: { "ungroundedDetected": bool, "ungroundedPercentage": float,
                  "ungroundedDetails": [...] }
"""
import json
from config import settings
from models.schemas import GroundednessRequest, GroundednessResponse
from services._transport import sync_post

_API_VERSION = "2024-02-15-preview"


def detect_groundedness(req: GroundednessRequest) -> GroundednessResponse:
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        raise RuntimeError(
            "Content Safety credentials not configured. "
            "Set CONTENT_SAFETY_ENDPOINT and CONTENT_SAFETY_API_KEY in .env"
        )

    url = (
        f"{settings.effective_cs_endpoint.rstrip('/')}"
        f"/contentsafety/text:detectGroundedness"
        f"?api-version={_API_VERSION}"
    )

    payload: dict = {
        "task": req.task,
        "text": req.text,
        "groundingSources": [req.grounding_sources],
        "reasoning": req.reasoning,
    }
    if req.task == "QnA" and req.query:
        payload["qna"] = {"query": req.query}

    headers = {
        "Ocp-Apim-Subscription-Key": settings.CONTENT_SAFETY_API_KEY,
        "Content-Type": "application/json",
    }

    status, text = sync_post(url, headers=headers, payload=payload)
    if status >= 400:
        raise RuntimeError(f"Groundedness API error {status}: {text}")
    data = json.loads(text)

    return GroundednessResponse(
        ungrounded=data.get("ungroundedDetected", False),
        contradicting_segments=data.get("ungroundedDetails", []),
        confidence=data.get("ungroundedPercentage", 0.0),
        reasoning=data.get("reasoning"),
        api_raw_response=data,
    )

