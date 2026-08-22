"""
Enterprise Context Brain (ECB) v2.2 - Centralized Configuration
Loads settings from environment variables and .env file with type-safe defaults.
"""

import os
from typing import Optional, Literal
from pydantic_settings import BaseSettings
from pydantic import Field


class ECBSettings(BaseSettings):
    """Central configuration loaded from environment variables / .env file."""

    # LLM API Keys
    gemini_api_key: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")

    # Model Selection
    gemini_model: str = Field(default="gemini-3.6-flash", alias="GEMINI_MODEL")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")

    # LLM Mode
    ecb_llm_mode: Literal["auto", "gemini", "groq", "simulated"] = Field(
        default="auto", alias="ECB_LLM_MODE"
    )

    model_config = {
        "env_file": os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.strip())

    @property
    def has_groq(self) -> bool:
        return bool(self.groq_api_key and self.groq_api_key.strip())

    @property
    def has_any_llm(self) -> bool:
        return self.has_gemini or self.has_groq

    @property
    def active_provider(self) -> str:
        """Returns which LLM provider is active based on mode and available keys."""
        if self.ecb_llm_mode == "simulated":
            return "simulated"
        if self.ecb_llm_mode == "gemini":
            return "gemini" if self.has_gemini else "simulated"
        if self.ecb_llm_mode == "groq":
            return "groq" if self.has_groq else "simulated"
        # Auto mode: prefer Gemini, fallback to Groq, then simulated
        if self.has_gemini:
            return "gemini"
        if self.has_groq:
            return "groq"
        return "simulated"


# Singleton instance
_settings: Optional[ECBSettings] = None


def get_settings() -> ECBSettings:
    global _settings
    if _settings is None:
        _settings = ECBSettings()
    return _settings
