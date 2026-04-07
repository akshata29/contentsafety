"""
Azure AI Content Safety - Image Analysis Service
"""
import base64
import httpx
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import (
    AnalyzeImageOptions,
    ImageData,
    ImageCategory,
)
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

from config import settings
from models.schemas import ImageAnalysisRequest, ImageAnalysisResponse, CategoryResult
from services._transport import make_transport, with_ssl_retry


def _make_client() -> ContentSafetyClient:
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        raise RuntimeError("Content Safety credentials not configured. Set CONTENT_SAFETY_ENDPOINT and CONTENT_SAFETY_API_KEY in .env")
    return ContentSafetyClient(
        endpoint=settings.effective_cs_endpoint,
        credential=AzureKeyCredential(settings.CONTENT_SAFETY_API_KEY),
        transport=make_transport(),
    )


def analyze_image(req: ImageAnalysisRequest) -> ImageAnalysisResponse:
    if req.image_url:
        if req.image_url.startswith("https://") and ".blob.core.windows.net/" in req.image_url:
            image_data = ImageData(blob_url=req.image_url)
        else:
            with httpx.Client(timeout=15, headers={
                "User-Agent": "Mozilla/5.0 (compatible; ContentSafetyDemo/1.0; +https://github.com/azure-ai-contentsafety)"
            }, verify=False) as http:
                resp = http.get(req.image_url, follow_redirects=True)
                resp.raise_for_status()
            image_data = ImageData(content=resp.content)
    elif req.image_base64:
        image_data = ImageData(content=base64.b64decode(req.image_base64))
    else:
        raise ValueError("Either image_url or image_base64 must be provided")

    options = AnalyzeImageOptions(image=image_data)

    try:
        with _make_client() as client:
            result = with_ssl_retry(lambda: client.analyze_image(options))
    except HttpResponseError as e:
        raise RuntimeError(f"Content Safety Image API error: {e.message}") from e

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

    return ImageAnalysisResponse(
        flagged=severity_max >= 4,
        categories=category_results,
        severity_max=severity_max,
    )
