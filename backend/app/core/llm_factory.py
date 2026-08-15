from langchain_openai import ChatOpenAI
from app.config import settings

class LLMFactory:
    """Factory for instantiating LLM clients with standard configuration."""

    @staticmethod
    def get_llm(temperature: float = 0.0):
        if settings.OPENAI_API_KEY:
            return ChatOpenAI(
                model=settings.LLM_MODEL,
                temperature=temperature,
                api_key=settings.OPENAI_API_KEY
            )
        return None
