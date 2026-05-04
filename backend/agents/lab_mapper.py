"""
Sanjeevani v2 — Lab Mapper Agent
Uses Gemini to map raw lab report text to structured lab values.
"""

from db.gemini_client import call_llm
from utils.deidentify import deidentify
import json


class LabMapper:
    SYSTEM_INSTRUCTION = """You are a lab report parser for an ICU diagnostic system.
Extract structured lab values from the given lab report text.
Return a JSON object where keys are parameter names and values are objects:
{
  "potassium": {"value": 4.2, "unit": "mmol/L"},
  "creatinine": {"value": 1.1, "unit": "mg/dL"},
  "platelets": {"value": 150, "unit": "K/uL"}
}
Use standard parameter names: potassium, sodium, creatinine, bilirubin, platelets,
wbc, hemoglobin, glucose, lactate, pH, paco2, pao2.
Return ONLY valid JSON. No markdown, no explanation."""

    def map_labs(self, lab_text: str) -> dict:
        """
        Map raw lab report text to structured values.

        Args:
            lab_text: Raw lab report text

        Returns:
            Dict of {parameter: {value, unit}}
        """
        prompt = f"Extract lab values from this report:\n\n{deidentify(lab_text)[0]}"

        try:
            response = call_llm(prompt, system_instruction=self.SYSTEM_INSTRUCTION)
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("```", 1)[0]
            return json.loads(cleaned)
        except Exception as e:
            return {"error": str(e), "raw_text": lab_text}
