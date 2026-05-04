"""
Sanjeevani v2 — AMR Agent
Stage 1: Keyword-based detection (rule engine, no LLM)
Stage 2: RAG enhancement for guideline citations
"""

import re
from dataclasses import dataclass
from config.config_loader import get_amr_rules, get_amr_version


@dataclass
class AMRAlert:
    organism: str
    detected_in: str
    keywords_matched: list[str]
    resistant_to: list[str]
    recommended: list[str]
    severity: str
    guideline_citation: str
    rule_version: str


class AMRAgent:
    def __init__(self, rag_agent=None):
        self.rules = get_amr_rules()
        self.organisms = self.rules.get("organisms", {})
        self.rag_agent = rag_agent

    def _scan_text(self, text: str) -> list[dict]:
        """Scan text for AMR organism keywords. Returns matched organisms."""
        text_lower = text.lower()
        matches = []

        for org_name, org_data in self.organisms.items():
            matched_keywords = []
            for keyword in org_data["keywords"]:
                if re.search(re.escape(keyword.lower()), text_lower):
                    matched_keywords.append(keyword)

            if matched_keywords:
                matches.append({
                    "organism": org_name,
                    "keywords_matched": matched_keywords,
                    "resistant_to": org_data["resistant_to"],
                    "recommended": org_data["recommended"],
                    "severity": org_data["severity"],
                })
        return matches

    def scan(self, clinical_notes: list[dict]) -> list[AMRAlert]:
        """
        Scan clinical notes and culture reports for AMR organisms.

        Args:
            clinical_notes: List of dicts with 'text' and 'source' keys
                e.g., [{"text": "Culture positive for MRSA", "source": "culture report 2026-05-01"}]

        Returns:
            List of AMRAlert objects
        """
        amr_version = get_amr_version()
        alerts = []

        for note in clinical_notes:
            text = note.get("text", "")
            source = note.get("source", "unknown")
            matches = self._scan_text(text)

            for match in matches:
                # Stage 2: RAG enhancement (if available)
                citation = ""
                if self.rag_agent:
                    try:
                        query = f"{match['organism']} antibiotic treatment ICU guidelines"
                        rag_result = self.rag_agent.query(query)
                        citation = rag_result if isinstance(rag_result, str) else str(rag_result)
                    except Exception:
                        citation = "Guidelines unavailable"

                alerts.append(AMRAlert(
                    organism=match["organism"],
                    detected_in=source,
                    keywords_matched=match["keywords_matched"],
                    resistant_to=match["resistant_to"],
                    recommended=match["recommended"],
                    severity=match["severity"],
                    guideline_citation=citation,
                    rule_version=amr_version,
                ))

        return alerts
