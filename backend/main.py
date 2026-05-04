"""
Sanjeevani v2 — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Sanjeevani v2",
    description="Hybrid Rule-Engine + AI Narrative ICU Diagnostic Assistant",
    version="2.0.0",
)

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Route Registration ──
from routes.auth_routes import router as auth_router
from routes.patient_routes import router as patient_router
from routes.upload_routes import router as upload_router
from routes.analysis_routes import router as analysis_router
from routes.report_routes import router as report_router
from routes.dashboard_routes import router as dashboard_router
from routes.nfc_routes import router as nfc_router

app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(patient_router, prefix="/api", tags=["Patients"])
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])
app.include_router(report_router, prefix="/api", tags=["Reports"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(nfc_router, prefix="/api", tags=["NFC"])


@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Sanjeevani v2",
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
