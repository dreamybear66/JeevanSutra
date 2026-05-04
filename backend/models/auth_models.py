"""
Sanjeevani v2 — Pydantic Models: Auth
"""
from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    identifier: str
    role: str
    pin: str

class LoginResponse(BaseModel):
    success: bool
    display_name: Optional[str] = None
    must_rotate: bool = False
    message: str = ""

class RotatePinRequest(BaseModel):
    identifier: str
    role: str
    old_pin: str
    new_pin: str
