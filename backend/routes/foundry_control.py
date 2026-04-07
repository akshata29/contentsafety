"""
Azure AI Foundry Control Plane API Routes
Fleet management, Compliance, Quota, Admin, Security
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from services import foundry_mgmt

router = APIRouter()


@router.get("/overview")
async def foundry_overview():
    """Full Foundry Control Plane overview: agents, models, compliance, quotas, alerts."""
    try:
        return await foundry_mgmt.get_foundry_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Agent Fleet Management
# ---------------------------------------------------------------------------

@router.get("/agents")
async def list_agents(status: Optional[str] = None):
    """List all agents across projects. Filter by status: Active, Warning, Error."""
    try:
        return await foundry_mgmt.get_agents(filter_status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Model Deployments
# ---------------------------------------------------------------------------

@router.get("/deployments")
async def list_deployments():
    """List all model deployments with guardrail configurations and quota usage."""
    try:
        return await foundry_mgmt.get_deployments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deployments/{deployment_id}/remediate")
async def remediate_deployment(deployment_id: str):
    """Apply bulk remediation to bring a noncompliant deployment into compliance."""
    try:
        return await foundry_mgmt.remediate_policy_violation(deployment_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Compliance & Guardrail Policies
# ---------------------------------------------------------------------------

@router.get("/compliance/policies")
async def list_policies():
    """List all guardrail policies and their compliance status."""
    try:
        return await foundry_mgmt.get_compliance_policies()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Security Alerts (Defender + Purview)
# ---------------------------------------------------------------------------

@router.get("/security/alerts")
async def list_security_alerts(severity: Optional[str] = None):
    """
    List security alerts from Microsoft Defender for Cloud and Azure Content Safety.
    Filter by severity: High, Medium, Low.
    """
    try:
        return await foundry_mgmt.get_security_alerts(severity=severity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Quota Management
# ---------------------------------------------------------------------------

@router.get("/quota")
async def list_quotas():
    """View quota usage across all model deployments."""
    try:
        return await foundry_mgmt.get_quotas()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admin - Projects & Users
# ---------------------------------------------------------------------------

@router.post("/cache/refresh")
async def refresh_cache():
    """Force-clear the Foundry data cache so the next request fetches fresh data."""
    from services.foundry_mgmt import _cache
    _cache.clear()
    return {"status": "cache cleared"}


@router.get("/debug/agents")
async def debug_agents():
    """Debug agents listing in executor context."""
    import asyncio
    from services.foundry_mgmt import _sync_agents, _AIP_VERSION

    def _debug_sync():
        agents = _sync_agents()
        return {
            "aip_version": _AIP_VERSION,
            "count": len(agents),
            "first_name": agents[0]["name"] if agents else None,
        }

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _debug_sync)


@router.get("/admin/projects")
async def list_projects():
    """Admin view: all projects across the subscription with compliance posture."""
    try:
        return await foundry_mgmt.get_admin_projects()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
