"""
Azure AI Content Safety - Text Analysis Service
Harm categories: Hate, Sexual, Violence, SelfHarm
"""
from typing import List
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import (
    AnalyzeTextOptions,
    TextCategory,
    AnalyzeTextResult,
)
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

from config import settings
from models.schemas import TextAnalysisRequest, TextAnalysisResponse, CategoryResult
from services._transport import make_transport, with_ssl_retry


def _make_client() -> ContentSafetyClient:
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        raise RuntimeError("Content Safety credentials not configured. Set CONTENT_SAFETY_ENDPOINT and CONTENT_SAFETY_API_KEY in .env")
    return ContentSafetyClient(
        endpoint=settings.effective_cs_endpoint,
        credential=AzureKeyCredential(settings.CONTENT_SAFETY_API_KEY),
        transport=make_transport(),
    )


CATEGORY_MAP = {
    "Hate": TextCategory.HATE,
    "Sexual": TextCategory.SEXUAL,
    "Violence": TextCategory.VIOLENCE,
    "SelfHarm": TextCategory.SELF_HARM,
}


def analyze_text(req: TextAnalysisRequest) -> TextAnalysisResponse:
    categories = None
    if req.categories:
        categories = [CATEGORY_MAP[c] for c in req.categories if c in CATEGORY_MAP]

    options = AnalyzeTextOptions(
        text=req.text,
        categories=categories,
        output_type=req.output_type,
        blocklist_names=req.blocklist_names or [],
    )

    try:
        with _make_client() as client:
            result: AnalyzeTextResult = with_ssl_retry(lambda: client.analyze_text(options))
    except HttpResponseError as e:
        raise RuntimeError(f"Content Safety API error: {e.message}") from e

    category_results = []
    severity_max = 0
    for cr in result.categories_analysis or []:
        sev = cr.severity or 0
        severity_max = max(severity_max, sev)
        category_results.append(
            CategoryResult(
                category=cr.category.value if hasattr(cr.category, "value") else str(cr.category),
                severity=sev,
                filtered=sev >= 4,
            )
        )

    blocklist_matches = [m.blocklist_item_text for m in (result.blocklists_match or [])]

    return TextAnalysisResponse(
        flagged=severity_max >= 4 or bool(blocklist_matches),
        categories=category_results,
        blocklist_matches=blocklist_matches,
        severity_max=severity_max,
    )
