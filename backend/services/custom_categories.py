"""
Azure AI Content Safety - Custom Categories (Rapid / Incidents) Service

The "Custom Categories" feature uses the Incidents API (api-version 2024-02-15-preview):
  1. PATCH  /contentsafety/text/incidents/<name>                       -- create/update
  2. POST   /contentsafety/text/incidents/<name>:addIncidentSamples    -- add examples
  3. POST   /contentsafety/text/incidents/<name>:deploy                -- make it live
  4. POST   /contentsafety/text:detectIncidents                        -- analyse text

There is NO text:detectCustomCategory endpoint -- that URL never existed.
Incidents are provisioned at startup via provision_demo_incidents() called from main.py.
"""
import json
from config import settings
from models.schemas import CustomCategoryRequest, CustomCategoryResponse
from services._transport import sync_post, sync_patch

_API_VERSION = "2024-02-15-preview"

# Map Python category keys -> URL-safe incident names on the CS resource
_INCIDENT_NAME = {
    "MarketManipulation": "fin-market-manipulation",
    "InsiderTrading":     "fin-insider-trading",
    "FrontRunning":       "fin-front-running",
    "FinancialFraud":     "fin-financial-fraud",
}

# Pre-defined financial market custom categories for the demo
FINANCIAL_CUSTOM_CATEGORIES = {
    "MarketManipulation": {
        "name": "Market Manipulation",
        "definition": "Language that refers to coordinating to inflate/deflate asset prices, pump-and-dump schemes, wash trading, spoofing, or painting the tape.",
        "sample_phrases": [
            "We need to buy heavily to push the price up before the announcement",
            "Let all dump our shares after the spike",
            "Buy and immediately cancel orders to spoof the book",
        ],
    },
    "InsiderTrading": {
        "name": "Insider Trading",
        "definition": "References to trading on material non-public information (MNPI), tipping off associates, or using confidential corporate information.",
        "sample_phrases": [
            "I heard from their CFO the earnings will miss badly",
            "Trade before the merger is announced tomorrow",
            "The exec told me unofficially the deal is done",
        ],
    },
    "FrontRunning": {
        "name": "Front Running",
        "definition": "Language indicating trading ahead of client orders or using knowledge of pending large orders to trade for personal benefit.",
        "sample_phrases": [
            "Fill our prop book before we execute the client block",
            "Buy the puts before processing their sell order",
        ],
    },
    "FinancialFraud": {
        "name": "Financial Fraud",
        "definition": "References to misrepresenting financial products, Ponzi schemes, false accounting, or mis-selling.",
        "sample_phrases": [
            "Report the loss as a contingent liability this quarter",
            "Mark to a model price instead of market",
        ],
    },
}


def _headers() -> dict:
    return {
        "Ocp-Apim-Subscription-Key": settings.CONTENT_SAFETY_API_KEY,
        "Content-Type": "application/json",
    }


def _base() -> str:
    return settings.effective_cs_endpoint.rstrip("/")


def _provision_incident(category_key: str) -> None:
    """Create, populate, and deploy one incident on the Content Safety resource."""
    incident_name = _INCIDENT_NAME[category_key]
    cat = FINANCIAL_CUSTOM_CATEGORIES[category_key]
    base = _base()
    hdrs = _headers()

    # 1. Create / update incident definition
    url = f"{base}/contentsafety/text/incidents/{incident_name}?api-version={_API_VERSION}"
    status, body = sync_patch(url, headers=hdrs, payload={
        "incidentName": incident_name,
        "incidentDefinition": cat["definition"],
    })
    if status >= 400:
        raise RuntimeError(f"Create incident error {status}: {body}")

    # 2. Add sample phrases
    url = f"{base}/contentsafety/text/incidents/{incident_name}:addIncidentSamples?api-version={_API_VERSION}"
    status, body = sync_post(url, headers=hdrs, payload={
        "IncidentSamples": [{"text": p} for p in cat["sample_phrases"]],
    })
    if status >= 400:
        raise RuntimeError(f"Add samples error {status}: {body}")

    # 3. Deploy incident so it is live for detection
    url = f"{base}/contentsafety/text/incidents/{incident_name}:deploy?api-version={_API_VERSION}"
    status, body = sync_post(url, headers=hdrs, payload={})
    if status >= 400:
        raise RuntimeError(f"Deploy incident error {status}: {body}")


def provision_demo_incidents() -> None:
    """Idempotently provision all financial compliance incidents at startup."""
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        print("[custom_categories] Credentials not configured, skipping incident provisioning.")
        return
    for key in FINANCIAL_CUSTOM_CATEGORIES:
        try:
            _provision_incident(key)
            print(f"[custom_categories] Incident provisioned: {_INCIDENT_NAME[key]}")
        except Exception as e:
            print(f"[custom_categories] Warning: could not provision '{key}': {e}")


def analyze_custom_category(req: CustomCategoryRequest) -> CustomCategoryResponse:
    incident_name = _INCIDENT_NAME.get(req.category_name)
    if not incident_name:
        raise RuntimeError(f"Unknown category: {req.category_name}")

    url = f"{_base()}/contentsafety/text:detectIncidents?api-version={_API_VERSION}"
    payload = {
        "text": req.text,
        "incidentNames": [incident_name],
    }
    status, text = sync_post(url, headers=_headers(), payload=payload)
    if status >= 400:
        raise RuntimeError(f"Custom Categories API error {status}: {text}")

    data = json.loads(text)
    # Response: {"incidentMatches": [{"incidentName": "fin-insider-trading"}]}
    # Presence of an entry in incidentMatches means it matched -- there is no "detected" bool field.
    matches = data.get("incidentMatches", [])
    detected = len(matches) > 0

    return CustomCategoryResponse(
        detected=detected,
        category=req.category_name,
        confidence=1.0 if detected else 0.0,
    )


def get_all_categories() -> dict:
    return FINANCIAL_CUSTOM_CATEGORIES
