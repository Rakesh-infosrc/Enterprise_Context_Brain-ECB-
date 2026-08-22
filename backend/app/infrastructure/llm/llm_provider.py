"""
Enterprise Context Brain (ECB) v2.2 - LLM Provider Service
Unified interface for Gemini (primary) and Groq (fallback) for AI synthesis.
"""

from typing import Dict, Any, Optional, List, Generator
import json
import logging
from google import genai
from google.genai import types as genai_types
from groq import Groq

from ...core.config import get_settings


logger = logging.getLogger(__name__)


class LLMProvider:
    def __init__(self):
        self.settings = get_settings()
        self.active_provider = self.settings.active_provider
        
        # Initialize clients
        self.gemini_client = None
        self.groq_client = None

        if self.settings.has_gemini:
            self.gemini_client = genai.Client(api_key=self.settings.gemini_api_key)
            
        if self.settings.has_groq:
            self.groq_client = Groq(api_key=self.settings.groq_api_key)

    def is_simulated(self) -> bool:
        return self.active_provider == "simulated"

    def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Generates text using the active LLM provider.
        Returns a dict with 'text' and 'usage' (tokens).
        """
        if self.active_provider == "simulated":
            return {
                "text": "Simulated AI response due to missing API keys.",
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

        try:
            if self.active_provider == "gemini" and self.gemini_client:
                return self._generate_gemini(prompt, system_prompt, temperature, max_tokens)
            
            if self.active_provider == "groq" and self.groq_client:
                return self._generate_groq(prompt, system_prompt, temperature, max_tokens)

        except Exception as e:
            logger.error(f"Error calling {self.active_provider}: {str(e)}")
            
            # Auto fallback from Gemini to Groq
            if self.active_provider == "gemini" and self.settings.has_groq and self.settings.ecb_llm_mode == "auto":
                logger.info("Falling back to Groq...")
                try:
                    return self._generate_groq(prompt, system_prompt, temperature, max_tokens)
                except Exception as e2:
                    logger.error(f"Error calling fallback Groq: {str(e2)}")
                    
        return {
            "text": "AI generation failed. Please check your API keys or network connection.",
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        }

    def generate_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1000
    ) -> Generator[str, None, None]:
        """
        Generates text using the active LLM provider and yields chunks as they arrive.
        """
        if self.active_provider == "simulated":
            import time
            simulated_text = "Simulated AI response due to missing API keys."
            for word in simulated_text.split(" "):
                yield word + " "
                time.sleep(0.05)
            return

        try:
            if self.active_provider == "gemini" and self.gemini_client:
                yield from self._generate_gemini_stream(prompt, system_prompt, temperature, max_tokens)
                return
            
            if self.active_provider == "groq" and self.groq_client:
                yield from self._generate_groq_stream(prompt, system_prompt, temperature, max_tokens)
                return

        except Exception as e:
            logger.error(f"Error streaming {self.active_provider}: {str(e)}")
            
            if self.active_provider == "gemini" and self.settings.has_groq and self.settings.ecb_llm_mode == "auto":
                logger.info("Falling back to Groq for streaming...")
                try:
                    yield from self._generate_groq_stream(prompt, system_prompt, temperature, max_tokens)
                    return
                except Exception as e2:
                    logger.error(f"Error streaming fallback Groq: {str(e2)}")
                    
        yield "AI generation failed. Please check your API keys or network connection."

    def _generate_gemini(
        self, 
        prompt: str, 
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        config = genai_types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_prompt if system_prompt else None
        )
        
        response = self.gemini_client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=config,
        )
        
        usage = response.usage_metadata
        return {
            "text": response.text,
            "usage": {
                "prompt_tokens": usage.prompt_token_count if usage else 0,
                "completion_tokens": usage.candidates_token_count if usage else 0,
                "total_tokens": usage.total_token_count if usage else 0
            }
        }

    def _generate_gemini_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> Generator[str, None, None]:
        config = genai_types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_prompt if system_prompt else None
        )
        
        response_stream = self.gemini_client.models.generate_content_stream(
            model=self.settings.gemini_model,
            contents=prompt,
            config=config,
        )
        
        for chunk in response_stream:
            if chunk.text:
                yield chunk.text

    def _generate_groq(
        self, 
        prompt: str, 
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.groq_client.chat.completions.create(
            messages=messages,
            model=self.settings.groq_model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        usage = response.usage
        return {
            "text": response.choices[0].message.content,
            "usage": {
                "prompt_tokens": usage.prompt_tokens if usage else 0,
                "completion_tokens": usage.completion_tokens if usage else 0,
                "total_tokens": usage.total_tokens if usage else 0
            }
        }

    def _generate_groq_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> Generator[str, None, None]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.groq_client.chat.completions.create(
            messages=messages,
            model=self.settings.groq_model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
