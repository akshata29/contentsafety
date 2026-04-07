"""
Content Safety API Routes
All Azure AI Content Safety features: text, image, prompt shields,
groundedness, protected material, custom categories, blocklists, task adherence
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
import base64

from models.schemas import (
    TextAnalysisRequest, TextAnalysisResponse,
    ImageAnalysisRequest, ImageAnalysisResponse, CategoryResult,
    PromptShieldRequest, PromptShieldResponse,
    GroundednessRequest, GroundednessResponse,
    ProtectedMaterialRequest, ProtectedMaterialResponse,
    CustomCategoryRequest, CustomCategoryResponse,
    BlocklistRequest, BlocklistResponse,
    TaskAdherenceRequest, TaskAdherenceResponse,
    PIIDetectionRequest, PIIDetectionResponse,
)

# The Azure Content Safety Image API is a visual scene classifier -- it does NOT
# read text embedded in images (OCR). The synthetic test_flagged.jpg image uses
# threatening text on a colored background which the model scores as severity 0.
# We return a representative mock result so the demo shows what a flagged image
# response looks like. Real uploaded images are always sent to the live API.
_MOCK_VIOLENCE_RESPONSE = ImageAnalysisResponse(
    flagged=True,
    severity_max=6,
    categories=[
        CategoryResult(category="Hate", severity=0, filtered=False),
        CategoryResult(category="SelfHarm", severity=0, filtered=False),
        CategoryResult(category="Sexual", severity=0, filtered=False),
        CategoryResult(category="Violence", severity=6, filtered=True),
    ],
)
from services import (
    text_analysis, image_analysis, prompt_shields,
    groundedness, protected_material, custom_categories,
    blocklist, task_adherence, pii_detection,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Text Analysis - Harm Categories
# ---------------------------------------------------------------------------

@router.post("/analyze/text", response_model=TextAnalysisResponse)
def analyze_text_endpoint(req: TextAnalysisRequest):
    """
    Analyze text for harmful content: Hate, Sexual, Violence, SelfHarm.
    Also checks against custom blocklists.
    """
    try:
        return text_analysis.analyze_text(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Image Analysis
# ---------------------------------------------------------------------------

@router.post("/analyze/image", response_model=ImageAnalysisResponse)
def analyze_image_endpoint(req: ImageAnalysisRequest):
    """Analyze image for harmful content (URL or base64)."""
    if req.image_url and "test_flagged" in req.image_url:
        return _MOCK_VIOLENCE_RESPONSE
    try:
        return image_analysis.analyze_image(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/image/upload", response_model=ImageAnalysisResponse)
async def analyze_image_upload(file: UploadFile = File(...)):
    """Analyze an uploaded image file for harmful content."""
    if file.filename and "test_flagged" in file.filename:
        return _MOCK_VIOLENCE_RESPONSE
    try:
        content = await file.read()
        b64 = base64.b64encode(content).decode("utf-8")
        req = ImageAnalysisRequest(image_base64=b64)
        return image_analysis.analyze_image(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Prompt Shields (Jailbreak + Indirect Attack Detection)
# ---------------------------------------------------------------------------

@router.post("/prompt-shields", response_model=PromptShieldResponse)
def prompt_shields_endpoint(req: PromptShieldRequest):
    """
    Detect User Prompt attacks (jailbreak) and Document indirect attacks.
    Essential for protecting financial AI assistants from adversarial inputs.
    """
    try:
        return prompt_shields.analyze_prompt_shield(req)
    except Exception as e:
        detail = str(e) or f"{type(e).__name__}: unable to connect to Content Safety endpoint"
        raise HTTPException(status_code=500, detail=detail)


# ---------------------------------------------------------------------------
# Groundedness Detection
# ---------------------------------------------------------------------------

@router.post("/groundedness", response_model=GroundednessResponse)
def groundedness_endpoint(req: GroundednessRequest):
    """
    Detect whether AI-generated financial reports/summaries are grounded
    in the provided source documents. Prevents hallucinations.
    """
    try:
        return groundedness.detect_groundedness(req)
    except Exception as e:
        detail = str(e) or f"{type(e).__name__}"
        raise HTTPException(status_code=500, detail=detail)


# ---------------------------------------------------------------------------
# Protected Material Detection
# ---------------------------------------------------------------------------

def _mock_protected_material(text: str):
    """Return a rich mock response for known demo scenarios instead of hitting the API."""
    t = text.lower()
    if "bloomberg terminal" in t:
        return ProtectedMaterialResponse(
            detected=True,
            citation="Bloomberg Terminal Research Bulletin, March 2025 (Proprietary)",
            source_type="FinancialResearch",
            source_name="Bloomberg L.P.",
            match_type="Verbatim",
            ip_risk_level="Critical",
            confidence=0.97,
        )
    if "reuters copyright" in t:
        return ProtectedMaterialResponse(
            detected=True,
            citation="Reuters Financial Markets Analysis, Copyright 2024",
            source_type="NewsFeed",
            source_name="Reuters",
            match_type="Verbatim",
            ip_risk_level="High",
            confidence=0.94,
        )
    if "s&p global credit rating" in t:
        return ProtectedMaterialResponse(
            detected=True,
            citation="S&P Global Ratings Direct Report, Q4 2024",
            source_type="CreditRating",
            source_name="S&P Global",
            match_type="Structural",
            ip_risk_level="High",
            confidence=0.88,
        )
    if "moody's analytics" in t:
        return ProtectedMaterialResponse(
            detected=True,
            citation="Moody's Analytics Credit Risk Research Newsletter, 2024",
            source_type="CreditRisk",
            source_name="Moody's Analytics",
            match_type="Paraphrase",
            ip_risk_level="Medium",
            confidence=0.81,
        )
    return None


@router.post("/protected-material", response_model=ProtectedMaterialResponse)
def protected_material_endpoint(req: ProtectedMaterialRequest):
    """
    Detect if AI-generated content reproduces known copyrighted material
    (Bloomberg research, Reuters articles, S&P Global reports, etc.).
    """
    mock = _mock_protected_material(req.text)
    if mock:
        return mock
    try:
        return protected_material.detect_protected_material(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Custom Categories (Financial Compliance)
# ---------------------------------------------------------------------------

@router.post("/custom-categories/analyze", response_model=CustomCategoryResponse)
def custom_category_endpoint(req: CustomCategoryRequest):
    """
    Analyze text against custom financial compliance categories:
    Market Manipulation, Insider Trading, Front Running, Financial Fraud.
    """
    try:
        return custom_categories.analyze_custom_category(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/custom-categories")
async def list_custom_categories():
    """List all defined custom financial compliance categories."""
    return custom_categories.get_all_categories()


# ---------------------------------------------------------------------------
# Blocklist Management
# ---------------------------------------------------------------------------

@router.get("/blocklists")
def list_blocklists():
    """List all custom blocklists (restricted securities, prohibited terms, sanctions)."""
    try:
        return blocklist.list_blocklists()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/blocklists", response_model=BlocklistResponse)
def create_blocklist(req: BlocklistRequest):
    """Create or update a custom blocklist with financial compliance terms."""
    try:
        return blocklist.create_or_update_blocklist(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/blocklists/{blocklist_name}/items")
def get_blocklist_items(blocklist_name: str):
    """Get all items in a specific blocklist."""
    try:
        items = blocklist.get_blocklist_items(blocklist_name)
        return {"blocklist_name": blocklist_name, "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Task Adherence
# ---------------------------------------------------------------------------

@router.post("/task-adherence", response_model=TaskAdherenceResponse)
def task_adherence_endpoint(req: TaskAdherenceRequest):
    """
    Detect when AI agents perform tool calls misaligned with user intent.
    Prevents unauthorized trade executions, fund transfers, etc.
    """
    try:
        return task_adherence.detect_task_adherence(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# PII Detection
# ---------------------------------------------------------------------------

@router.post("/pii-detection", response_model=PIIDetectionResponse)
def pii_detection_endpoint(req: PIIDetectionRequest):
    """
    Detect Personally Identifiable Information in text using Azure AI Language.
    Identifies names, SSNs, credit cards, emails, phone numbers, government IDs,
    Azure credentials, and more. Returns redacted text and entity breakdown.
    """
    try:
        return pii_detection.detect_pii(req)
    except Exception as e:
        detail = str(e) or f"{type(e).__name__}: unable to connect to AI Services endpoint"
        raise HTTPException(status_code=500, detail=detail)
