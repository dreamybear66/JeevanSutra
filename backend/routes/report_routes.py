"""
Sanjeevani v2 — Report Routes
GET /api/reports/{patient_id}
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from db.supabase_client import get_supabase_client
from utils.pdf_export import generate_report_pdf

router = APIRouter()


@router.get("/reports/{patient_id}")
async def get_reports(patient_id: str, current_only: bool = True):
    sb = get_supabase_client()
    query = sb.table("reports").select("*").eq("patient_id", patient_id)
    if current_only:
        query = query.eq("is_current", True)
    result = query.order("generated_at", desc=True).execute()
    return result.data


@router.get("/reports/detail/{report_id}")
async def get_report_detail(report_id: str):
    sb = get_supabase_client()
    result = sb.table("reports").select("*").eq("id", report_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return result.data[0]


@router.get("/reports/{report_id}/pdf")
async def export_report_pdf(report_id: str):
    sb = get_supabase_client()

    # Fetch report
    report_result = sb.table("reports").select("*").eq("id", report_id).execute()
    if not report_result.data:
        raise HTTPException(status_code=404, detail="Report not found")
    report = report_result.data[0]

    # Fetch patient
    patient_result = sb.table("patients").select("*").eq("patient_id", report["patient_id"]).execute()
    patient = patient_result.data[0] if patient_result.data else {}

    # Build report dict for PDF generator
    pdf_input = {
        "rule_facts": {
            "sofa": report.get("clinical_scores_summary", {}).get("sofa", {}),
            "qsofa": report.get("clinical_scores_summary", {}).get("qsofa", {}),
            "sirs": report.get("clinical_scores_summary", {}).get("sirs", {}),
            "aki": report.get("clinical_scores_summary", {}).get("aki", {}),
            "vwrs": report.get("vwrs_summary"),
            "amr": report.get("amr_summary", []),
            "outliers": report.get("outlier_alerts", []),
        },
        "ai_narrative": report.get("ai_narrative", ""),
        "diagnosis_blocked": report.get("diagnosis_blocked", False),
        "rule_version": report.get("rule_version", ""),
    }

    pdf_bytes = generate_report_pdf(pdf_input, patient)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sanjeevani_report_{report_id[:8]}.pdf"},
    )
