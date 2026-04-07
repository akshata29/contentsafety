"""
Azure AI Content Safety - Prompt Shields Service
Detects User Prompt attacks (jailbreak) + Document (indirect / XPIA) attacks
Uses REST API directly (SDK 1.0.0 does not include Prompt Shields models).
"""
import json

from config import settings
from models.schemas import PromptShieldRequest, PromptShieldResponse, AttackResult
from services._transport import sync_post

_API_VERSION = "2024-02-15-preview"


def analyze_prompt_shield(req: PromptShieldRequest) -> PromptShieldResponse:
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        raise RuntimeError(
            "Content Safety credentials not configured. "
            "Set CONTENT_SAFETY_ENDPOINT and CONTENT_SAFETY_API_KEY in .env"
        )
    endpoint = settings.effective_cs_endpoint.rstrip("/")
    url = f"{endpoint}/contentsafety/text:shieldPrompt?api-version={_API_VERSION}"
    headers = {
        "Ocp-Apim-Subscription-Key": settings.CONTENT_SAFETY_API_KEY,
        "Content-Type": "application/json",
    }
    payload: dict = {"userPrompt": req.user_prompt}
    if req.documents:
        payload["documents"] = req.documents

    status, text = sync_post(url, headers=headers, payload=payload)
    if status >= 400:
        raise RuntimeError(f"Prompt Shields API error {status}: {text}")
    data = json.loads(text)

    user_analysis = data.get("userPromptAnalysis", {})
    user_detected = user_analysis.get("attackDetected", False)

    doc_results = []
    doc_detected = False
    for doc in data.get("documentsAnalysis", []):
        detected = doc.get("attackDetected", False)
        if detected:
            doc_detected = True
        doc_results.append(AttackResult(attack_detected=detected))

    return PromptShieldResponse(
        user_prompt_detected=user_detected,
        documents_detected=doc_detected,
        user_prompt_result=AttackResult(attack_detected=user_detected),
        documents_results=doc_results,
    )

