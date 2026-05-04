"""
Sanjeevani v2 — Chief Agent
Narrative-only LLM. Receives SANITIZED scores/flags only.
Cannot override rule engine decisions.
Raw patient values NEVER leave the system.
"""

import json
from dataclasses import dataclass
from db.gemini_client import call_llm
from utils.validators import validate_narrative


@dataclass
class DiagnosticReport:
    rule_facts: dict
    ai_narrative: str
    contradictions: list[str]
    diagnosis_blocked: bool
    rule_version: str


# ── Severity label mappings (medical knowledge, not patient data) ──
SOFA_ORGAN_LABELS = {
    0: "normal",
    1: "mild dysfunction",
    2: "moderate dysfunction",
    3: "severe dysfunction (organ failure)",
    4: "critical failure",
}

AKI_STAGE_LABELS = {
    0: "no AKI",
    1: "Stage 1 — early kidney injury",
    2: "Stage 2 — moderate kidney injury",
    3: "Stage 3 — severe kidney failure, may require dialysis",
}

SIRS_LABELS = {
    0: "no systemic inflammatory response",
    1: "1 criterion met — monitor closely",
    2: "SIRS positive — systemic inflammatory response suspected",
    3: "strongly positive SIRS",
    4: "all 4 SIRS criteria met — significant systemic inflammation",
}


def _sanitize_for_llm(rule_facts: dict) -> dict:
    """
    Convert rule engine results into rich clinical descriptions for the LLM.
    Sends interpretations (not raw values) so the LLM can write meaningful narrative.

    What goes out: "cardiovascular: score 3 (severe dysfunction, organ failure)"
    What stays local: "MAP=60, dopamine 8mcg/kg/min"
    """
    sanitized = {}

    # ── SOFA: organ-by-organ clinical interpretation ──
    sofa = rule_facts.get("sofa", {})
    organ_scores = sofa.get("organ_scores", {})
    organ_descriptions = {}
    for organ, score in organ_scores.items():
        label = SOFA_ORGAN_LABELS.get(score, "unknown")
        organ_descriptions[organ] = f"score {score}/4 — {label}"

    sanitized["sofa"] = {
        "total_score": f"{sofa.get('total', 0)}/24",
        "interpretation": "Critical" if sofa.get("total", 0) >= 12 else
                         "Severe" if sofa.get("total", 0) >= 8 else
                         "Moderate" if sofa.get("total", 0) >= 4 else "Low",
        "sepsis_criteria_met": sofa.get("sepsis_criteria_met", False),
        "organ_breakdown": organ_descriptions,
        "organ_failures": sofa.get("organ_failures", []),
    }

    # ── qSOFA: bedside risk assessment ──
    qsofa = rule_facts.get("qsofa", {})
    qsofa_criteria = qsofa.get("criteria", {})
    sanitized["qsofa"] = {
        "score": f"{qsofa.get('total', 0)}/3",
        "high_risk": qsofa.get("high_risk", False),
        "findings": [
            "elevated respiratory rate" if qsofa_criteria.get("respiratory_rate") else None,
            "low blood pressure" if qsofa_criteria.get("systolic_bp") else None,
            "altered mental status" if qsofa_criteria.get("altered_mentation") else None,
        ],
    }
    sanitized["qsofa"]["findings"] = [f for f in sanitized["qsofa"]["findings"] if f]

    # ── SIRS: systemic inflammation ──
    sirs = rule_facts.get("sirs", {})
    sirs_count = sirs.get("total", 0)
    sirs_criteria = sirs.get("criteria", {})
    sanitized["sirs"] = {
        "criteria_met_count": f"{sirs_count}/4",
        "interpretation": SIRS_LABELS.get(sirs_count, ""),
        "positive_criteria": [
            "abnormal temperature" if sirs_criteria.get("temperature") else None,
            "elevated heart rate (tachycardia)" if sirs_criteria.get("heart_rate") else None,
            "abnormal respiratory rate or low PaCO2" if sirs_criteria.get("respiratory") else None,
            "abnormal white blood cell count" if sirs_criteria.get("wbc") else None,
        ],
    }
    sanitized["sirs"]["positive_criteria"] = [c for c in sanitized["sirs"]["positive_criteria"] if c]

    # ── AKI: kidney injury staging ──
    aki = rule_facts.get("aki", {})
    aki_stage = aki.get("stage", 0)
    sanitized["aki"] = {
        "stage": aki_stage,
        "interpretation": AKI_STAGE_LABELS.get(aki_stage, "unknown"),
        "trigger": aki.get("trigger", "none"),
    }

    # ── VWRS: ventilator weaning status ──
    vwrs = rule_facts.get("vwrs")
    if vwrs:
        param_results = vwrs.get("parameter_results", {})
        param_statuses = {
            "breathing pattern (RSBI)": param_results.get("rsbi", {}).get("status", "unknown"),
            "oxygenation (SpO2/FiO2)": param_results.get("spo2_fio2", {}).get("status", "unknown"),
            "ventilator support (PEEP)": param_results.get("peep", {}).get("status", "unknown"),
            "consciousness (GCS)": param_results.get("gcs", {}).get("status", "unknown"),
            "hemodynamic stability (MAP)": param_results.get("map", {}).get("status", "unknown"),
        }
        sanitized["vwrs"] = {
            "overall_status": vwrs.get("overall"),
            "readiness_score": f"{vwrs.get('score', 0)}/5",
            "parameter_assessments": param_statuses,
            "blocking_reasons": vwrs.get("blocking_reasons", []),
        }

    # ── AMR: resistance alerts (organism info is medical, not patient PII) ──
    amr_list = rule_facts.get("amr", [])
    sanitized["amr_alerts"] = [
        {
            "organism": a.get("organism"),
            "severity": a.get("severity"),
            "resistant_to": a.get("resistant_to", []),
            "recommended_drugs": a.get("recommended", []),
            "guideline_citation": a.get("guideline_citation", ""),
        }
        for a in amr_list
    ]

    # ── Outliers: flagged parameters (name + reason, no values) ──
    outliers = rule_facts.get("outliers", [])
    sanitized["outlier_flags"] = [
        {
            "parameter": o.get("parameter"),
            "reason": o.get("reason"),
            "action_required": o.get("action"),
            "confidence": o.get("confidence"),
        }
        for o in outliers if o.get("is_outlier")
    ]

    return sanitized


class ChiefAgent:
    SYSTEM_INSTRUCTION = """You are a clinical narrative writer for Sanjeevani, an ICU diagnostic system.

STRICT RULES:
1. You MUST NOT change any scores, flags, or values from the PRE-COMPUTED CLINICAL FACTS.
2. You MUST NOT recalculate any scores.
3. You MUST NOT contradict any flags or assessments.
4. Your ONLY job is to explain the findings in clear, clinical language.
5. Reference the scores and flags in your narrative.
6. Use professional medical terminology.
7. Structure your response with sections: Summary, Key Findings, Risk Assessment, Recommendations.
8. Do NOT mention any patient names, IDs, or identifying information."""

    def generate_report(self, rule_facts: dict, agent_outputs: dict) -> DiagnosticReport:
        """
        Generate a diagnostic report using rule engine facts and LLM narrative.
        Raw patient values are stripped before sending to external LLM.
        """
        rule_version = rule_facts.get("rule_version", "unknown")

        # SANITIZE: only scores/flags go to LLM, never raw patient data
        safe_facts = _sanitize_for_llm(rule_facts)

        # Symptoms are already de-identified by note_parser
        symptoms = agent_outputs.get("note_parser", {})
        guidelines = agent_outputs.get("rag", "No guidelines retrieved")

        prompt = f"""PRE-COMPUTED CLINICAL SCORES (IMMUTABLE — do not alter):
{json.dumps(safe_facts, indent=2, default=str)}

EXTRACTED SYMPTOMS: {json.dumps(symptoms, default=str)}
RELEVANT GUIDELINES: {guidelines}

Write a clinical narrative explaining these findings.
Do NOT recalculate any scores. Do NOT contradict any flags."""

        # Generate narrative
        try:
            narrative = call_llm(prompt, system_instruction=self.SYSTEM_INSTRUCTION)
        except Exception as e:
            narrative = f"Narrative generation failed: {str(e)}"

        # Post-validation against FULL rule_facts (locally, not sent to LLM)
        contradictions = validate_narrative(narrative, rule_facts)

        # If outliers are blocking, force diagnosis_blocked
        outliers = rule_facts.get("outliers", [])
        has_outliers = any(
            o.get("is_outlier", False) if isinstance(o, dict) else getattr(o, "is_outlier", False)
            for o in outliers
        )

        return DiagnosticReport(
            rule_facts=rule_facts,       # full facts stored locally, never sent to LLM
            ai_narrative=narrative,
            contradictions=contradictions,
            diagnosis_blocked=has_outliers,
            rule_version=rule_version,
        )
