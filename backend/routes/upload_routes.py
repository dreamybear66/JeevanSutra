"""
Sanjeevani v2 — Upload Routes
POST /api/upload (PDF, CSV, TXT files)
Parses uploaded files → extracts labs/vitals → stores in structured tables.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.upload_models import UploadResponse
from db.supabase_client import get_supabase_client
from utils.file_parser import FileParser
from datetime import datetime, timezone

router = APIRouter()
file_parser = FileParser()

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".txt", ".text"}


@router.post("/upload", response_model=UploadResponse)
async def upload_data(
    patient_id: str = Form(...),
    data_type: str = Form("auto"),  # 'lab', 'vital', 'note', 'culture', or 'auto'
    file: UploadFile = File(None),
    raw_content: str = Form(None),
    uploader_id: str = Form(None),
):
    """
    Upload clinical data as PDF, CSV, or TXT.

    The file is parsed automatically:
    - CSV: extracts lab/vital values from columns (Parameter, Value, Unit)
    - PDF: extracts tables first, falls back to text regex
    - TXT: regex-based extraction of values

    Extracted values are stored in:
    - lab_results table (for lab parameters)
    - vital_signs table (for vital parameters)
    - raw_data table (always, for audit trail)
    """
    sb = get_supabase_client()

    # Validate patient exists
    patient = sb.table("patients").select("patient_id").eq("patient_id", patient_id).execute()
    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    file_path = None
    content = raw_content
    parsed_result = None
    filename = "input.txt"

    # ── Handle file upload ──
    if file:
        filename = file.filename or "unknown.txt"
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        file_bytes = await file.read()

        # Upload to Supabase Storage
        storage_path = f"uploads/{patient_id}/{data_type}/{filename}"
        try:
            sb.storage.from_("patient-files").upload(storage_path, file_bytes)
            file_path = storage_path
        except Exception:
            file_path = storage_path  # log path even if storage fails

        # Parse the file
        parsed_result = file_parser.parse_file(file_bytes, filename, data_type)
        content = parsed_result["raw_text"]

        # Use detected data_type if set to auto
        if data_type == "auto":
            data_type = parsed_result["data_type"]

    elif raw_content:
        # Parse raw text input
        parsed_result = file_parser.parse_file(
            raw_content.encode("utf-8"), "input.txt", data_type
        )
        if data_type == "auto":
            data_type = parsed_result["data_type"]
    else:
        raise HTTPException(status_code=400, detail="No file or content provided")

    # ── Save to raw_data (always, for audit trail) ──
    raw_insert = {
        "patient_id": patient_id,
        "data_type": data_type,
        "raw_content": content[:50000] if content else None,  # cap at 50K chars
        "file_path": file_path,
        "status": "completed",
    }
    if uploader_id:
        raw_insert["uploader_id"] = uploader_id

    raw_result = sb.table("raw_data").insert(raw_insert).execute()
    raw_data_id = raw_result.data[0]["id"] if raw_result.data else None

    # ── Store extracted labs in lab_results table ──
    labs_stored = 0
    if parsed_result and parsed_result.get("labs"):
        now = datetime.now(timezone.utc).isoformat()
        lab_rows = []
        for param_name, param_data in parsed_result["labs"].items():
            lab_rows.append({
                "patient_id": patient_id,
                "recorded_at": now,
                "parameter_name": param_name,
                "value": param_data["value"],
                "unit": param_data.get("unit", ""),
                "raw_data_id": raw_data_id,
            })
        if lab_rows:
            sb.table("lab_results").insert(lab_rows).execute()
            labs_stored = len(lab_rows)

    # ── Store extracted vitals in vital_signs table ──
    vitals_stored = 0
    if parsed_result and parsed_result.get("vitals"):
        now = datetime.now(timezone.utc).isoformat()
        vital_row = {
            "patient_id": patient_id,
            "recorded_at": now,
            "raw_data_id": raw_data_id,
        }
        for vital_name, vital_value in parsed_result["vitals"].items():
            vital_row[vital_name] = vital_value

        sb.table("vital_signs").insert(vital_row).execute()
        vitals_stored = len(parsed_result["vitals"])

    # ── Save parsed structured data ──
    if parsed_result and (parsed_result.get("labs") or parsed_result.get("vitals")):
        sb.table("parsed_data").insert({
            "patient_id": patient_id,
            "raw_data_id": raw_data_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data_type": data_type,
            "structured_json": {
                "labs": parsed_result.get("labs", {}),
                "vitals": parsed_result.get("vitals", {}),
                "parse_method": parsed_result.get("parse_method"),
                "rows_parsed": parsed_result.get("rows_parsed"),
            },
        }).execute()

    # ── Build response ──
    message_parts = [f"{data_type} data uploaded"]
    if labs_stored:
        message_parts.append(f"{labs_stored} lab values extracted")
    if vitals_stored:
        message_parts.append(f"{vitals_stored} vital signs extracted")
    message_parts.append(f"from {filename}")

    return UploadResponse(
        success=True,
        raw_data_id=raw_data_id,
        message=" · ".join(message_parts),
        data_type=data_type,
    )
