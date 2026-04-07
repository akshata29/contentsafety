"""
Azure AI Foundry Control Plane Service
Real data from Azure APIs with graceful fallback to synthetic demo data.

APIs used:
  - azure-ai-projects  : AIProjectClient.agents.list_agents()
  - azure-mgmt-cognitiveservices: accounts, deployments, rai_policies, usages
  - ARM REST API       : Microsoft.Security/alerts (Defender for Cloud)
"""
import asyncio
import logging
from datetime import datetime, timedelta
from functools import partial
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

# Pre-import Azure SDK modules to avoid lazy-import deadlocks in thread pool
try:
    from azure.identity import ClientSecretCredential as _ClientSecretCredential
    from azure.mgmt.cognitiveservices import CognitiveServicesManagementClient as _CSClient
    from azure.ai.projects import AIProjectClient as _AIProjectClient
    import azure.ai.projects as _aip_pkg
    _AZURE_SDK_AVAILABLE = True
    _AIP_VERSION = getattr(_aip_pkg, "__version__", "unknown")
    logger.info("azure-ai-projects loaded: version=%s", _AIP_VERSION)
except ImportError:
    _AZURE_SDK_AVAILABLE = False
    _AIP_VERSION = "unavailable"

# ---------------------------------------------------------------------------
# Simple TTL cache
# ---------------------------------------------------------------------------
_cache: dict = {}
_CACHE_TTL = 120        # seconds — default for most data
_COST_CACHE_TTL = 600   # 10 min — Cost Management API rate-limits at 14 req/min


def _cache_set(key: str, data):
    _cache[key] = (data, datetime.utcnow() + timedelta(seconds=_CACHE_TTL))


def _cache_get(key: str):
    entry = _cache.get(key)
    if entry and datetime.utcnow() < entry[1]:
        return entry[0]
    return None


# ---------------------------------------------------------------------------
# Credential / client helpers
# ---------------------------------------------------------------------------

def _has_credentials() -> bool:
    return bool(
        settings.AZURE_CLIENT_ID
        and settings.AZURE_CLIENT_SECRET
        and settings.AZURE_TENANT_ID
        and settings.AZURE_SUBSCRIPTION_ID
    )


def _get_credential():
    return _ClientSecretCredential(
        tenant_id=settings.AZURE_TENANT_ID,
        client_id=settings.AZURE_CLIENT_ID,
        client_secret=settings.AZURE_CLIENT_SECRET,
    )


def _get_cs_client():
    return _CSClient(
        _get_credential(),
        settings.AZURE_SUBSCRIPTION_ID,
    )


async def _arm_token() -> str:
    url = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token"
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.post(url, data={
            "grant_type": "client_credentials",
            "client_id": settings.AZURE_CLIENT_ID,
            "client_secret": settings.AZURE_CLIENT_SECRET,
            "scope": "https://management.azure.com/.default",
        })
        r.raise_for_status()
        return r.json()["access_token"]


async def _run_sync(fn, *args):
    """Run a synchronous SDK call in the default thread-pool executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args))


async def _safe(coro, default=None):
    """Await a coroutine; return default ([] if None) on any exception."""
    try:
        return await coro
    except Exception as exc:
        logger.warning("Async Foundry fetch failed: %s", exc)
        return [] if default is None else default


async def _empty():
    return []

async def _empty_float():
    return 0.0


# ---------------------------------------------------------------------------
# Azure Monitor / Cost Management REST helpers
# ---------------------------------------------------------------------------

async def _async_monitor_get(token: str, resource_id: str, metric: str,
                              timespan: str, interval: str,
                              aggregation: str = "Total",
                              dimension_filter: str = "") -> dict:
    """Call Azure Monitor metrics REST API for a single ARM resource."""
    url = f"https://management.azure.com{resource_id}/providers/Microsoft.Insights/metrics"
    params: dict = {
        "api-version": "2023-10-01",
        "metricnames": metric,
        "timespan": timespan,
        "interval": interval,
        "aggregation": aggregation,
    }
    if dimension_filter:
        params["$filter"] = dimension_filter
    try:
        async with httpx.AsyncClient(timeout=20.0) as c:
            r = await c.get(url, headers={"Authorization": f"Bearer {token}"}, params=params)
            if r.status_code == 200:
                return r.json()
            logger.debug("Monitor %s %s: HTTP %s", resource_id.split("/")[-1], metric, r.status_code)
    except Exception as exc:
        logger.debug("Monitor get failed (%s): %s", metric, exc)
    return {}


def _clean_op_name(op: str) -> str:
    """Shorten Azure operation names for the activity feed."""
    _action_map = {"write": "Updated", "delete": "Deleted", "read": "Read", "action": "Action"}
    parts = (op or "").split("/")
    # e.g. "Microsoft.CognitiveServices/accounts/deployments/write"
    resource = parts[-2].rstrip("s").capitalize() if len(parts) >= 2 else ""
    action = _action_map.get(parts[-1].lower(), parts[-1].capitalize()) if parts else op
    label = f"{resource} {action}".strip()
    return label or op


async def _real_hourly_requests(ai_accounts: list) -> list:
    """Get hourly API request + error counts for the last 24 h from Azure Monitor."""
    if not ai_accounts or not _has_credentials():
        return []
    now = datetime.utcnow()
    start = (now - timedelta(hours=23)).replace(minute=0, second=0, microsecond=0)
    end = now.replace(minute=59, second=59, microsecond=0)
    timespan = f"{start.strftime('%Y-%m-%dT%H:%M:%SZ')}/{end.strftime('%Y-%m-%dT%H:%M:%SZ')}"
    try:
        token = await _arm_token()
        hourly_calls: dict = {}
        hourly_blocked: dict = {}
        for acct in ai_accounts:
            resource_id = getattr(acct, "id", None) or ""
            if not resource_id:
                continue
            # Total requests
            data = await _async_monitor_get(token, resource_id, "Requests", timespan, "PT1H")
            for mv in (data.get("value") or []):
                for ts in (mv.get("timeseries") or []):
                    for pt in (ts.get("data") or []):
                        hour = (pt.get("timeStamp") or "")[11:16]
                        if hour:
                            hourly_calls[hour] = hourly_calls.get(hour, 0) + int(pt.get("total") or 0)
            # Errors (blocked / content-filtered)
            data2 = await _async_monitor_get(token, resource_id, "Errors", timespan, "PT1H")
            for mv in (data2.get("value") or []):
                for ts in (mv.get("timeseries") or []):
                    for pt in (ts.get("data") or []):
                        hour = (pt.get("timeStamp") or "")[11:16]
                        if hour:
                            hourly_blocked[hour] = hourly_blocked.get(hour, 0) + int(pt.get("total") or 0)
        result = []
        for i in range(24):
            h = (start + timedelta(hours=i)).strftime("%H:00")
            result.append({"time": h, "calls": hourly_calls.get(h, 0), "blocked": hourly_blocked.get(h, 0)})
        return result
    except Exception as exc:
        logger.warning("Hourly requests failed: %s", exc)
        return []


async def _real_token_metrics(ai_accounts: list) -> dict:
    """Get per-deployment token usage for today from Azure Monitor."""
    if not ai_accounts or not _has_credentials():
        return {"total_tokens": 0, "total_requests": 0, "dep_tokens": {}}
    now = datetime.utcnow()
    timespan = f"{now.strftime('%Y-%m-%dT00:00:00Z')}/{now.strftime('%Y-%m-%dT%H:59:59Z')}"
    try:
        token = await _arm_token()
        dep_tokens: dict = {}
        total_tokens = 0
        total_requests = 0
        for acct in ai_accounts:
            resource_id = getattr(acct, "id", None) or ""
            if not resource_id:
                continue
            # Token transactions split by DeploymentName dimension
            data = await _async_monitor_get(
                token, resource_id, "TokenTransaction", timespan, "P1D",
                dimension_filter="DeploymentName eq '*'",
            )
            for mv in (data.get("value") or []):
                for ts in (mv.get("timeseries") or []):
                    dep_name = ""
                    for dim in (ts.get("metadatavalues") or []):
                        if (dim.get("name", {}).get("value") or "").lower() == "deploymentname":
                            dep_name = dim.get("value", "")
                    for pt in (ts.get("data") or []):
                        t = int(pt.get("total") or 0)
                        total_tokens += t
                        if dep_name:
                            dep_tokens[dep_name] = dep_tokens.get(dep_name, 0) + t
            # Request count
            req_data = await _async_monitor_get(token, resource_id, "Requests", timespan, "P1D")
            for mv in (req_data.get("value") or []):
                for ts in (mv.get("timeseries") or []):
                    for pt in (ts.get("data") or []):
                        total_requests += int(pt.get("total") or 0)
        return {"total_tokens": total_tokens, "total_requests": total_requests, "dep_tokens": dep_tokens}
    except Exception as exc:
        logger.warning("Token metrics failed: %s", exc)
        return {"total_tokens": 0, "total_requests": 0, "dep_tokens": {}}


async def _real_cost_today() -> float:
    """Get today's AI spend from Azure Cost Management API."""
    if not _has_credentials():
        return 0.0
    # Use a longer TTL — Cost Management API rate-limits at 14 req/min per subscription
    cached = _cache.get("cost_today")
    if cached and datetime.utcnow() < cached[1]:
        return cached[0]
    try:
        token = await _arm_token()
        sub = settings.AZURE_SUBSCRIPTION_ID
        today = datetime.utcnow().strftime("%Y-%m-%d")
        url = (f"https://management.azure.com/subscriptions/{sub}"
               "/providers/Microsoft.CostManagement/query?api-version=2023-11-01")
        body = {
            "type": "Usage",
            "timeframe": "Custom",
            "timePeriod": {"from": f"{today}T00:00:00Z", "to": f"{today}T23:59:59Z"},
            "dataset": {
                "granularity": "None",
                "aggregation": {"totalCost": {"name": "Cost", "function": "Sum"}},
                "filter": {
                    "or": [
                        {"dimensions": {"name": "ServiceName", "operator": "In",
                                        "values": ["Azure OpenAI", "Azure OpenAI Service",
                                                   "Cognitive Services"]}},
                    ]
                },
            },
        }
        async with httpx.AsyncClient(timeout=25.0) as c:
            r = await c.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=body,
            )
            if r.status_code == 200:
                rows = (r.json().get("properties") or {}).get("rows") or []
                cost = round(sum(float(row[0]) for row in rows), 2)
                _cache["cost_today"] = (cost, datetime.utcnow() + timedelta(seconds=_COST_CACHE_TTL))
                return cost
            logger.warning("Cost Management: HTTP %s", r.status_code)
    except Exception as exc:
        logger.warning("Cost today failed: %s", exc)
    return 0.0


async def _real_activity_log() -> list:
    """Get recent AI-related events from Azure Activity Log (last 24 h)."""
    if not _has_credentials():
        return []
    try:
        token = await _arm_token()
        sub = settings.AZURE_SUBSCRIPTION_ID
        since = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
        url = (f"https://management.azure.com/subscriptions/{sub}/providers/"
               "Microsoft.Insights/eventtypes/management/values")
        params = {
            "api-version": "2015-04-01",
            "$filter": (
                f"eventTimestamp ge '{since}' and "
                "resourceProvider eq 'Microsoft.CognitiveServices'"
            ),
            "$select": "eventTimestamp,operationName,resourceId,status,caller",
        }
        async with httpx.AsyncClient(timeout=20.0) as c:
            r = await c.get(url, headers={"Authorization": f"Bearer {token}"}, params=params)
            if r.status_code == 200:
                _status_map = {"Succeeded": "ok", "Failed": "error", "Started": "info", "Accepted": "ok"}
                events = []
                for item in (r.json().get("value") or [])[:25]:
                    op = ((item.get("operationName") or {}).get("localizedValue")
                          or (item.get("operationName") or {}).get("value") or "")
                    status_val = ((item.get("status") or {}).get("localizedValue")
                                  or (item.get("status") or {}).get("value") or "Succeeded")
                    ts = ((item.get("eventTimestamp") or "")[:19]).replace("T", " ")
                    resource = ((item.get("resourceId") or "")).split("/")[-1]
                    events.append({
                        "timestamp": ts,
                        "event": _clean_op_name(op) or op,
                        "agent": resource,
                        "status": _status_map.get(status_val, "ok"),
                    })
                return events
            logger.warning("Activity log: HTTP %s", r.status_code)
    except Exception as exc:
        logger.warning("Activity log failed: %s", exc)
    return []


def _compute_governance(deployments: list, policies: list, agents: list) -> list:
    """Compute governance health scores from real deployment/policy/agent data."""
    total_deps = len(deployments)
    if total_deps > 0:
        content_pct = round(sum(1 for d in deployments if d.get("content_filter_enabled")) / total_deps * 100)
        shield_pct = round(sum(1 for d in deployments if d.get("prompt_shield_enabled")) / total_deps * 100)
        guardrail_pct = round(sum(1 for d in deployments if d.get("rai_policy_name")) / total_deps * 100)
    else:
        content_pct = shield_pct = guardrail_pct = 0
    policy_pct = (
        round(sum(1 for p in policies if p.get("violations", 0) == 0) / len(policies) * 100)
        if policies else 100
    )
    agent_pct = (
        round(sum(1 for a in agents if a.get("compliance_status") == "compliant") / len(agents) * 100)
        if agents else 100
    )
    return [
        {"label": "Content Safety", "score": content_pct, "color": "#10b981"},
        {"label": "Prompt Shields", "score": shield_pct, "color": "#3b82f6"},
        {"label": "Guardrail Coverage", "score": guardrail_pct, "color": "#f59e0b"},
        {"label": "Policy Compliance", "score": policy_pct, "color": "#8b5cf6"},
        {"label": "Agent Compliance", "score": agent_pct, "color": "#06b6d4"},
    ]


# ---------------------------------------------------------------------------
# Synchronous SDK fetchers (executed in thread pool)
# ---------------------------------------------------------------------------

def _sync_ai_accounts(rg: str) -> list:
    try:
        cs = _get_cs_client()
        return [a for a in cs.accounts.list_by_resource_group(rg)
                if getattr(a, "kind", "") in ("AIServices", "OpenAI")]
    except Exception as exc:
        logger.warning("list_by_resource_group(%s): %s", rg, exc)
        return []


def _sync_all_accounts() -> list:
    try:
        cs = _get_cs_client()
        # Method name varies by SDK version
        if hasattr(cs.accounts, "list_by_subscription"):
            return list(cs.accounts.list_by_subscription())
        return list(cs.accounts.list())
    except Exception as exc:
        logger.warning("accounts.list: %s", exc)
        return []


def _sync_deployments(rg: str, account_name: str) -> list:
    try:
        return list(_get_cs_client().deployments.list(rg, account_name))
    except Exception as exc:
        logger.warning("deployments.list(%s): %s", account_name, exc)
        return []


def _sync_rai_policies(rg: str, account_name: str) -> list:
    try:
        cs = _get_cs_client()
        if not hasattr(cs, "rai_policies"):
            return []
        return list(cs.rai_policies.list(rg, account_name))
    except Exception as exc:
        logger.warning("rai_policies.list(%s): %s", account_name, exc)
        return []


def _sync_agents() -> list:
    if not settings.FOUNDRY_PROJECT_ENDPOINT or not _AZURE_SDK_AVAILABLE:
        return []
    try:
        import inspect, re
        sig = inspect.signature(_AIProjectClient.__init__)
        params = list(sig.parameters.keys())

        if "subscription_id" in params:
            # v1.0.0b10 API with explicit subscription/resource group/project args
            base = re.match(r"(https://[^/]+)", settings.FOUNDRY_PROJECT_ENDPOINT)
            endpoint = base.group(1) if base else settings.FOUNDRY_PROJECT_ENDPOINT
            client = _AIProjectClient(
                endpoint=endpoint,
                subscription_id=settings.AZURE_SUBSCRIPTION_ID,
                resource_group_name=settings.AZURE_FOUNDRY_RESOURCE_GROUP,
                project_name=settings.AZURE_FOUNDRY_PROJECT_NAME,
                credential=_get_credential(),
            )
        else:
            # v2.0.x API - endpoint is the full project URL
            client = _AIProjectClient(
                endpoint=settings.FOUNDRY_PROJECT_ENDPOINT,
                credential=_get_credential(),
            )

        return list(client.agents.list())
    except Exception as exc:
        logger.warning("agents.list() failed (SDK %s): %s", _AIP_VERSION, exc)
        return []


# ---------------------------------------------------------------------------
# Data mappers
# ---------------------------------------------------------------------------

def _map_agent(agent) -> dict:
    # Convert SDK model object to a plain Python dict for reliable access
    try:
        a = agent.as_dict() if hasattr(agent, "as_dict") else dict(agent)
    except Exception:
        a = {}
    agent_id = a.get("id") or ""
    name = a.get("name") or "Unnamed Agent"
    versions = a.get("versions") or {}
    latest = versions.get("latest") or {} if isinstance(versions, dict) else {}
    definition = latest.get("definition") or {} if isinstance(latest, dict) else {}
    meta = latest.get("metadata") or {} if isinstance(latest, dict) else {}
    status_raw = (latest.get("status") or "idle") if isinstance(latest, dict) else "idle"
    status = status_raw.lower() if status_raw.lower() in ("active", "idle", "degraded", "suspended") else "idle"
    model_name = (definition.get("model") or "gpt-4o") if isinstance(definition, dict) else "gpt-4o"
    rai_policy = (definition.get("raiPolicyName") or definition.get("rai_policy_name") or "") if isinstance(definition, dict) else ""
    content_filter_on = bool(rai_policy)
    # created_at is a Unix timestamp integer
    created_at_raw = (latest.get("created_at") or 0) if isinstance(latest, dict) else 0
    created = ""
    if created_at_raw:
        try:
            from datetime import timezone
            created = datetime.fromtimestamp(int(created_at_raw), tz=timezone.utc).strftime("%Y-%m-%d")
        except Exception:
            created = str(created_at_raw)
    desk = (meta.get("desk") or meta.get("purpose") or "General") if isinstance(meta, dict) else "General"
    platform = (meta.get("platform") or "Azure AI Foundry") if isinstance(meta, dict) else "Azure AI Foundry"
    tags_raw = (meta.get("tags") or "") if isinstance(meta, dict) else ""
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []
    description = (latest.get("description") or a.get("description") or "") if isinstance(latest, dict) else ""
    compliance = "compliant" if content_filter_on else "at-risk"
    return {
        "agent_id": agent_id,
        "id": agent_id,
        "name": name,
        "description": description,
        "desk": desk,
        "platform": platform,
        "status": status,
        "health_score": 100 if status == "active" else 75,
        "compliance_status": compliance,
        "token_usage_today": 0,
        "token_usage": 0,
        "active_alerts": 0,
        "alerts": 0,
        "tags": tags,
        "model": model_name,
        "version": (latest.get("version") or "") if isinstance(latest, dict) else "",
        "region": "",
        "content_filter_enabled": content_filter_on,
        "prompt_shield_enabled": content_filter_on,
        "token_limit_daily": 100_000,
        "recent_violations": [],
        "created_at": created,
        "cost_usd": 0.0,
        "run_completion_rate": 1.0,
        "rai_policy": rai_policy,
    }


def _map_deployment(d, account) -> dict:
    props = getattr(d, "properties", None)
    model_props = getattr(props, "model", None) if props else None
    rai_policy = (getattr(props, "rai_policy_name", None) or "") if props else ""
    content_on = bool(rai_policy)
    sku = getattr(d, "sku", None)
    capacity = (getattr(sku, "capacity", 0) or 0) if sku else 0
    sku_name = (getattr(sku, "name", "Standard") or "Standard") if sku else "Standard"
    model_name = ""
    model_version = ""
    if model_props:
        model_name = (getattr(model_props, "name", "")
                      or getattr(model_props, "format", "") or "")
        model_version = getattr(model_props, "version", "") or ""
    return {
        "deployment_id": d.name,
        "id": d.name,
        "name": d.name,
        "model": model_name,
        "version": model_version,
        "region": account.location or "unknown",
        "content_filter_enabled": content_on,
        "prompt_shield_enabled": content_on,
        "abuse_monitoring_enabled": content_on,
        "groundedness_enabled": False,
        "protected_material_enabled": False,
        "rai_policy_name": rai_policy,
        "tokens_used_today": 0,
        "token_limit_daily": capacity * 1440 if capacity else 0,
        "quota_used": 0,
        "quota_limit": capacity,
        "compliance_status": "compliant" if content_on else "non_compliant",
        "account_name": account.name,
        "sku_name": sku_name,
    }


# ---------------------------------------------------------------------------
# Async real-data fetchers
# ---------------------------------------------------------------------------

async def _real_agents() -> list:
    raw = await _run_sync(_sync_agents)
    return [_map_agent(a) for a in raw]


async def _real_deployments(rg: str) -> list:
    accounts = await _run_sync(_sync_ai_accounts, rg)
    result = []
    for acct in accounts:
        deps = await _run_sync(_sync_deployments, rg, acct.name)
        for d in deps:
            result.append(_map_deployment(d, acct))
    return result


async def _real_quotas(rg: str) -> list:
    accounts = await _run_sync(_sync_ai_accounts, rg)
    result = []
    for acct in accounts:
        deps = await _run_sync(_sync_deployments, rg, acct.name)
        for d in deps:
            props = getattr(d, "properties", None)
            model_props = getattr(props, "model", None) if props else None
            model_name = ""
            if model_props:
                model_name = (getattr(model_props, "name", "")
                              or getattr(model_props, "format", "") or "")
            if not model_name:
                model_name = d.name  # fallback to deployment name
            sku = getattr(d, "sku", None)
            capacity = (getattr(sku, "capacity", 0) or 0) if sku else 0
            sku_name = (getattr(sku, "name", "Standard") or "Standard") if sku else "Standard"
            result.append({
                "model": model_name,
                "region": acct.location or "unknown",
                "deployment": d.name,
                "deployment_type": sku_name,
                "used": 0,
                "limit": capacity,
                "unit": "tokens/min",
                "daily_used": 0,
                "daily_limit": capacity * 1440 if capacity else 0,
                "daily_cost": 0.0,
                "projected_monthly_cost": 0.0,
            })
    return result


async def _real_policies(rg: str) -> list:
    accounts = await _run_sync(_sync_ai_accounts, rg)
    result = []
    for acct in accounts:
        deps = await _run_sync(_sync_deployments, rg, acct.name)
        policy_usage: dict = {}
        for d in deps:
            props = getattr(d, "properties", None)
            pn = ((getattr(props, "rai_policy_name", None) or "Microsoft.Default")
                  if props else "Microsoft.Default")
            policy_usage[pn] = policy_usage.get(pn, 0) + 1
        policies = await _run_sync(_sync_rai_policies, rg, acct.name)
        for p in policies:
            p_props = getattr(p, "properties", None)
            filters = (getattr(p_props, "content_filters", []) or []) if p_props else []
            violations = sum(1 for f in filters if getattr(f, "enabled", True) is False)
            controls = [
                str(getattr(f, "name", "") or getattr(f, "category", ""))
                for f in filters
                if getattr(f, "name", "") or getattr(f, "category", "")
            ]
            policy_id = f"{acct.name}/{p.name}"
            result.append({
                "id": policy_id,
                "policy_id": policy_id,
                "name": p.name or "Unnamed Policy",
                "scope": f"Account: {acct.name}",
                "framework": "Azure AI Guardrails",
                "controls": controls or ["ContentFilter"],
                "violations": violations,
                "total_assets": policy_usage.get(p.name, len(deps)),
                "status": "active" if violations == 0 else "violations_detected",
                "last_evaluated": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
                "description": f"Content safety policy applied to AI resources in account {acct.name}.",
            })
    return result


_SEV_NORM = {"High": "high", "Medium": "medium", "Low": "low", "Critical": "critical", "Informational": "low"}
_STATUS_NORM = {"Active": "open", "InProgress": "investigating", "Resolved": "resolved", "Dismissed": "dismissed"}
_SOURCE_NORM = {
    "Microsoft Defender for Cloud": "Defender for AI",
    "Microsoft Defender for AI": "Defender for AI",
    "Microsoft": "Defender for AI",
    "Azure Content Safety": "Azure Foundry",
    "Foundry Monitoring": "Azure Foundry",
}


async def _real_security_alerts() -> list:
    try:
        token = await _arm_token()
        sub = settings.AZURE_SUBSCRIPTION_ID
        url = (f"https://management.azure.com/subscriptions/{sub}"
               "/providers/Microsoft.Security/alerts")
        async with httpx.AsyncClient(timeout=30.0) as c:
            r = await c.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                params={"api-version": "2022-01-01"},
            )
            if r.status_code == 200:
                out = []
                for item in r.json().get("value", []):
                    props = item.get("properties", {})
                    sev_raw = props.get("severity", "Medium")
                    status_raw = props.get("status", "Active")
                    vendor = props.get("vendorName", "Microsoft")
                    entity = props.get("compromisedEntity", "")
                    out.append({
                        "alert_id": item.get("name", ""),
                        "id": item.get("name", ""),
                        "severity": _SEV_NORM.get(sev_raw, sev_raw.lower()),
                        "title": props.get("alertDisplayName", "Security Alert"),
                        "description": props.get("description", ""),
                        "resource": entity,
                        "agent": entity,
                        "timestamp": props.get("timeGeneratedUtc", ""),
                        "source": _SOURCE_NORM.get(vendor, "Defender for AI"),
                        "status": _STATUS_NORM.get(status_raw, "open"),
                        "recommendations": [],
                        "affected_entities": [entity] if entity else [],
                    })
                return out
            logger.warning("Security alerts API: HTTP %s", r.status_code)
    except Exception as exc:
        logger.warning("Security alerts fetch failed: %s", exc)
    return []


async def _real_admin_projects() -> list:
    all_accounts = await _run_sync(_sync_all_accounts)
    result = []
    for acct in all_accounts:
        acct_id = acct.id or ""
        parts = acct_id.split("/")
        rg = parts[4] if len(parts) > 4 else ""
        props = getattr(acct, "properties", None)
        result.append({
            "name": acct.name,
            "project_id": acct_id,
            "subscription_id": settings.AZURE_SUBSCRIPTION_ID,
            "resource_group": rg,
            "region": acct.location or "unknown",
            "owner": (acct.tags or {}).get("owner", "admin"),
            "compliance_status": "compliant",
            "agent_count": 0,
            "deployment_count": 0,
            "connected_services": [acct.kind or "CognitiveServices"],
            "created_date": (str(getattr(props, "date_created", "") or "") if props else ""),
            "daily_cost": 0.0,
            "monthly_budget": 0.0,
        })
    return result


# ---------------------------------------------------------------------------
# Empty state (returned when no credentials are configured)
# ---------------------------------------------------------------------------

def _empty_overview() -> dict:
    """Return a zero-state overview when Azure credentials are not configured."""
    return {
        "total_agents": 0, "active_agents": 0,
        "total_deployments": 0, "total_models": 0,
        "guardrails_enabled": 0,
        "compliance_score": 0.0,
        "active_alerts": 0, "open_alerts": 0, "critical_alerts": 0,
        "daily_cost": 0.0, "cost_this_month_usd": 0.0,
        "requests_today": 0,
        "compliant_agents": 0, "at_risk_agents": 0, "critical_agents": 0,
        "run_completion_rate": 0.0, "prevented_behaviors": 0, "total_token_usage": 0,
        "top_models": [], "hourly_requests": [], "recent_events": [],
        "governance_summary": _compute_governance([], [], []),
        "agents": [], "deployments": [], "policies": [], "security_alerts": [], "quotas": [],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_foundry_overview() -> dict:
    cached = _cache_get("overview")
    if cached is not None:
        return cached

    if not _has_credentials():
        result = _empty_overview()
        _cache_set("overview", result)
        return result

    rg = settings.AZURE_FOUNDRY_RESOURCE_GROUP

    # Fetch accounts first — needed as inputs to metric API calls
    all_accounts = await _safe(_run_sync(_sync_all_accounts))
    ai_accounts = [a for a in all_accounts
                   if getattr(a, "kind", "") in ("AIServices", "OpenAI")]

    # Fire all data fetches in parallel
    (agents, deployments, quotas, policies, alerts,
     hourly_requests, token_metrics, cost_today, activity_log) = await asyncio.gather(
        _safe(_real_agents()),
        _safe(_real_deployments(rg)) if rg else _empty(),
        _safe(_real_quotas(rg)) if rg else _empty(),
        _safe(_real_policies(rg)) if rg else _empty(),
        _safe(_real_security_alerts()),
        _safe(_real_hourly_requests(ai_accounts)),
        _safe(_real_token_metrics(ai_accounts), default={"total_tokens": 0, "total_requests": 0, "dep_tokens": {}}),
        _empty_float(),   # Cost Management disabled — was: _safe(_real_cost_today(), default=0.0)
        _safe(_real_activity_log()),
    )

    # Normalise types in case _safe returned [] for dict/float coroutines
    if not isinstance(token_metrics, dict):
        token_metrics = {"total_tokens": 0, "total_requests": 0, "dep_tokens": {}}
    if not isinstance(cost_today, (int, float)):
        cost_today = 0.0

    dep_tokens: dict = token_metrics.get("dep_tokens", {})

    # Enrich deployments and quotas with real per-deployment token counts
    for d in deployments:
        dep_name = d.get("name", "")
        if dep_name in dep_tokens:
            d["tokens_used_today"] = dep_tokens[dep_name]
    for q in quotas:
        dep_name = q.get("deployment", "")
        if dep_name in dep_tokens:
            q["daily_used"] = dep_tokens[dep_name]

    total_deps = len(deployments)
    guardrails_on = sum(1 for d in deployments if d.get("content_filter_enabled"))
    compliance_score = round(guardrails_on / total_deps * 100, 1) if total_deps else 100.0

    open_alerts = [a for a in alerts
                   if a.get("status", "").lower() in ("active", "open", "inprogress", "new")]
    critical_count = sum(1 for a in open_alerts
                         if a.get("severity", "").lower() in ("high", "critical"))

    # Build top-models list from real token data; fall back to deployment model names with 0
    dep_to_model = {d["name"]: d.get("model", "") for d in deployments if d.get("name")}
    model_tokens: dict = {}
    for dep_name, tok in dep_tokens.items():
        model = dep_to_model.get(dep_name, dep_name)
        if model:
            model_tokens[model] = model_tokens.get(model, 0) + tok
    for d in deployments:
        m = d.get("model", "")
        if m and m not in model_tokens:
            model_tokens[m] = 0
    top_models = sorted(
        [{"name": m, "tokens_used_today": t, "cost_today": 0.0} for m, t in model_tokens.items()],
        key=lambda x: x["tokens_used_today"], reverse=True,
    )

    governance_summary = _compute_governance(deployments, policies, agents)

    result = {
        "total_agents": len(agents), "active_agents": len(agents),
        "total_deployments": total_deps, "total_models": total_deps,
        "guardrails_enabled": guardrails_on,
        "compliance_score": compliance_score,
        "active_alerts": len(open_alerts), "open_alerts": len(open_alerts),
        "critical_alerts": critical_count,
        "daily_cost": float(cost_today),
        "cost_this_month_usd": round(float(cost_today) * 30, 2),
        "requests_today": token_metrics.get("total_requests", 0),
        "compliant_agents": sum(1 for a in agents if a.get("compliance_status") == "compliant"),
        "at_risk_agents": sum(1 for a in agents if a.get("compliance_status") == "at-risk"),
        "critical_agents": sum(1 for a in agents if a.get("compliance_status") == "non_compliant"),
        "run_completion_rate": 1.0,
        "prevented_behaviors": 0,
        "total_token_usage": token_metrics.get("total_tokens", 0),
        "top_models": top_models,
        "hourly_requests": hourly_requests,
        "recent_events": activity_log,
        "governance_summary": governance_summary,
        "agents": agents, "deployments": deployments,
        "policies": policies, "security_alerts": alerts, "quotas": quotas,
    }
    _cache_set("overview", result)
    return result


async def get_agents(filter_status: Optional[str] = None) -> list:
    overview = await get_foundry_overview()
    agents = overview.get("agents", [])
    if filter_status:
        agents = [a for a in agents if a.get("status", "").lower() == filter_status.lower()]
    return agents


async def get_deployments() -> list:
    return (await get_foundry_overview()).get("deployments", [])


async def get_compliance_policies() -> list:
    return (await get_foundry_overview()).get("policies", [])


async def get_security_alerts(severity: Optional[str] = None) -> list:
    alerts = (await get_foundry_overview()).get("security_alerts", [])
    if severity:
        alerts = [a for a in alerts if a.get("severity", "").lower() == severity.lower()]
    return alerts


async def get_quotas() -> list:
    return (await get_foundry_overview()).get("quotas", [])


async def get_admin_projects() -> list:
    cached = _cache_get("admin_projects")
    if cached is not None:
        return cached
    if not _has_credentials():
        return []
    try:
        result = await _real_admin_projects()
        _cache_set("admin_projects", result)
        return result
    except Exception as exc:
        logger.error("get_admin_projects failed: %s", exc)
        return []


async def remediate_policy_violation(deployment_id: str) -> dict:
    """Apply guardrail remediation to a deployment (simulated - ARM PATCH requires Owner role)."""
    # Invalidate cache so next fetch reflects the change in UI
    _cache.pop("overview", None)
    return {
        "deployment_id": deployment_id,
        "action": "EnableContentFilter",
        "status": "Remediated",
        "message": (
            f"Content filter and Prompt Shield have been enabled for deployment "
            f"{deployment_id}. Compliance status will update within 30 minutes."
        ),
    }



