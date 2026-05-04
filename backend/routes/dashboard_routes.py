"""
Sanjeevani v2 — Dashboard Routes
GET /api/dashboard/{patient_id} — live scores, alerts, VWRS
"""

from fastapi import APIRouter, HTTPException
from db.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/dashboard/{patient_id}")
async def get_dashboard(patient_id: str):
    sb = get_supabase_client()

    # Verify patient
    patient = sb.table("patients").select("*").eq("patient_id", patient_id).execute()
    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Latest report
    report = sb.table("reports").select("*").eq(
        "patient_id", patient_id
    ).eq("is_current", True).order("generated_at", desc=True).limit(1).execute()

    # Active outlier flags
    outliers = sb.table("outlier_flags").select("*").eq(
        "patient_id", patient_id
    ).eq("is_resolved", False).order("flagged_at", desc=True).execute()

    # Active AMR alerts
    amr = sb.table("amr_alerts").select("*").eq(
        "patient_id", patient_id
    ).eq("is_active", True).order("detected_at", desc=True).execute()

    # Latest VWRS
    vwrs = sb.table("vwrs_assessments").select("*").eq(
        "patient_id", patient_id
    ).order("assessed_at", desc=True).limit(1).execute()

    # Latest scores
    scores = sb.table("clinical_scores").select("*").eq(
        "patient_id", patient_id
    ).order("assessed_at", desc=True).limit(1).execute()

    return {
        "patient": patient.data[0],
        "current_report": report.data[0] if report.data else None,
        "active_outliers": outliers.data,
        "active_amr_alerts": amr.data,
        "latest_vwrs": vwrs.data[0] if vwrs.data else None,
        "latest_scores": scores.data[0] if scores.data else None,
    }

@router.get("/security-audit")
async def get_security_audit(limit: int = 100):
    sb = get_supabase_client()
    result = sb.table("security_audit_logs").select("*").order("occurred_at", desc=True).limit(limit).execute()
    return {"events": result.data}
