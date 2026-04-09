#!/usr/bin/env python3
"""
Content Safety Demo -- One-Time Setup Script
=============================================
Run this once after cloning the repo and configuring .env before starting the backend.

    python setup.py

What it provisions:
  1. Environment check     -- verifies all required .env variables are present
  2. Guardrails + Agents   -- CF-Demo-* guardrails (ARM raiPolicies) + cf-demo-* agents (Foundry)
  3. Model Deployments     -- verifies each cf-demo-* deployment exists and has the right guardrail
                              NOTE: deployments must be created manually in the Foundry portal;
                              this step only checks them and reports any mismatches.
  4. Blocklist             -- capital-markets-compliance blocklist (Azure AI Content Safety)
  5. Custom Categories     -- financial compliance incident detectors (market manipulation, etc.)

It is safe to re-run: existing resources are updated/verified, not duplicated.
"""
import asyncio
import os
import sys

# Make backend/ importable without installing as a package
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_HERE, "backend"))

from config import settings  # noqa: E402  (import after sys.path manipulation)

_W = 62  # output width


def _header(title: str) -> None:
    print(f"\n{'=' * _W}")
    print(f"  {title}")
    print(f"{'=' * _W}")


def _ok(msg: str) -> None:
    print(f"  [OK]  {msg}")


def _warn(msg: str) -> None:
    print(f"  [!!]  {msg}")


def _fail(msg: str) -> None:
    print(f"  [XX]  {msg}")


def _info(msg: str) -> None:
    print(f"        {msg}")


# ---------------------------------------------------------------------------
# Step 1: environment check
# ---------------------------------------------------------------------------

def _step_env_check() -> bool:
    _header("Step 1/5  Environment Check")
    required = [
        ("CONTENT_SAFETY_ENDPOINT",      settings.effective_cs_endpoint),
        ("CONTENT_SAFETY_API_KEY",       settings.CONTENT_SAFETY_API_KEY),
        ("AZURE_OPENAI_ENDPOINT",        settings.AZURE_OPENAI_ENDPOINT),
        ("AZURE_OPENAI_API_KEY",         settings.effective_openai_key),
        ("AZURE_OPENAI_DEPLOYMENT",      settings.AZURE_OPENAI_DEPLOYMENT),
        ("FOUNDRY_PROJECT_ENDPOINT",     settings.FOUNDRY_PROJECT_ENDPOINT),
        ("AZURE_SUBSCRIPTION_ID",        settings.AZURE_SUBSCRIPTION_ID),
        ("AZURE_FOUNDRY_RESOURCE_GROUP", settings.AZURE_FOUNDRY_RESOURCE_GROUP),
        ("AZURE_TENANT_ID",              settings.AZURE_TENANT_ID),
        ("AZURE_CLIENT_ID",              settings.AZURE_CLIENT_ID),
        ("AZURE_CLIENT_SECRET",          settings.AZURE_CLIENT_SECRET),
    ]
    all_ok = True
    for name, val in required:
        if val:
            _ok(name)
        else:
            _warn(f"{name} -- not set in .env")
            all_ok = False
    if not all_ok:
        _info("")
        _info("Some variables are missing. Steps that depend on them will be skipped.")
        _info("Copy .env.example -> .env and fill in the values, then re-run.")
    return all_ok


# ---------------------------------------------------------------------------
# Step 2: guardrails + agents
# ---------------------------------------------------------------------------

async def _step_guardrails_and_agents() -> bool:
    _header("Step 2/5  Guardrails + Agents")
    _info("Creating/updating CF-Demo-* guardrails (ARM raiPolicies)")
    _info("and cf-demo-* agents (Azure AI Foundry) ...")
    _info("")

    missing = [
        v for v in (
            settings.AZURE_SUBSCRIPTION_ID,
            settings.AZURE_FOUNDRY_RESOURCE_GROUP,
            settings.FOUNDRY_PROJECT_ENDPOINT,
            settings.AZURE_TENANT_ID,
            settings.AZURE_CLIENT_ID,
            settings.AZURE_CLIENT_SECRET,
        ) if not v
    ]
    if missing:
        _warn("Required ARM/Foundry credentials not set -- skipping")
        return False

    try:
        from services.content_filters import (
            provision_demo_guardrails_and_agents,
            _DEMO_GUARDRAIL_CONFIGS,
        )
        result = await provision_demo_guardrails_and_agents()
        all_ok = True
        for ft in _DEMO_GUARDRAIL_CONFIGS:
            detail = result.get("results", {}).get(ft, {})
            gr = detail.get("guardrail", {})
            ag = detail.get("agent", {})
            gr_status = gr.get("status", "unknown")
            ag_status = ag.get("status", "unknown")
            if "error" in gr_status:
                _fail(f"[{ft}] guardrail {gr.get('name','?')} -- {gr_status}")
                all_ok = False
            else:
                _ok(
                    f"[{ft}] guardrail={gr.get('name','?')} [{gr_status}]"
                    f"  agent={ag.get('name','?')} [{ag_status}]"
                )
        return all_ok
    except Exception as exc:
        _fail(f"Guardrail/agent provisioning error: {exc}")
        return False


# ---------------------------------------------------------------------------
# Step 3: model deployment verification
# ---------------------------------------------------------------------------

# Deployment names the user must create manually in the Foundry / Azure OpenAI portal.
# Each MUST have the corresponding CF-Demo-* guardrail attached.
_DEMO_DEPLOYMENT_MAP = {
    "jailbreak":          ("cf-demo-jailbreak",          "CF-Demo-Jailbreak"),
    "xpia":               ("cf-demo-xpia",               "CF-Demo-XPIA"),
    "content_safety":     ("cf-demo-contentsafety",      "CF-Demo-ContentSafety"),
    "task_adherence":     ("cf-demo-taskadherence",      "CF-Demo-TaskAdherence"),
    "pii":                ("cf-demo-pii",                "CF-Demo-PII"),
    "protected_material": ("cf-demo-protectedmaterial",  "CF-Demo-ProtectedMaterial"),
}


async def _step_model_deployments() -> bool:
    _header("Step 3/5  Model Deployment Guardrail Verification")
    _info("Checking that each cf-demo-* deployment exists and has the expected guardrail.")
    _info("")
    _info("  IMPORTANT: model deployments cannot be created by this script.")
    _info("  If any are missing, create them in the Foundry portal (Models + endpoints)")
    _info("  and attach the matching CF-Demo-* guardrail before running the backend.")
    _info("")

    if not all([settings.AZURE_SUBSCRIPTION_ID, settings.AZURE_FOUNDRY_RESOURCE_GROUP]):
        _warn("AZURE_SUBSCRIPTION_ID or AZURE_FOUNDRY_RESOURCE_GROUP not set -- skipping")
        return True  # not a hard failure; other steps can still proceed

    try:
        import httpx
        from services.content_filters import _get_arm_token, _cs_account_from_endpoint

        token = await _get_arm_token()
        if not token:
            _warn("Could not obtain ARM token -- skipping deployment check")
            return True

        sub = settings.AZURE_SUBSCRIPTION_ID
        rg = settings.AZURE_FOUNDRY_RESOURCE_GROUP
        account = _cs_account_from_endpoint()
        arm_headers = {"Authorization": f"Bearer {token}"}
        all_ok = True

        for ft, (dep_name, expected_guardrail) in _DEMO_DEPLOYMENT_MAP.items():
            url = (
                f"https://management.azure.com/subscriptions/{sub}"
                f"/resourceGroups/{rg}"
                f"/providers/Microsoft.CognitiveServices/accounts/{account}"
                f"/deployments/{dep_name}?api-version=2024-10-01"
            )
            async with httpx.AsyncClient() as c:
                r = await c.get(url, headers=arm_headers, timeout=10)

            if r.status_code == 404:
                _warn(
                    f"{dep_name}: NOT FOUND"
                    f" -- create in portal and attach guardrail '{expected_guardrail}'"
                )
                all_ok = False
            elif r.status_code == 200:
                props = r.json().get("properties", {})
                actual_guardrail = props.get("raiPolicyName", "(none)")
                if actual_guardrail == expected_guardrail:
                    _ok(f"{dep_name}: guardrail={actual_guardrail}")
                else:
                    _warn(
                        f"{dep_name}: guardrail='{actual_guardrail}'"
                        f" (expected '{expected_guardrail}')"
                    )
                    all_ok = False
            else:
                _warn(f"{dep_name}: ARM returned HTTP {r.status_code}")
                all_ok = False

        return all_ok

    except Exception as exc:
        _fail(f"Deployment verification error: {exc}")
        return False


# ---------------------------------------------------------------------------
# Step 4: blocklist
# ---------------------------------------------------------------------------

def _step_blocklist() -> bool:
    _header("Step 4/5  Blocklist  (capital-markets-compliance)")

    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        _warn("CONTENT_SAFETY_ENDPOINT or CONTENT_SAFETY_API_KEY not set -- skipping")
        return False

    try:
        from services.blocklist import (
            provision_demo_blocklist,
            CAPITAL_MARKETS_BLOCKLIST,
            _COMPLIANCE_TERMS,
        )
        provision_demo_blocklist()
        _ok(
            f"Blocklist '{CAPITAL_MARKETS_BLOCKLIST}' ready"
            f" ({len(_COMPLIANCE_TERMS)} compliance terms)"
        )
        return True
    except Exception as exc:
        _fail(f"Blocklist provisioning error: {exc}")
        return False


# ---------------------------------------------------------------------------
# Step 5: custom categories (financial incident detectors)
# ---------------------------------------------------------------------------

def _step_custom_categories() -> bool:
    _header("Step 5/5  Custom Categories  (financial incident detectors)")

    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        _warn("CONTENT_SAFETY_ENDPOINT or CONTENT_SAFETY_API_KEY not set -- skipping")
        return False

    try:
        from services.custom_categories import (
            provision_demo_incidents,
            FINANCIAL_CUSTOM_CATEGORIES,
            _INCIDENT_NAME,
        )
        all_ok = True
        for key in FINANCIAL_CUSTOM_CATEGORIES:
            try:
                from services.custom_categories import _provision_incident
                _provision_incident(key)
                _ok(f"{_INCIDENT_NAME[key]}  ({key})")
            except Exception as exc:
                _fail(f"{key}: {exc}")
                all_ok = False
        return all_ok
    except Exception as exc:
        _fail(f"Custom category provisioning error: {exc}")
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    print()
    print("=" * _W)
    print("  Content Safety Demo -- One-Time Setup")
    print("=" * _W)
    print()
    _info("Provisions all Azure resources needed by the demo backend.")
    _info("Safe to re-run; existing resources are updated, not duplicated.")
    _info("")
    _info("Pre-requisites:")
    _info("  - .env file configured (copy from .env.example)")
    _info("  - Azure service principal with Contributor + Cognitive Services Contributor")
    _info("  - Python dependencies installed:  pip install -r requirements.txt")

    # Run steps
    _step_env_check()                             # informational, always runs
    ok2 = await _step_guardrails_and_agents()
    ok3 = await _step_model_deployments()
    ok4 = _step_blocklist()
    ok5 = _step_custom_categories()

    # Summary
    _header("Summary")
    steps = [
        ("Guardrails + Agents",   ok2),
        ("Model Deployments",     ok3),
        ("Blocklist",             ok4),
        ("Custom Categories",     ok5),
    ]
    all_ok = True
    for label, ok in steps:
        if ok:
            _ok(label)
        else:
            _warn(f"{label}  (see warnings above)")
            all_ok = False

    print()
    if all_ok:
        print("  All resources provisioned successfully.")
        print("  You can now start the backend:  run_backend.bat")
    else:
        print("  Setup completed with warnings. Review output above.")
        print("  Once resolved, re-run this script before starting the backend.")
    print()


if __name__ == "__main__":
    asyncio.run(main())
