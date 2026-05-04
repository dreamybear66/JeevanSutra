"""
Sanjeevani v2 — Pydantic Models: Patient
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PatientCreate(BaseModel):
    name: str
    subject_id: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    bed_number: Optional[str] = None
    nfc_tag_id: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    bed_number: Optional[str] = None
    is_ventilated: Optional[bool] = None
    nfc_tag_id: Optional[str] = None

class PatientResponse(BaseModel):
    patient_id: str
    name: str
    subject_id: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    status: str = "admitted"
    bed_number: Optional[str] = None
    is_ventilated: bool = False
    admission_timestamp: Optional[str] = None
    nfc_tag_id: Optional[str] = None
