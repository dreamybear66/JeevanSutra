"""
Sanjeevani v2 — Note Parser Agent
Uses Gemini to extract symptoms from free-text clinical notes.
"""

from db.gemini_client import call_llm
from utils.deidentify import deidentify


class NoteParser:
    SYSTEM_INSTRUCTION = """You are a clinical note parser for an ICU diagnostic system.
Extract structured symptoms and clinical findings from the given clinical note.
Return a JSON object with:
{
  "symptoms": ["symptom1", "symptom2"],
  "vital_observations": ["observation1"],
  "medications_mentioned": ["med1"],
  "procedures_mentioned": ["proc1"],
  "clinical_impression": "brief summary"
}
Return ONLY valid JSON. No markdown, no explanation."""

    def parse(self, note_text: str) -> dict:
        """
        Parse a clinical note and extract structured information.

        Args:
            note_text: Free-text clinical note

        Returns:
            Dict with extracted symptoms, observations, etc.
        """
        prompt = f"Parse this clinical note:\n\n{deidentify(note_text)[0]}"

        try:
            response = call_llm(prompt, system_instruction=self.SYSTEM_INSTRUCTION)
            # Clean response (remove markdown code fences if present)
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("```", 1)[0]

            import json
            return json.loads(cleaned)
        except Exception as e:
            return {
                "symptoms": [],
                "vital_observations": [],
                "medications_mentioned": [],
                "procedures_mentioned": [],
                "clinical_impression": f"Parse error: {str(e)}",
                "raw_text": note_text,
            }
