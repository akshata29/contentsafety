"""
Azure AI Language - PII Entity Recognition Service
Detects Personally Identifiable Information in text: names, SSNs, credit cards,
emails, phone numbers, government IDs, Azure credentials, and more.

Uses the Azure AI Language :analyze-text endpoint (multi-service resource).
The same Ocp-Apim-Subscription-Key and endpoint used for Content Safety
work here when backed by an Azure AI Services multi-service resource.
"""
import json

from config import settings
from models.schemas import PIIDetectionRequest, PIIDetectionResponse, PIIEntity
from services._transport import sync_post

_API_VERSION = "2023-04-01"
_LANGUAGE_TASK = "PiiEntityRecognition"


def detect_pii(req: PIIDetectionRequest) -> PIIDetectionResponse:
    endpoint = (settings.effective_language_endpoint or "").rstrip("/")
    api_key = settings.effective_language_key

    if not endpoint or not api_key:
        raise RuntimeError(
            "Azure AI Language credentials not configured. "
            "Set AZURE_AI_LANGUAGE_ENDPOINT + AZURE_AI_LANGUAGE_API_KEY in .env, "
            "or use a multi-service AZURE_AI_SERVICES_ENDPOINT with CONTENT_SAFETY_API_KEY. "
            "A dedicated Content Safety resource does not support the Language API."
        )

    url = f"{endpoint}/language/:analyze-text?api-version={_API_VERSION}"
    headers = {
        "Ocp-Apim-Subscription-Key": api_key,
        "Content-Type": "application/json",
    }

    body: dict = {
        "kind": _LANGUAGE_TASK,
        "analysisInput": {
            "documents": [
                {"id": "1", "language": "en", "text": req.text}
            ]
        },
        "parameters": {
            "modelVersion": "latest",
            "domain": req.domain,
        },
    }
    if req.categories:
        body["parameters"]["piiCategories"] = req.categories

    status, text = sync_post(url, headers=headers, payload=body)
    if status >= 400:
        raise RuntimeError(f"PII Detection API error {status}: {text}")
    data = json.loads(text)

    # Navigate response
    results = data.get("results", {})
    errors = results.get("errors", [])
    if errors:
        raise RuntimeError(f"PII API returned error: {errors[0]}")

    docs = results.get("documents", [])
    if not docs:
        return PIIDetectionResponse(
            detected=False,
            entity_count=0,
            entities=[],
            redacted_text=req.text,
            category_summary={},
        )

    doc = docs[0]
    raw_entities = doc.get("entities", [])
    redacted_text = doc.get("redactedText", req.text)

    entities: list[PIIEntity] = []
    category_summary: dict[str, int] = {}

    for e in raw_entities:
        category = e.get("category", "Unknown")
        entities.append(PIIEntity(
            text=e.get("text", ""),
            category=category,
            subcategory=e.get("subcategory"),
            offset=e.get("offset", 0),
            length=e.get("length", 0),
            confidence=round(e.get("confidenceScore", 0.0), 3),
        ))
        category_summary[category] = category_summary.get(category, 0) + 1

    return PIIDetectionResponse(
        detected=len(entities) > 0,
        entity_count=len(entities),
        entities=entities,
        redacted_text=redacted_text,
        category_summary=category_summary,
    )
