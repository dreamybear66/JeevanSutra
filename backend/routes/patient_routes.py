"""
Sanjeevani v2 — Patient Routes
CRUD for /api/patients
"""

from fastapi import APIRouter, HTTPException
from models.patient_models import PatientCreate, PatientUpdate, PatientResponse
from db.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/patients")
async def list_patients(status: str = None):
    sb = get_supabase_client()
    query = sb.table("patients").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    sb = get_supabase_client()
    result = sb.table("patients").select("*").eq("patient_id", patient_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return result.data[0]


@router.post("/patients")
async def create_patient(patient: PatientCreate):
    sb = get_supabase_client()
    result = sb.table("patients").insert(patient.model_dump(exclude_none=True)).execute()
    return result.data[0]


@router.patch("/patients/{patient_id}")
async def update_patient(patient_id: str, update: PatientUpdate):
    sb = get_supabase_client()
    data = update.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = sb.table("patients").update(data).eq("patient_id", patient_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return result.data[0]
