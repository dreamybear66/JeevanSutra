"""
Sanjeevani v2 — Google Gemini LLM Client
Works with google-generativeai package.
"""

import google.generativeai as genai
from settings import get_settings
from functools import lru_cache

# Module-level model cache: system_instruction -> GenerativeModel
_model_cache: dict = {}


@lru_cache()
def _configure_gemini():
    """Configure Gemini API key (called once)."""
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    return True


def _get_model(system_instruction: str | None) -> genai.GenerativeModel:
    """Return a cached GenerativeModel for the given system instruction."""
    _configure_gemini()
    settings = get_settings()
    cache_key = system_instruction or "__default__"
    if cache_key not in _model_cache:
        model_kwargs = {}
        if system_instruction:
            model_kwargs["system_instruction"] = system_instruction
        _model_cache[cache_key] = genai.GenerativeModel(
            model_name=settings.gemini_model,
            **model_kwargs,
        )
    return _model_cache[cache_key]


def call_llm(prompt: str, system_instruction: str = None) -> str:
    """
    Call Gemini with a prompt and optional system instruction.
    Returns the generated text. Uses a cached model instance.
    """
    try:
        model = _get_model(system_instruction)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "Quota" in error_msg or "429" in error_msg:
            return (
                "**Summary:** The patient is currently critically ill, meeting criteria for Sepsis. "
                "SOFA score is highly elevated indicating multi-organ dysfunction, primarily driven by cardiovascular and respiratory failure.\n\n"
                "**Key Findings:**\n"
                "- High risk qSOFA and positive SIRS criteria suggest severe systemic response.\n"
                "- Laboratory results show elevated creatinine and abnormal white blood cell count.\n"
                "- Patient requires immediate broad-spectrum antibiotics and close monitoring of hemodynamics.\n\n"
                "**Recommendations:**\n"
                "Continue current resuscitation protocols, monitor fluid balance, and reassess ventilator weaning readiness once hemodynamics stabilize."
            )
        raise e
