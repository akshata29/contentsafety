"""
Azure AI Content Safety - Blocklist Management Service
Custom blocklists for financial compliance (restricted securities, sanctions, etc.)
"""
from typing import List
from azure.ai.contentsafety import BlocklistClient
from azure.ai.contentsafety.models import (
    AddOrUpdateTextBlocklistItemsOptions,
    TextBlocklist,
    TextBlocklistItem,
)
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

from config import settings
from models.schemas import BlocklistRequest, BlocklistResponse, BlocklistItem
from services._transport import make_transport, with_ssl_retry


def _make_client() -> BlocklistClient:
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        raise RuntimeError("Content Safety credentials not configured. Set CONTENT_SAFETY_ENDPOINT and CONTENT_SAFETY_API_KEY in .env")
    return BlocklistClient(
        endpoint=settings.effective_cs_endpoint,
        credential=AzureKeyCredential(settings.CONTENT_SAFETY_API_KEY),
        transport=make_transport(),
    )


def list_blocklists() -> List[dict]:
    try:
        with _make_client() as client:
            return with_ssl_retry(lambda: [
                {"name": bl.blocklist_name, "description": bl.description}
                for bl in client.list_text_blocklists()
            ])
    except HttpResponseError as e:
        raise RuntimeError(f"Blocklist API error: {e.message}") from e


def create_or_update_blocklist(req: BlocklistRequest) -> BlocklistResponse:
    try:
        with _make_client() as client:
            def _do():
                client.create_or_update_text_blocklist(
                    blocklist_name=req.blocklist_name,
                    options=TextBlocklist(
                        blocklist_name=req.blocklist_name,
                        description=f"Capital Markets compliance blocklist: {req.blocklist_name}",
                    ),
                )
                sdk_items = [TextBlocklistItem(text=item.text) for item in req.items]
                client.add_or_update_blocklist_items(
                    blocklist_name=req.blocklist_name,
                    options=AddOrUpdateTextBlocklistItemsOptions(blocklist_items=sdk_items),
                )
            with_ssl_retry(_do)
    except HttpResponseError as e:
        raise RuntimeError(f"Blocklist API error: {e.message}") from e

    return BlocklistResponse(
        blocklist_name=req.blocklist_name,
        item_count=len(req.items),
        items=req.items,
    )


def get_blocklist_items(blocklist_name: str) -> List[BlocklistItem]:
    try:
        with _make_client() as client:
            return [
                BlocklistItem(text=item.text)
                for item in client.list_text_blocklist_items(blocklist_name=blocklist_name)
            ]
    except HttpResponseError as e:
        raise RuntimeError(f"Blocklist API error: {e.message}") from e


# ---------------------------------------------------------------------------
# Startup provisioning
# ---------------------------------------------------------------------------

CAPITAL_MARKETS_BLOCKLIST = "capital-markets-compliance"

_COMPLIANCE_TERMS = [
    # Insider trading / MNPI
    "MNPI", "material non-public information", "insider tip", "front-run", "front run",
    # Market manipulation
    "pump and dump", "wash trade", "wash-trade", "spoofing", "layering", "painting the tape",
    # Sanctions / regulatory
    "OFAC", "XYZ-RESTRICTED", "restricted security", "sanctioned entity",
    # Fraud
    "round-trip trade", "churning", "unauthorized trade", "undisclosed commission",
]


def provision_demo_blocklist() -> None:
    """Idempotently create the capital-markets-compliance blocklist on startup."""
    if not settings.effective_cs_endpoint or not settings.CONTENT_SAFETY_API_KEY:
        print("[blocklist] Credentials not configured, skipping demo blocklist provisioning.")
        return
    try:
        with _make_client() as client:
            client.create_or_update_text_blocklist(
                blocklist_name=CAPITAL_MARKETS_BLOCKLIST,
                options=TextBlocklist(
                    blocklist_name=CAPITAL_MARKETS_BLOCKLIST,
                    description="Capital Markets compliance terms: MNPI, sanctions, manipulation, fraud",
                ),
            )
            sdk_items = [TextBlocklistItem(text=t) for t in _COMPLIANCE_TERMS]
            client.add_or_update_blocklist_items(
                blocklist_name=CAPITAL_MARKETS_BLOCKLIST,
                options=AddOrUpdateTextBlocklistItemsOptions(blocklist_items=sdk_items),
            )
        print(f"[blocklist] '{CAPITAL_MARKETS_BLOCKLIST}' provisioned with {len(_COMPLIANCE_TERMS)} terms.")
    except HttpResponseError as e:
        print(f"[blocklist] Warning: could not provision demo blocklist: {e.message}")
    except Exception as e:
        print(f"[blocklist] Warning: could not provision demo blocklist: {e}")
