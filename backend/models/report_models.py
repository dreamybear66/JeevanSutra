"""
Sanjeevani v2 — Pydantic Models: Report
"""
from pydantic import BaseModel
from typing import Optional, Any


class ReportResponse(BaseModel):
    report_id: str
    patient_id: str
    report_version: int
    rule_facts: dict
    ai_narrative: str
    contradictions: list[str] = []
    diagnosis_blocked: bool = False
    rule_version: str = ""
    generated_at: Optional[str] = None
