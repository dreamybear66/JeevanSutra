"""
Sanjeevani v2 — File Parser
Extracts clinical data from PDF, CSV, and TXT files.
PDF pipeline: pdfplumber (digital) → PyMuPDF + Tesseract OCR (scanned) → regex extraction.
"""

import csv
import io
import re
from pathlib import Path

# PDF parsing — pdfplumber for digital PDFs
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

# PDF to image — PyMuPDF for scanned PDFs
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

# OCR — Tesseract for image-to-text
try:
    from PIL import Image
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


class FileParser:
    """Parses uploaded clinical files (PDF, CSV, TXT) into structured data."""

    # Known lab parameter aliases → standard names
    LAB_ALIASES = {
        "k+": "potassium", "potassium": "potassium", "k": "potassium",
        "na+": "sodium", "sodium": "sodium", "na": "sodium",
        "cr": "creatinine", "creat": "creatinine", "creatinine": "creatinine",
        "bil": "bilirubin", "bilirubin": "bilirubin", "total bilirubin": "bilirubin",
        "plt": "platelets", "platelets": "platelets", "platelet count": "platelets",
        "wbc": "wbc", "white blood cell": "wbc", "leucocyte": "wbc",
        "hb": "hemoglobin", "hgb": "hemoglobin", "hemoglobin": "hemoglobin",
        "glu": "glucose", "glucose": "glucose", "blood sugar": "glucose", "rbs": "glucose",
        "lac": "lactate", "lactate": "lactate",
        "ph": "pH", "blood ph": "pH",
        "paco2": "paco2", "pco2": "paco2",
        "pao2": "pao2", "po2": "pao2",
    }

    VITAL_ALIASES = {
        "hr": "heart_rate", "heart rate": "heart_rate", "pulse": "heart_rate",
        "sbp": "systolic_bp", "systolic": "systolic_bp", "sys bp": "systolic_bp",
        "dbp": "diastolic_bp", "diastolic": "diastolic_bp", "dia bp": "diastolic_bp",
        "map": "mean_arterial_pressure", "mean arterial": "mean_arterial_pressure",
        "rr": "respiratory_rate", "resp rate": "respiratory_rate", "respiratory rate": "respiratory_rate",
        "temp": "temperature", "temperature": "temperature", "body temp": "temperature",
        "spo2": "spo2", "oxygen saturation": "spo2", "o2 sat": "spo2",
        "fio2": "fio2",
        "gcs": "gcs_total", "glasgow": "gcs_total",
        "peep": "peep",
        "tv": "tidal_volume", "tidal volume": "tidal_volume", "vt": "tidal_volume",
    }

    def parse_file(self, file_bytes: bytes, filename: str, data_type: str = "auto") -> dict:
        """
        Parse a file and extract structured clinical data.

        Args:
            file_bytes: Raw file bytes
            filename: Original filename (used to detect format)
            data_type: 'lab', 'vital', 'note', 'culture', or 'auto'

        Returns:
            {
                "raw_text": "extracted text",
                "data_type": "lab|vital|note|culture",
                "labs": {"potassium": {"value": 4.2, "unit": "mmol/L"}, ...},
                "vitals": {"heart_rate": 95, ...},
                "parse_method": "csv|pdf_table|pdf_ocr|txt",
                "rows_parsed": 5
            }
        """
        ext = Path(filename).suffix.lower()

        if ext == ".csv":
            return self._parse_csv(file_bytes, data_type)
        elif ext == ".pdf":
            return self._parse_pdf(file_bytes, data_type)
        elif ext in (".txt", ".text"):
            return self._parse_txt(file_bytes, data_type)
        else:
            return self._parse_txt(file_bytes, data_type)

    # ── CSV Parser ──────────────────────────────────────────

    def _parse_csv(self, file_bytes: bytes, data_type: str) -> dict:
        """Parse CSV file — expects columns like: Parameter, Value, Unit"""
        text = file_bytes.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))

        labs = {}
        vitals = {}
        rows = 0

        for row in reader:
            rows += 1
            row_lower = {k.lower().strip(): v.strip() for k, v in row.items() if v}

            param_name = (
                row_lower.get("parameter") or row_lower.get("test") or
                row_lower.get("test name") or row_lower.get("name") or
                row_lower.get("param") or row_lower.get("analyte") or ""
            ).lower().strip()

            value_str = (
                row_lower.get("value") or row_lower.get("result") or
                row_lower.get("reading") or ""
            ).strip()

            unit = (row_lower.get("unit") or row_lower.get("units") or "").strip()

            if not param_name or not value_str:
                continue

            try:
                value = float(re.sub(r'[^\d.\-]', '', value_str))
            except (ValueError, TypeError):
                continue

            std_name = self.LAB_ALIASES.get(param_name)
            if std_name:
                labs[std_name] = {"value": value, "unit": unit}
                continue

            std_vital = self.VITAL_ALIASES.get(param_name)
            if std_vital:
                vitals[std_vital] = value

        detected_type = data_type if data_type != "auto" else ("lab" if labs else "vital" if vitals else "note")
        return {
            "raw_text": text, "data_type": detected_type,
            "labs": labs, "vitals": vitals,
            "parse_method": "csv", "rows_parsed": rows,
        }

    # ── PDF Parser (3-stage: pdfplumber → PyMuPDF+OCR → regex) ──

    def _parse_pdf(self, file_bytes: bytes, data_type: str) -> dict:
        """
        Parse PDF using 3-stage pipeline:
        1. Try pdfplumber (digital PDF with tables)
        2. If empty → PyMuPDF converts pages to images → Tesseract OCR
        3. Regex extraction on the resulting text
        """
        labs = {}
        vitals = {}
        all_text = []
        rows = 0
        method = "pdf_unavailable"

        # ── Stage 1: pdfplumber (digital PDFs) ──
        if HAS_PDFPLUMBER:
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        all_text.append(page_text)

                        tables = page.extract_tables()
                        for table in tables:
                            if not table or len(table) < 2:
                                continue
                            headers = [str(h).lower().strip() if h else "" for h in table[0]]
                            for row in table[1:]:
                                if not row:
                                    continue
                                rows += 1
                                row_dict = {}
                                for i, cell in enumerate(row):
                                    if i < len(headers) and cell:
                                        row_dict[headers[i]] = str(cell).strip()
                                self._extract_from_row(row_dict, labs, vitals)

                if rows > 0:
                    method = "pdf_table"
            except Exception:
                pass

        # ── Stage 2: PyMuPDF + Tesseract OCR (scanned PDFs) ──
        full_text = "\n".join(all_text)

        if not labs and not vitals and len(full_text.strip()) < 50:
            ocr_text = self._ocr_pdf(file_bytes)
            if ocr_text:
                full_text = ocr_text
                all_text = [ocr_text]
                method = "pdf_ocr"

        # ── Stage 3: Regex extraction from text ──
        if not labs and not vitals:
            labs, vitals = self._extract_from_text(full_text)
            if method == "pdf_unavailable":
                method = "pdf_text"

        detected_type = data_type if data_type != "auto" else ("lab" if labs else "vital" if vitals else "note")
        return {
            "raw_text": full_text, "data_type": detected_type,
            "labs": labs, "vitals": vitals,
            "parse_method": method, "rows_parsed": rows if rows > 0 else len(labs) + len(vitals),
        }

    def _ocr_pdf(self, file_bytes: bytes) -> str:
        """
        Convert PDF pages to images using PyMuPDF, then OCR with Tesseract.
        Returns extracted text from all pages.
        """
        if not HAS_PYMUPDF or not HAS_TESSERACT:
            return ""

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            all_text = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)

                # Render page as high-DPI image (300 DPI for OCR quality)
                mat = fitz.Matrix(300 / 72, 300 / 72)
                pix = page.get_pixmap(matrix=mat)

                # Convert to PIL Image
                img_bytes = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_bytes))

                # Run Tesseract OCR
                page_text = pytesseract.image_to_string(img, lang="eng")
                all_text.append(page_text)

            doc.close()
            return "\n".join(all_text)

        except Exception:
            return ""

    # ── TXT Parser ──────────────────────────────────────────

    def _parse_txt(self, file_bytes: bytes, data_type: str) -> dict:
        """Parse TXT — regex extraction of lab values and vitals."""
        text = file_bytes.decode("utf-8", errors="replace")
        labs, vitals = self._extract_from_text(text)

        detected_type = data_type if data_type != "auto" else ("lab" if labs else "vital" if vitals else "note")
        return {
            "raw_text": text, "data_type": detected_type,
            "labs": labs, "vitals": vitals,
            "parse_method": "txt", "rows_parsed": len(labs) + len(vitals),
        }

    # ── Shared Extraction Helpers ───────────────────────────

    def _extract_from_row(self, row_dict: dict, labs: dict, vitals: dict):
        """Extract lab/vital values from a table row dict."""
        param = ""
        value_str = ""
        unit = ""

        for key, val in row_dict.items():
            key_l = key.lower()
            if any(k in key_l for k in ["parameter", "test", "name", "analyte", "param"]):
                param = val.lower().strip()
            elif any(k in key_l for k in ["value", "result", "reading"]):
                value_str = val
            elif any(k in key_l for k in ["unit"]):
                unit = val

        if not param or not value_str:
            return

        try:
            value = float(re.sub(r'[^\d.\-]', '', value_str))
        except (ValueError, TypeError):
            return

        std_lab = self.LAB_ALIASES.get(param)
        if std_lab:
            labs[std_lab] = {"value": value, "unit": unit}
            return

        std_vital = self.VITAL_ALIASES.get(param)
        if std_vital:
            vitals[std_vital] = value

    def _extract_from_text(self, text: str) -> tuple[dict, dict]:
        """
        Regex-based extraction of lab values and vitals from free text.
        Handles patterns like: Potassium: 4.2 mmol/L, K+ = 4.2, HR 95 bpm
        """
        labs = {}
        vitals = {}

        all_aliases = {**self.LAB_ALIASES, **self.VITAL_ALIASES}

        for alias, std_name in all_aliases.items():
            pattern = rf'\b{re.escape(alias)}\s*[:\-=\s]+\s*(\d+\.?\d*)\s*([a-zA-Z/%°]*)'
            matches = re.findall(pattern, text, re.IGNORECASE)

            if matches:
                value_str, unit = matches[0]
                try:
                    value = float(value_str)
                except ValueError:
                    continue

                if std_name in self.LAB_ALIASES.values():
                    if std_name not in labs:
                        labs[std_name] = {"value": value, "unit": unit}
                elif std_name in self.VITAL_ALIASES.values():
                    if std_name not in vitals:
                        vitals[std_name] = value

        return labs, vitals
