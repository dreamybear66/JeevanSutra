"""
Sanjeevani v2 — Pydantic Models: Upload
"""
from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    success: bool
    raw_data_id: Optional[str] = None
    message: str = ""
    data_type: Optional[str] = None
