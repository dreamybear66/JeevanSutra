"""
Sanjeevani v2 — Analysis Routes
POST /api/analyze/{patient_id} — triggers full diagnostic pipeline
"""

import json
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
    patient = sb.table("patients").select("*").eq("patient_id", patient_id).execute()
    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = patient.data[0]

    # 2. Fetch latest vitals
    vitals_result = sb.table("vital_signs").select("*").eq(
        "patient_id", patient_id
    ).order("recorded_at", desc=True).limit(1).execute()
    vitals = vitals_result.data[0] if vitals_result.data else {}

    # 3. Fetch latest labs
    labs_result = sb.table("lab_results").select("*").eq(
        "patient_id", patient_id
    ).order("recorded_at", desc=True).execute()

    labs = {}
    lab_history = {}
    for lab in labs_result.data:
        param = lab["parameter_name"]
        if param not in labs:
            labs[param] = lab["value"]
        if param not in lab_history:
            lab_history[param] = []
        lab_history[param].append({"value": lab["value"], "recorded_at": lab["recorded_at"]})

    # 4. Fetch creatinine history for AKI
    creatinine_history = lab_history.get("creatinine", [])

    # 5. Fetch clinical notes
    notes_result = sb.table("raw_data").select("*").eq(
        "patient_id", patient_id
    ).in_("data_type", ["note", "culture"]).order("uploaded_at", desc=True).limit(10).execute()

    clinical_notes = [
        {"text": n.get("raw_content", ""), "source": f"{n['data_type']} from {n['uploaded_at']}"}
        for n in notes_result.data
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

    # 7. Run pipeline
    result = orchestrator.run_pipeline(patient_data)

    # 8. Apply provenance badges
    result = tag_report(result)

    # 9. Save report to DB
    report_data = {
        "patient_id": patient_id,
        "report_version": 1,
        "disease_timeline": None,
        "risk_flags": json.loads(json.dumps(result.get("rule_facts", {}).get("sofa", {}), default=str)),
        "outlier_alerts": json.loads(json.dumps(result.get("rule_facts", {}).get("outliers", []), default=str)),
        "amr_summary": json.loads(json.dumps(result.get("rule_facts", {}).get("amr", []), default=str)),
        "vwrs_summary": json.loads(json.dumps(result.get("rule_facts", {}).get("vwrs"), default=str)),
        "clinical_scores_summary": json.loads(json.dumps({
            "sofa": result.get("rule_facts", {}).get("sofa", {}),
            "qsofa": result.get("rule_facts", {}).get("qsofa", {}),
            "sirs": result.get("rule_facts", {}).get("sirs", {}),
            "aki": result.get("rule_facts", {}).get("aki", {}),
        }, default=str)),
        "ai_narrative": result.get("ai_narrative", ""),
        "rule_version": result.get("rule_version", ""),
        "diagnosis_blocked": result.get("diagnosis_blocked", False),
        "is_current": True,
    }

    # Mark old reports as not current
    sb.table("reports").update({"is_current": False}).eq("patient_id", patient_id).execute()
    saved = sb.table("reports").insert(report_data).execute()

    result["report_id"] = saved.data[0]["id"] if saved.data else None
    return result
