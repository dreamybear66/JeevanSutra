"""
Sanjeevani v2 — Orchestrator
Runs the 4-phase pipeline: Ingest → Rule Engines → LLM Agents → Chief Synthesis
"""

from dataclasses import asdict
from engines.outlier_detector import OutlierDetector
from engines.clinical_scoring import ClinicalScoring
from engines.vwrs import VWRSEngine
from agents.amr_agent import AMRAgent
from agents.note_parser import NoteParser
from agents.lab_mapper import LabMapper
from agents.rag_agent import RAGAgent
from agents.chief_agent import ChiefAgent
from config.config_loader import get_rule_version


class Orchestrator:
    def __init__(self):
        # Rule engines (no LLM)
        self.outlier_detector = OutlierDetector()
        self.clinical_scoring = ClinicalScoring()
        self.vwrs_engine = VWRSEngine()

        # LLM agents
        self.note_parser = NoteParser()
        self.lab_mapper = LabMapper()
        self.rag_agent = RAGAgent()
        self.amr_agent = AMRAgent(rag_agent=self.rag_agent)
        self.chief_agent = ChiefAgent()

    def run_pipeline(self, patient_data: dict) -> dict:
        """
        Run the full 4-phase diagnostic pipeline.

        Args:
            patient_data: {
                "patient_id": "uuid",
                "vitals": {"heart_rate": 95, "map": 60, ...},
                "labs": {"potassium": 4.2, "creatinine": 1.5, ...},
                "lab_history": {"potassium": [{"value": 4.0}, ...], ...},
                "creatinine_history": [{"value": 0.9, "recorded_at": "..."}, ...],
                "clinical_notes": [{"text": "...", "source": "..."}],
                "is_ventilated": True,
                "baseline_sofa": 0
            }
        """
        vitals = patient_data.get("vitals", {})
        labs = patient_data.get("labs", {})
        lab_history = patient_data.get("lab_history", {})
        creatinine_history = patient_data.get("creatinine_history", [])
        clinical_notes = patient_data.get("clinical_notes", [])
        is_ventilated = patient_data.get("is_ventilated", False)
        baseline_sofa = patient_data.get("baseline_sofa", 0)

        # ── Phase 2: Rule Engines (parallel-ready, no LLM) ──
        outliers = self.outlier_detector.detect_all(labs, lab_history)
        sofa = self.clinical_scoring.compute_sofa(labs, vitals, baseline_sofa)
        qsofa = self.clinical_scoring.compute_qsofa(vitals)
        sirs = self.clinical_scoring.compute_sirs(vitals, labs)
        aki = self.clinical_scoring.detect_aki(creatinine_history)

        vwrs = None
        if is_ventilated:
            vwrs = self.vwrs_engine.evaluate(vitals)

        amr_alerts = self.amr_agent.scan(clinical_notes)

        # ── Phase 3: LLM Agents ──
        note_results = {}
        for note in clinical_notes:
            parsed = self.note_parser.parse(note.get("text", ""))
            note_results[note.get("source", "unknown")] = parsed

        rag_results = ""
        if sofa.sepsis_criteria_met or qsofa.high_risk:
            rag_results = self.rag_agent.query("sepsis management ICU guidelines")
        if amr_alerts:
            organisms = ", ".join(set(a.organism for a in amr_alerts))
            rag_results += "\n\n" + self.rag_agent.query(f"{organisms} antibiotic resistance treatment")

        # ── Build Rule Facts (immutable) ──
        rule_facts = {
            "outliers": [asdict(o) for o in outliers],
            "sofa": asdict(sofa),
            "qsofa": asdict(qsofa),
            "sirs": asdict(sirs),
            "aki": asdict(aki),
            "vwrs": asdict(vwrs) if vwrs else None,
            "amr": [asdict(a) for a in amr_alerts],
            "rule_version": get_rule_version(),
        }

        agent_outputs = {
            "note_parser": note_results,
            "rag": rag_results,
        }

        # ── Phase 4: Chief Synthesis ──
        report = self.chief_agent.generate_report(rule_facts, agent_outputs)

        return {
            "rule_facts": rule_facts,
            "ai_narrative": report.ai_narrative,
            "contradictions": report.contradictions,
            "diagnosis_blocked": report.diagnosis_blocked,
            "rule_version": report.rule_version,
        }
