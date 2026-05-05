"""
Sanjeevani v2 — Analysis Routes
POST /api/analyze/{patient_id} — triggers full diagnostic pipeline
"""

import json
import asyncio
from fastapi import APIRouter, HTTPException
from db.supabase_client import get_supabase_client
from agents.orchestrator import Orchestrator
from utils.provenance import tag_report

router = APIRouter()
orchestrator = Orchestrator()


@router.post("/analyze/{patient_id}")
async def analyze_patient(patient_id: str):
    sb = get_supabase_client()

    # 1. Verify patient exists
    patient_res = sb.table("patients").select("*").eq("patient_id", patient_id).execute()
    if not patient_res.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = patient_res.data[0]

    # 2. Fetch latest vitals
    vitals_res = sb.table("vital_signs").select("*").eq(
        "patient_id", patient_id
    ).order("recorded_at", desc=True).limit(1).execute()
    vitals = vitals_res.data[0] if vitals_res.data else {}

    # 3. Fetch latest labs
    labs_res = sb.table("lab_results").select("*").eq(
        "patient_id", patient_id
    ).order("recorded_at", desc=True).execute()

    labs = {}
    lab_history = {}
    for lab in (labs_res.data or []):
        param = lab["parameter_name"]
        if param not in labs:
            labs[param] = lab["value"]
        if param not in lab_history:
            lab_history[param] = []
        lab_history[param].append({"value": lab["value"], "recorded_at": lab["recorded_at"]})

    # 4. Creatinine history for AKI
    creatinine_history = lab_history.get("creatinine", [])

    # 5. Fetch clinical notes
    notes_res = sb.table("raw_data").select("*").eq(
        "patient_id", patient_id
    ).in_("data_type", ["note", "culture"]).order("uploaded_at", desc=True).limit(10).execute()

    clinical_notes = [
        {"text": n.get("raw_content", ""), "source": f"{n['data_type']} from {n['uploaded_at']}"}
        for n in (notes_res.data or [])
    ]

    # 6. Build patient data for pipeline
    patient_data = {
        "patient_id": patient_id,
        "vitals": vitals,
        "labs": labs,
        "lab_history": lab_history,
        "creatinine_history": creatinine_history,
        "clinical_notes": clinical_notes,
        "is_ventilated": patient.get("is_ventilated", False),
        "baseline_sofa": 0,
    }

    # 7. Run pipeline in thread (non-blocking)
    result = await asyncio.to_thread(orchestrator.run_pipeline, patient_data)

    # 8. Apply provenance badges
    result = tag_report(result)

    rule_facts = result.get("rule_facts", {})

    # ── Extract rule engine results using ACTUAL field names ──
    # SOFA: { total, organ_scores, sepsis_criteria_met, organ_failures, rule_version }
    sofa  = rule_facts.get("sofa",  {})
    # qSOFA: { total, high_risk, criteria, rule_version }
    qsofa = rule_facts.get("qsofa", {})
    # SIRS: { total, criteria_met (bool), criteria (dict), rule_version }
    sirs  = rule_facts.get("sirs",  {})
    # AKI: { stage, trigger, details, rule_version }
    aki   = rule_facts.get("aki",   {})
    # VWRS: { total_score, risk_level, components, recommendation } or None
    vwrs  = rule_facts.get("vwrs")
    # outliers: [{ parameter, value, is_outlier, reason, action, ... }]
    outliers = rule_facts.get("outliers", [])
    # AMR: [{ organism, ... }]
    amr   = rule_facts.get("amr",   [])

    # ── Clinical scores summary ──
    # Derive per-organ SOFA breakdown
    sofa_organ_scores = sofa.get("organ_scores", {})
    sofa_total = sofa.get("total", 0)

    clinical_scores_summary = {
        "summary": {
            "sofa_score":         sofa_total,
            "sofa_breakdown":     sofa_organ_scores,
            "qsofa_score":        qsofa.get("total", 0),
            "qsofa_criteria":     [k for k, v in (qsofa.get("criteria") or {}).items() if v],
            "sirs_score":         sirs.get("total", 0),
            "sirs_criteria":      [k for k, v in (sirs.get("criteria") or {}).items() if v],
            "aki_stage":          aki.get("stage", 0),
            "aki_detail":         aki.get("details", ""),
            "sepsis_criteria_met": sofa.get("sepsis_criteria_met", False),
        }
    }

    # ── VWRS summary ──
    vwrs_summary = vwrs if vwrs else {
        "total_score": 0, "risk_level": "N/A",
        "components": {}, "recommendation": "Not ventilated"
    }

    # ── Outlier alerts ──
    # Only flag those that are actually outliers
    real_outliers = [o for o in outliers if o.get("is_outlier", False)]
    outlier_alerts = {
        "outliers_detected": len(real_outliers) > 0,
        "alerts": [
            {
                "parameter": o.get("parameter", ""),
                "message":   o.get("reason", "Value outside physiological range"),
                "value":     o.get("value"),
                "action":    o.get("action", ""),
            }
            for o in real_outliers
        ],
    }

    # ── AMR summary ──
    amr_organisms = [
        {
            "organism":          a.get("organism", ""),
            "resistance_detail": a.get("resistance_detail", ""),
            "resistant_to":      a.get("resistant_to", []),
            "recommended":       a.get("recommended", []),
            "severity":          a.get("severity", ""),
        }
        for a in amr
    ]
    amr_summary = {
        "amr_detected": len(amr_organisms) > 0,
        "organisms":    amr_organisms,
    }

    # ── Risk flags ──
    risk_flags = []

    if sofa.get("sepsis_criteria_met"):
        risk_flags.append({
            "level": "critical",
            "label": "Sepsis Criteria Met",
            "detail": f"SOFA score: {sofa_total}/24 — Acute organ dysfunction"
        })

    if qsofa.get("high_risk"):
        criteria_list = [k.replace("_", " ") for k, v in (qsofa.get("criteria") or {}).items() if v]
        risk_flags.append({
            "level": "high",
            "label": f"qSOFA High Risk ({qsofa.get('total', 0)}/3)",
            "detail": ", ".join(criteria_list) if criteria_list else "Bedside sepsis risk elevated"
        })

    sirs_total = sirs.get("total", 0)
    if sirs_total >= 2:
        sirs_positive = [k.replace("_", " ") for k, v in (sirs.get("criteria") or {}).items() if v]
        risk_flags.append({
            "level": "warning",
            "label": f"SIRS Positive ({sirs_total}/4 criteria)",
            "detail": ", ".join(sirs_positive) if sirs_positive else "Systemic inflammatory response"
        })

    aki_stage = aki.get("stage", 0)
    if aki_stage > 0:
        risk_flags.append({
            "level": "high",
            "label": f"Acute Kidney Injury — Stage {aki_stage}",
            "detail": aki.get("details", "")
        })

    for o in real_outliers:
        risk_flags.append({
            "level": "critical",
            "label": f"Data Outlier: {o.get('parameter', '')}",
            "detail": o.get("reason", "Value outside physiological range")
        })

    for a in amr:
        risk_flags.append({
            "level": "high",
            "label": f"AMR: {a.get('organism', '')}",
            "detail": a.get("resistance_detail", "")
        })

    # ── Organ failure flags ──
    for organ in sofa.get("organ_failures", []):
        risk_flags.append({
            "level": "critical",
            "label": f"Organ Failure: {organ.replace('_', ' ').title()}",
            "detail": f"SOFA organ score ≥ 3"
        })

    # ── Disease timeline ──
    disease_timeline = {
        "vitals_trend": [{
            "time": vitals.get("recorded_at", "now"),
            "hr":   vitals.get("heart_rate"),
            "sbp":  vitals.get("systolic_bp"),
            "rr":   vitals.get("respiratory_rate"),
            "temp": vitals.get("temperature"),
            "spo2": vitals.get("spo2"),
        }] if vitals else [],
        "labs_trend": lab_history,
    }

    # ── Provenance ──
    provenance_summary = result.get("provenance_summary", {
        "rule_count":   len(risk_flags),
        "ai_count":     1 if result.get("ai_narrative") else 0,
        "rule_version": sofa.get("rule_version", ""),
    })

    # ── Final response ──
    response = {
        "metadata": {
            "patient_id":   patient_id,
            "patient_name": patient.get("name", ""),
            "bed_number":   patient.get("bed_number", ""),
            "status":       patient.get("status", ""),
        },
        "clinical_scores_summary": clinical_scores_summary,
        "vwrs_summary":            vwrs_summary,
        "outlier_alerts":          outlier_alerts,
        "amr_summary":             amr_summary,
        "risk_flags":              risk_flags,
        "disease_timeline":        disease_timeline,
        "ai_narrative":            result.get("ai_narrative", ""),
        "provenance_summary":      provenance_summary,
        "diagnosis_blocked":       result.get("diagnosis_blocked", False),
        "rule_version":            sofa.get("rule_version", ""),
        "safety_disclaimer": (
            "This system is a clinical decision support tool. "
            "All findings must be verified by a qualified physician. "
            "AI-generated narratives are constrained by deterministic rule-engine outputs "
            "and must not be used as sole diagnostic basis."
        ),
    }

    # 9. Save report to DB (best-effort — don't let DB failure break the response)
    try:
        report_data = {
            "patient_id":              patient_id,
            "report_version":          1,
            "disease_timeline":        json.loads(json.dumps(disease_timeline,        default=str)),
            "risk_flags":              json.loads(json.dumps(risk_flags,              default=str)),
            "outlier_alerts":          json.loads(json.dumps(outlier_alerts,          default=str)),
            "amr_summary":             json.loads(json.dumps(amr_summary,             default=str)),
            "vwrs_summary":            json.loads(json.dumps(vwrs_summary,            default=str)),
            "clinical_scores_summary": json.loads(json.dumps(clinical_scores_summary, default=str)),
            "ai_narrative":            result.get("ai_narrative", ""),
            "rule_version":            sofa.get("rule_version", ""),
            "diagnosis_blocked":       result.get("diagnosis_blocked", False),
            "is_current":              True,
        }
        sb.table("reports").update({"is_current": False}).eq("patient_id", patient_id).execute()
        saved = sb.table("reports").insert(report_data).execute()
        response["report_id"] = saved.data[0]["id"] if saved.data else None
    except Exception:
        response["report_id"] = None  # don't crash if DB save fails

    return response
