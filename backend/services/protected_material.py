"""
Azure AI Content Safety - Protected Material Detection Service
Detects known copyrighted text content in AI-generated output
"""
import json
from config import settings
from models.schemas import ProtectedMaterialRequest, ProtectedMaterialResponse
from services._transport import sync_post


def detect_protected_material(req: ProtectedMaterialRequest) -> ProtectedMaterialResponse:
    url = (
        f"{settings.effective_cs_endpoint.rstrip('/')}"
        f"/contentsafety/text:detectProtectedMaterial"
        f"?api-version={settings.CONTENT_SAFETY_API_VERSION}"
    )

    payload = {"text": req.text}
    headers = {
        "Ocp-Apim-Subscription-Key": settings.CONTENT_SAFETY_API_KEY,
        "Content-Type": "application/json",
    }

    status, text = sync_post(url, headers=headers, payload=payload)
    if status >= 400:
        raise RuntimeError(f"Protected Material API error {status}: {text}")
    data = json.loads(text)

    detected = data.get("protectedMaterialAnalysis", {}).get("filtered", False)
    citation = data.get("protectedMaterialAnalysis", {}).get("citation", None)

    return ProtectedMaterialResponse(
        detected=detected,
        citation=citation,
        source_type="KnownContent" if detected else None,
    )
