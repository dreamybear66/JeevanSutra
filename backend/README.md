# Sanjeevani v2 — Backend

**Hybrid Rule-Engine + AI Narrative ICU Diagnostic Risk Assistant**

> *"Every safety-critical decision is deterministic. AI only writes the explanation."*

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **API Framework** | FastAPI (Python) | REST API with auto-docs |
| **Database** | Supabase (PostgreSQL) | Patient data, scores, reports |
| **LLM** | Google Gemini 2.0 Flash | Narrative generation only |
| **Vector DB** | ChromaDB | Clinical guideline RAG |
| **PDF Export** | FPDF2 | Diagnostic report PDFs |
| **Config** | YAML | All medical thresholds |

---

## Architecture

```
                         ┌──────────────────┐
                         │   Frontend App   │
                         └────────┬─────────┘
                                  │ HTTP
                         ┌────────▼─────────┐
                         │   FastAPI (API)   │
                         │     main.py       │
                         └────────┬─────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
    ┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
    │  Auth Routes  │    │ Upload Routes │    │Analysis Routes│
    │  /api/login   │    │ /api/upload   │    │/api/analyze   │
    └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
            │                    │                     │
            ▼                    ▼                     ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
    │  Supabase DB │    │  Supabase    │    │   Orchestrator   │
    │  pin_access  │    │  raw_data    │    │  (4-Phase Engine)│
    └──────────────┘    │  + Storage   │    └────────┬─────────┘
                        └──────────────┘             │
                                            ┌────────┴────────┐
                                            │                 │
                                    ┌───────▼──────┐  ┌──────▼───────┐
                                    │ Rule Engines │  │  LLM Agents  │
                                    │ (Local, No   │  │  (Gemini API)│
                                    │  LLM, Pure   │  │  De-identified│
                                    │  Python)     │  │  data only   │
                                    └───────┬──────┘  └──────┬───────┘
                                            │                │
                                    ┌───────▼────────────────▼───────┐
                                    │        Chief Agent             │
                                    │  Rule facts + AI narrative     │
                                    │  Post-validated & merged       │
                                    └───────────────┬────────────────┘
                                                    │
                                            ┌───────▼───────┐
                                            │   Supabase    │
                                            │   reports     │
                                            └───────────────┘
```

---

## Project Structure

```
backend/
│
├── main.py                          → FastAPI app entry point, CORS, route registration
├── settings.py                      → Pydantic settings (reads .env)
├── requirements.txt                 → Python dependencies
├── .env                             → Secrets (Supabase keys, Gemini API key)
│
├── config/                          → Clinical Configuration (YAML)
│   ├── clinical_rules.yaml          → SOFA, qSOFA, SIRS, AKI, outlier, VWRS thresholds
│   ├── amr_rules.yaml               → AMR organism keywords + resistance patterns
│   └── config_loader.py             → YAML loader with LRU cache + hot-reload
│
├── db/                              → Database & External Service Clients
│   ├── supabase_client.py           → Shared Supabase client singleton
│   └── gemini_client.py             → Gemini LLM wrapper (call_llm function)
│
├── engines/                         → Deterministic Rule Engines (NO LLM)
│   ├── outlier_detector.py          → Z-score + physiological bounds checking
│   ├── clinical_scoring.py          → SOFA / qSOFA / SIRS / AKI scoring
│   └── vwrs.py                      → Ventilator Weaning Readiness Score
│
├── agents/                          → AI Agents (LLM-powered + hybrid)
│   ├── note_parser.py               → Gemini: extract symptoms from clinical notes
│   ├── lab_mapper.py                → Gemini: parse raw lab text → structured values
│   ├── rag_agent.py                 → ChromaDB: query clinical guidelines
│   ├── amr_agent.py                 → Hybrid: keyword rules + RAG enhancement
│   ├── chief_agent.py               → Gemini: narrative writer (cannot override rules)
│   └── orchestrator.py              → Pipeline controller (Phase 1→2→3→4)
│
├── vector_db/                       → Vector Database (ChromaDB)
│   ├── chroma_client.py             → ChromaDB persistent client
│   └── load_guidelines.py           → Load WHO/ICMR/clinical guidelines (run once)
│
├── routes/                          → API Endpoints
│   ├── auth_routes.py               → POST /api/login, /api/rotate-pin
│   ├── patient_routes.py            → GET/POST/PATCH /api/patients
│   ├── upload_routes.py             → POST /api/upload (files + text)
│   ├── analysis_routes.py           → POST /api/analyze/{patient_id}
│   ├── report_routes.py             → GET /api/reports, GET .../pdf
│   ├── dashboard_routes.py          → GET /api/dashboard/{patient_id}
│   └── nfc_routes.py                → GET /api/nfc/{tag_id}
│
├── models/                          → Pydantic Request/Response Schemas
│   ├── auth_models.py               → LoginRequest, LoginResponse, RotatePinRequest
│   ├── patient_models.py            → PatientCreate, PatientUpdate, PatientResponse
│   ├── upload_models.py             → UploadResponse
│   └── report_models.py             → ReportResponse
│
└── utils/                           → Shared Utilities
    ├── security.py                  → PIN hashing (SHA256), lockout management
    ├── validators.py                → Post-validation: LLM vs rule engine check
    ├── provenance.py                → [RULE] / [AI] badge tagging
    ├── deidentify.py                → PII stripping before LLM calls
    └── pdf_export.py                → Report → PDF with provenance badges
```

---

## The 4-Phase Diagnostic Pipeline

When `POST /api/analyze/{patient_id}` is called, the orchestrator runs:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  PHASE 1: Data Gathering                                           │
│  ─────────────────────                                              │
│  Fetch from Supabase:                                              │
│  • vital_signs (latest)    → heart_rate, MAP, GCS, PEEP, etc.     │
│  • lab_results (+ 72h history) → potassium, creatinine, etc.      │
│  • raw_data (notes + cultures) → clinical text                     │
│  • patients (ventilation status)                                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 2: Rule Engines (Parallel, Local, No LLM)                   │
│  ────────────────────────────────────────────                       │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐     │
│  │Outlier Detector  │  │Clinical Scoring  │  │ VWRS Engine   │     │
│  │                  │  │                  │  │               │     │
│  │• Physio bounds   │  │• SOFA (6 organs) │  │• RSBI check   │     │
│  │• Z-score check   │  │• qSOFA (3 checks)│  │• SpO2/FiO2    │     │
│  │• Consensus check │  │• SIRS (4 criteria)│  │• PEEP check   │     │
│  │                  │  │• AKI (KDIGO)     │  │• GCS check    │     │
│  │Output:           │  │                  │  │• MAP check    │     │
│  │OutlierResult[]   │  │Output:           │  │               │     │
│  │                  │  │SOFAResult        │  │Output:        │     │
│  └─────────────────┘  │qSOFAResult       │  │VWRSResult     │     │
│                        │SIRSResult        │  └───────────────┘     │
│  ┌─────────────────┐  │AKIResult         │                         │
│  │AMR Agent        │  └──────────────────┘                         │
│  │(keyword stage)  │                                                │
│  │                  │                                                │
│  │• Regex scan for  │                                                │
│  │  MRSA, ESBL, CRE│                                                │
│  │  VRE, PRSP, MDR │                                                │
│  │                  │                                                │
│  │Output:           │                                                │
│  │AMRAlert[]        │                                                │
│  └─────────────────┘                                                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 3: LLM Agents (Parallel, Gemini API)                        │
│  ──────────────────────────────────────────                         │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐                         │
│  │Note Parser      │  │RAG Agent         │                         │
│  │                  │  │                  │                         │
│  │• De-identify PII │  │• Query ChromaDB  │                         │
│  │• Send to Gemini  │  │• Sepsis guidelines│                        │
│  │• Extract symptoms│  │• AMR guidelines  │                         │
│  │                  │  │                  │                         │
│  │Output:           │  │Output:           │                         │
│  │{symptoms, meds}  │  │Guideline text    │                         │
│  └─────────────────┘  └──────────────────┘                         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 4: Chief Synthesis                                           │
│  ────────────────────────                                           │
│                                                                     │
│  1. Bundle all rule engine results → rule_facts (IMMUTABLE)        │
│  2. Sanitize: strip raw values, keep only scores + descriptions    │
│  3. Send sanitized facts + symptoms + guidelines → Gemini          │
│  4. Gemini writes clinical narrative                                │
│  5. Post-validate: check LLM didn't contradict rule engine         │
│  6. If outliers exist → diagnosis_blocked = true (HARD OVERRIDE)   │
│  7. Tag all findings with [RULE] or [AI] provenance badges         │
│  8. Save report to Supabase                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Privacy Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LOCAL SERVER                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Raw Labs │  │ Vitals   │  │ Patient  │             │
│  │ K+=14.0  │  │ MAP=60   │  │ Rajesh K │             │
│  │ Cr=2.5   │  │ HR=95    │  │ Bed ICU-4│             │
│  └────┬─────┘  └────┬─────┘  └──────────┘             │
│       │              │                                  │
│       ▼              ▼                                  │
│  ┌─────────────────────────┐                           │
│  │    Rule Engines         │  ← 100% LOCAL             │
│  │    (Pure Python)        │  ← No external calls      │
│  │                         │                            │
│  │  SOFA=13, AKI Stage 2  │                            │
│  │  VWRS=NOT_READY         │                            │
│  └────────────┬────────────┘                           │
│               │                                         │
│       ┌───────▼────────┐                               │
│       │   Sanitizer    │                                │
│       │                │                                │
│       │ IN:  Cr=2.5    │                                │
│       │ OUT: "renal:   │                                │
│       │  score 2/4 —   │                                │
│       │  moderate      │                                │
│       │  dysfunction"  │                                │
│       └───────┬────────┘                                │
│               │                                         │
└───────────────┼─────────────────────────────────────────┘
                │  Only scores + descriptions
                │  (no raw values, no PII)
                ▼
┌───────────────────────────┐
│   Google Gemini API       │
│                           │
│   Receives:               │
│   • "SOFA 13/24 Critical" │
│   • "cardiovascular:      │
│     organ failure"        │
│   • "AKI Stage 2"         │
│   • "fever, cough"        │
│     (de-identified)       │
│                           │
│   Never receives:         │
│   ✗ Patient names         │
│   ✗ Raw lab values        │
│   ✗ Raw vital signs       │
│   ✗ Aadhaar, phone, email │
│   ✗ Patient IDs           │
│                           │
│   Returns:                │
│   Clinical narrative text │
└───────────────────────────┘
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | PIN-based login with lockout |
| POST | `/api/rotate-pin` | Change PIN (forced on first login) |

### Patients
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/patients` | List all patients (filter by status) |
| GET | `/api/patients/{id}` | Get single patient |
| POST | `/api/patients` | Create new patient |
| PATCH | `/api/patients/{id}` | Update patient fields |

### Data Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload clinical note, lab, vital, or culture |

### Analysis
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze/{patient_id}` | Run full 4-phase diagnostic pipeline |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/{patient_id}` | Get patient reports |
| GET | `/api/reports/detail/{report_id}` | Get single report |
| GET | `/api/reports/{report_id}/pdf` | Download report as PDF |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/{patient_id}` | Live scores, alerts, VWRS status |

### NFC
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/nfc/{tag_id}` | Patient lookup by NFC tag |

---

## Database Schema (17 Tables)

```
┌─────────────────────────────────────────────────────────────────┐
│  Schema 1: Auth              Schema 2: Core Clinical           │
│  ├── pin_access              ├── clinicians                    │
│  └── security_audit_logs     ├── patients                      │
│                               ├── raw_data                     │
│                               ├── parsed_data                  │
│                               └── audit_logs                   │
│                                                                 │
│  Schema 3: Structured Data   Schema 4: Rule Engine Results     │
│  ├── vital_signs             ├── rule_engine_runs              │
│  ├── lab_results             ├── clinical_scores               │
│  ├── culture_reports         ├── vwrs_assessments              │
│  └── medications             ├── amr_alerts                    │
│                               ├── outlier_flags                │
│                               └── reports                      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Through Tables

```
Upload → raw_data → parsed_data
                  → vital_signs ──┐
                  → lab_results ──┤
                  → culture_reports──┤
                                     ├──→ rule_engine_runs ──→ clinical_scores
                                     │                    ──→ vwrs_assessments
                                     │                    ──→ amr_alerts
                                     │                    ──→ outlier_flags
                                     │                                │
                                     └────────────────────────────────┤
                                                                      ▼
                                                                   reports
```

---

## Rule Engines Detail

### 1. Outlier Detector (`engines/outlier_detector.py`)

Detects anomalous lab values using 3 checks:

| Check | Method | Example |
|---|---|---|
| Physiological bounds | Is the value humanly possible? | K+=14 → impossible (range 1.5–10.0) |
| Z-score | Statistical deviation from 72h history | New value 3σ from mean → flagged |
| Consensus | Consistent history + sudden spike | 3 days of K+=4.0, then K+=14 → flag |

**Config source:** `clinical_rules.yaml` → `outlier.physiological_bounds`

### 2. Clinical Scoring (`engines/clinical_scoring.py`)

| Score | Components | Range | Threshold |
|---|---|---|---|
| **SOFA** | 6 organs (respiratory, coagulation, liver, cardiovascular, CNS, renal) | 0–24 | ≥2 increase = sepsis |
| **qSOFA** | Respiratory rate, systolic BP, GCS | 0–3 | ≥2 = high risk |
| **SIRS** | Temperature, heart rate, respiratory, WBC | 0–4 | ≥2 = inflammatory response |
| **AKI** | Creatinine rise (KDIGO criteria) | Stage 0–3 | 0.3 mg/dL rise in 48h or 1.5x baseline |

**Config source:** `clinical_rules.yaml` → `sofa`, `qsofa`, `sirs`, `aki`

### 3. VWRS (`engines/vwrs.py`)

5-parameter ventilator weaning readiness check:

| Parameter | Ready | Borderline | Not Ready |
|---|---|---|---|
| RSBI (RR÷TV) | < 105 | 105–120 | > 120 |
| SpO₂/FiO₂ | > 150 | 130–150 | < 130 |
| PEEP | ≤ 8 | 8–10 | > 10 |
| GCS | ≥ 8 | 6–7 | < 6 |
| MAP (no vasopressors) | > 65 | 60–65 | < 60 or on vasopressors |

**Scoring:** All 5 READY → ✅ READY | Any NOT_READY → ❌ NOT_READY | Otherwise → ⚠️ BORDERLINE

**Config source:** `clinical_rules.yaml` → `vwrs`

### 4. AMR Agent (`agents/amr_agent.py`)

Two-stage antimicrobial resistance detection:

```
Stage 1 (Rule-based):  Scan clinical text for keywords from amr_rules.yaml
                        Match "MRSA" → resistant_to: [methicillin, oxacillin]
                                     → recommended: [vancomycin, linezolid]

Stage 2 (RAG):         Query ChromaDB for treatment guidelines
                        "MRSA antibiotic treatment ICU guidelines"
                        → Returns IDSA/ICMR guideline citations
```

**Config source:** `amr_rules.yaml` → `organisms`

---

## Provenance System

Every finding is tagged with its source:

| Badge | Color | Meaning | Example |
|---|---|---|---|
| `[RULE]` | 🔵 Blue | Computed by deterministic rule engine | SOFA=13, VWRS=NOT_READY |
| `[AI]` | 🟣 Purple | Generated by AI (Gemini), validated | Clinical narrative text |

**Post-validation:** If the LLM contradicts a rule engine result (e.g., says "SOFA=8" when engine computed 13), the contradiction is logged and the rule engine value wins.

---

## Setup Instructions

### 1. Prerequisites
- Python 3.11+
- Supabase account ([supabase.com](https://supabase.com))
- Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### 2. Database Setup
Run these SQL files **in order** in Supabase SQL Editor:
```
schema_1_auth_security.sql       → pin_access, security_audit_logs
schema_2_core_clinical.sql       → clinicians, patients, raw_data, parsed_data, audit_logs
schema_3_structured_data.sql     → vital_signs, lab_results, culture_reports, medications
schema_4_rule_engines_reports.sql → rule_engine_runs, clinical_scores, vwrs_assessments, amr_alerts, outlier_flags, reports
```

### 3. Backend Setup
```bash
cd backend

# Create .env from template
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

# Install dependencies
pip install -r requirements.txt

# Load clinical guidelines into ChromaDB (one-time)
python -m vector_db.load_guidelines

# Start server
python main.py
```

### 4. Verify
- API docs: `http://localhost:8000/docs`
- Health check: `GET http://localhost:8000/`

---

## What Makes This Different

| Traditional Approach | Sanjeevani v2 |
|---|---|
| LLM computes SOFA score | Rule engine computes, LLM just explains |
| LLM decides if outlier | Z-score + bounds check decides |
| LLM recommends weaning | VWRS engine with 5 deterministic checks |
| LLM picks antibiotics | Keyword + config lookup, LLM adds citations |
| If LLM hallucinates → wrong diagnosis | If LLM hallucinates → post-validator catches it, rule engine overrides |
| Patient data sent to API | De-identified; only scores + descriptions sent |

> *"We don't trust AI with a single safety decision. We trust math."*
