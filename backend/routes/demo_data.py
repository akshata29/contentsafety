"""
Demo Data Routes - Pre-built financial scenarios for each Content Safety feature
"""
from fastapi import APIRouter
from services.mock_data import SYNTHETIC_SCENARIOS, get_mock_foundry_overview

router = APIRouter()


@router.get("/scenarios")
async def get_all_scenarios():
    """Return all pre-built financial market scenarios for each Content Safety feature."""
    return SYNTHETIC_SCENARIOS


@router.get("/scenarios/{feature}")
async def get_feature_scenarios(feature: str):
    """Return scenarios for a specific feature (text_analysis, prompt_shields, groundedness, etc.)."""
    scenarios = SYNTHETIC_SCENARIOS.get(feature)
    if scenarios is None:
        return {"error": f"No scenarios found for feature: {feature}", "available": list(SYNTHETIC_SCENARIOS.keys())}
    return scenarios


@router.get("/foundry-snapshot")
async def foundry_snapshot():
    """Return a snapshot of the Foundry Control Plane demo data."""
    return get_mock_foundry_overview()
