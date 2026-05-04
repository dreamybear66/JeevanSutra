"""
Sanjeevani v2 — Google Gemini LLM Client
Works with google-generativeai package.
"""

import google.generativeai as genai
from settings import get_settings
from functools import lru_cache


@lru_cache()
def _configure_gemini():
    """Configure Gemini API key (called once)."""
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    return True


def call_llm(prompt: str, system_instruction: str = None) -> str:
    """
    Call Gemini with a prompt and optional system instruction.
    Returns the generated text.
    """
    _configure_gemini()
    settings = get_settings()

    model_kwargs = {}
    if system_instruction:
        model_kwargs["system_instruction"] = system_instruction

    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        **model_kwargs,
    )

    response = model.generate_content(prompt)
    return response.text
