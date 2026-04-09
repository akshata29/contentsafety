"""
Capital Markets AI Safety Demo - FastAPI Backend
Covers Azure AI Content Safety + Azure AI Foundry Control Plane
"""
import sys
import asyncio

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from config import settings
from routes import content_safety, foundry_control, demo_data, compliance_pipeline, content_filters, pattern_pipeline
# Startup provisioning imports -- commented out; run setup.py once instead.
# from services.blocklist import provision_demo_blocklist
# from services.custom_categories import provision_demo_incidents
# from services.content_filters import provision_demo_guardrails_and_agents


# _provision_cf_demo -- commented out; run setup.py once instead.
# async def _provision_cf_demo():
#     """Background task: provision CF-Demo-* guardrails and cf-demo-* agents."""
#     try:
#         result = await provision_demo_guardrails_and_agents()
#         provisioned = result.get("provisioned", 0)
#         print(f"Content Filter demo resources: {provisioned} filter types checked/provisioned")
#     except Exception as exc:
#         print(f"Content Filter demo provisioning skipped: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Capital Markets AI Safety Demo")
    # Startup provisioning -- commented out; run setup.py once instead.
    # loop = asyncio.get_event_loop()
    # await loop.run_in_executor(None, provision_demo_blocklist)
    # await loop.run_in_executor(None, provision_demo_incidents)
    # asyncio.create_task(_provision_cf_demo())
    yield
    print("Shutting down...")


app = FastAPI(
    title="Capital Markets AI Safety Platform",
    description="End-to-end demo: Azure AI Content Safety + Azure AI Foundry Control Plane",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(content_safety.router, prefix="/api/content-safety", tags=["Content Safety"])
app.include_router(compliance_pipeline.router, prefix="/api/compliance", tags=["Compliance Pipeline"])
app.include_router(pattern_pipeline.router, prefix="/api/compliance", tags=["Pattern Pipeline"])
app.include_router(foundry_control.router, prefix="/api/foundry", tags=["Foundry Control Plane"])
app.include_router(content_filters.router, prefix="/api/content-filters", tags=["Content Filters"])
app.include_router(demo_data.router, prefix="/api/demo", tags=["Demo Data"])

# Serve static test assets (e.g. test_flagged.jpg) at /data/<filename>
_data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(_data_dir, exist_ok=True)
app.mount("/data", StaticFiles(directory=_data_dir), name="data")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "content_safety_configured": bool(settings.CONTENT_SAFETY_API_KEY and settings.effective_cs_endpoint),
        "foundry_configured": bool(settings.effective_openai_key),
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
