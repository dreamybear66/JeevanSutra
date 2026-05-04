"""
Sanjeevani v2 — NFC Routes
GET /api/nfc/{tag_id} — NFC tap → patient lookup
"""

from fastapi import APIRouter, HTTPException
from db.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/nfc/{tag_id}")
async def lookup_by_nfc(tag_id: str):
    sb = get_supabase_client()
    result = sb.table("patients").select("*").eq("nfc_tag_id", tag_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No patient linked to this NFC tag")
    return result.data[0]
