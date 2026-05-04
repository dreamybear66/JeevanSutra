"""
Sanjeevani v2 — Pydantic Models: Patient
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: Optional[str] = None
    phone: str
    address: Optional[str] = None
    admission_datetime: datetime
    admitting_doctor: str
    ward: str
    bed_number: str
    admission_type: str
    admission_source: Optional[str] = None
    primary_diagnosis: str
    reason_for_admission: str
    priority_level: str
    medical_history: Optional[list] = None
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
