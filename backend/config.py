"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field

# Resolve .env from project root (parent of backend/) regardless of cwd
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Content Safety
    CONTENT_SAFETY_ENDPOINT: str = ""
    CONTENT_SAFETY_API_KEY: str = ""
    CONTENT_SAFETY_API_VERSION: str = "2024-09-01"

    # Azure AI Services (alternative name used in some .env templates)
    AZURE_AI_SERVICES_ENDPOINT: str = ""

    # Azure AI Language (for PII detection, NER, etc.)
    # If not set, falls back to AZURE_AI_SERVICES_ENDPOINT then CONTENT_SAFETY_ENDPOINT.
    # Requires a multi-service AI Services resource or a dedicated Language resource.
    AZURE_AI_LANGUAGE_ENDPOINT: str = ""
    AZURE_AI_LANGUAGE_API_KEY: str = ""

    # Azure OpenAI / Foundry
    AZURE_OPENAI_ENDPOINT: str = ""
    # Accept both AZURE_OPENAI_API_KEY and AZURE_OPENAI_KEY
    AZURE_OPENAI_API_KEY: str = Field(default="", alias="AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_KEY: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o"
    AZURE_OPENAI_API_VERSION: str = "2025-01-01-preview"
    # API key for the Foundry project endpoint (cf-demo-* deployments)
    AZURE_FOUNDRY_KEY: str = ""

    # Foundry project metadata
    AZURE_FOUNDRY_PROJECT_NAME: str = ""
    FOUNDRY_PROJECT_ENDPOINT: str = ""
    AZURE_FOUNDRY_RESOURCE_GROUP: str = ""
    AZURE_SUBSCRIPTION_ID: str = ""

    # Azure Monitor / App Insights (for Filter Analytics)
    # Log Analytics workspace ID linked to astaiappinsight
    APPINSIGHTS_WORKSPACE_ID: str = ""

    # Entra ID
    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""

    # Backend
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    LOG_LEVEL: str = "INFO"

    @property
    def effective_openai_key(self) -> str:
        """Return whichever OpenAI key env var is populated."""
        return self.AZURE_OPENAI_API_KEY or self.AZURE_OPENAI_KEY

    @property
    def effective_cs_endpoint(self) -> str:
        """Return Content Safety endpoint, falling back to AI Services endpoint."""
        return self.CONTENT_SAFETY_ENDPOINT or self.AZURE_AI_SERVICES_ENDPOINT

    @property
    def effective_language_endpoint(self) -> str:
        """Return Language endpoint: dedicated Language > AI Services (multi-service only).
        Does NOT fall back to CONTENT_SAFETY_ENDPOINT because a dedicated Content Safety
        resource does not expose the Language API.
        """
        return (
            self.AZURE_AI_LANGUAGE_ENDPOINT
            or self.AZURE_AI_SERVICES_ENDPOINT
        )

    @property
    def effective_language_key(self) -> str:
        """Return Language API key, falling back to Content Safety key.
        Only safe when both endpoints point to the same multi-service resource.
        """
        return self.AZURE_AI_LANGUAGE_API_KEY or self.CONTENT_SAFETY_API_KEY

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"
        populate_by_name = True


settings = Settings()

