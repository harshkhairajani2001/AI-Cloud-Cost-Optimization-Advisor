from __future__ import annotations

import logging
import shutil
from typing import Any
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

try:
    from .ai_insights import generate_insights
    from .analyzer import analyze_cost
except ImportError:
    from ai_insights import generate_insights
    from analyzer import analyze_cost


LOGGER = logging.getLogger(__name__)


def error_response(message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": False, "error": message})


def success_response(analysis: dict[str, Any], ai_report: dict[str, Any]) -> JSONResponse:
    payload = {
        "success": True,
        "analysis": {
            "total_cost": analysis.get("total_cost", 0.0),
            "waste_cost": analysis.get("waste_cost", 0.0),
            "row_count": analysis.get("row_count", 0),
            "provider_detected": analysis.get("provider_detected", "Unknown"),
            "estimated_savings": analysis.get("estimated_savings", 0.0),
            "detected_columns": analysis.get("detected_columns", {}),
            "top_services": analysis.get("top_services", {}),
            "recommendations": analysis.get("recommendations", []),
            "analysis_confidence": analysis.get("analysis_confidence"),
            "analysis_quality_note": analysis.get("analysis_quality_note"),
            "waste_services": analysis.get("waste_services", {}),
            "waste_detection_method": analysis.get("waste_detection_method"),
            "key_takeaways": analysis.get("key_takeaways", []),
        },
        "ai_report": ai_report,
    }
    return JSONResponse(content=payload)


app = FastAPI(
    title="AI Cloud Cost Optimization Advisor",
    version="1.0.0",
    description="Analyze cloud billing CSV files and generate optimization insights.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    detail = exc.errors()
    LOGGER.warning("Request validation failed: %s", detail)
    return error_response("Please select a valid CSV file before starting the analysis.", status_code=422)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_, exc: StarletteHTTPException):
    LOGGER.warning("HTTP exception returned: %s", exc.detail)
    if isinstance(exc.detail, str) and exc.detail:
        message = exc.detail
    else:
        message = "The request could not be completed."
    return error_response(message, status_code=exc.status_code)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception):
    LOGGER.exception("Unhandled API exception: %s", exc)
    return error_response(
        "The analysis service encountered an unexpected error. Please try again.",
        status_code=500,
    )


@app.get("/api/health")
async def health_check() -> dict:
    return {"success": True, "status": "ok", "service": "AI Cloud Cost Optimization Advisor API"}


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    temp_file_path: str | None = None

    try:
        if not file or not file.filename:
            return error_response("Please select a CSV file to analyze.", status_code=400)

        LOGGER.info(
            "File received for upload. filename=%s content_type=%s",
            file.filename,
            file.content_type or "unknown",
        )

        suffix = Path(file.filename).suffix or ".csv"
        with NamedTemporaryFile(delete=False, suffix=suffix, prefix="billing_") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        LOGGER.info("Temporary upload saved to %s", temp_file_path)

        LOGGER.info("CSV parsing start for %s", file.filename)
        analysis = analyze_cost(temp_file_path)
        if analysis.get("error"):
            LOGGER.warning(
                "Analysis returned a readable error for %s. detected_columns=%s error=%s",
                file.filename,
                analysis.get("detected_columns", {}),
                analysis["error"],
            )
            return error_response(analysis["error"], status_code=400)

        LOGGER.info("Detected columns for %s: %s", file.filename, analysis.get("detected_columns", {}))
        LOGGER.info("Groq call start for %s", file.filename)
        ai_report = generate_insights(analysis)

        if not isinstance(ai_report, dict):
            LOGGER.warning("AI report was not returned as a dictionary for %s. Falling back to empty report.", file.filename)
            ai_report = {
                "executive_summary": "AI reporting was unavailable, so a structured report could not be generated.",
                "top_cost_drivers": [],
                "waste_findings": [],
                "recommendations": analysis.get("recommendations", []),
                "risk_warning": "AI output was unavailable for this run.",
                "next_actions": analysis.get("recommendations", [])[:3],
            }

        LOGGER.info("Upload completed successfully for %s", file.filename)
        return success_response(analysis, ai_report)
    except Exception as exc:
        LOGGER.exception("Upload processing failed: %s", exc)
        return error_response(
            "Failed to process the uploaded CSV file. Please verify the file format and try again.",
            status_code=500,
        )
    finally:
        try:
            await file.close()
        except Exception as exc:
            LOGGER.warning("Failed to close uploaded file cleanly: %s", exc)
        if temp_file_path:
            temp_path = Path(temp_file_path)
            if temp_path.exists():
                try:
                    temp_path.unlink(missing_ok=True)
                except Exception as exc:
                    LOGGER.warning("Failed to remove temporary upload file %s: %s", temp_file_path, exc)
