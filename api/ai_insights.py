from __future__ import annotations

import json
import logging
import os
from typing import Any

from dotenv import load_dotenv

try:
    from groq import Groq
except Exception as exc:  # pragma: no cover - import fallback
    Groq = None
    GROQ_IMPORT_ERROR = exc
else:
    GROQ_IMPORT_ERROR = None


load_dotenv(".env")
load_dotenv(".env.local", override=True)

DEFAULT_MODEL = "llama-3.3-70b-versatile"
LOGGER = logging.getLogger(__name__)


def _format_service_line(name: str, cost: float, total_cost: float) -> str:
    share = (cost / total_cost * 100) if total_cost else 0.0
    return f"{name}: ${cost:,.2f} ({share:.0f}% of total spend)"


def _build_fallback_report(data: dict[str, Any]) -> dict[str, Any]:
    total_cost = float(data.get("total_cost", 0.0))
    waste_cost = float(data.get("waste_cost", 0.0))
    estimated_savings = float(data.get("estimated_savings", waste_cost))
    row_count = int(data.get("row_count", 0))
    provider = data.get("provider_detected", "Unknown")
    confidence_score = int(data.get("analysis_confidence", 0) or 0)
    quality_note = data.get("analysis_quality_note", "")
    top_services = data.get("top_services", {})
    waste_services = data.get("waste_services", {})
    recommendations = data.get("recommendations", [])

    top_cost_drivers = [
        _format_service_line(service, float(cost), total_cost)
        for service, cost in list(top_services.items())[:5]
    ]
    if not top_cost_drivers:
        top_cost_drivers = ["No top cost drivers were detected in the uploaded billing file."]

    waste_findings = []
    if waste_cost > 0:
        waste_findings.append(
            f"Likely waste is estimated at ${waste_cost:,.2f} based on positive-cost rows with zero usage."
        )
        for service, cost in list(waste_services.items())[:3]:
            waste_findings.append(f"{service} appears in the waste profile with about ${float(cost):,.2f} in cost.")
    else:
        waste_findings.append(
            "No clear zero-usage waste was detected, so the main opportunities are likely pricing optimization and rightsizing."
        )

    fallback_recommendations = recommendations[:5] or [
        "Review the highest-cost services first and validate whether workloads are correctly sized.",
        "Evaluate commitment discounts such as savings plans or reserved pricing for stable compute usage.",
        "Audit storage retention, snapshots, and lifecycle policies for lower-cost tiering opportunities.",
    ]

    next_actions = [
        f"Validate the top-spend services highlighted in the file and prioritize {provider} cost owners for review.",
        f"Investigate the modeled savings opportunity of ${estimated_savings:,.2f} and confirm which portion is immediately recoverable.",
        "Re-export billing data with consistent service and usage columns if you want higher-confidence anomaly detection.",
    ]

    return {
        "executive_summary": (
            f"The uploaded billing file contains {row_count:,} positive-cost rows with total measured spend of "
            f"${total_cost:,.2f}. Provider detection suggests {provider}, and the current review indicates a "
            f"modeled savings opportunity of approximately ${estimated_savings:,.2f}."
        ),
        "top_cost_drivers": top_cost_drivers,
        "waste_findings": waste_findings,
        "recommendations": fallback_recommendations,
        "risk_warning": (
            f"Potential waste of ${waste_cost:,.2f} should be validated quickly because idle spend can persist unnoticed."
            if waste_cost > 0
            else "Because no direct waste spike was identified, there is a risk that inefficient but active workloads are masking the largest savings opportunities."
        ),
        "next_actions": next_actions,
        "analysis_confidence": (
            f"Confidence is {confidence_score}/100. {quality_note}".strip()
            if confidence_score
            else "Confidence is moderate because the analysis relied on the fields detected in the uploaded export."
        ),
    }


def _validate_ai_report(candidate: Any, fallback: dict[str, Any]) -> dict[str, Any]:
    required_fields = [
        "executive_summary",
        "top_cost_drivers",
        "waste_findings",
        "recommendations",
        "risk_warning",
        "next_actions",
        "analysis_confidence",
    ]

    if not isinstance(candidate, dict):
        return fallback

    normalized: dict[str, Any] = {}
    for field in required_fields:
        value = candidate.get(field)
        if field in {"top_cost_drivers", "waste_findings", "recommendations", "next_actions"}:
            if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                normalized[field] = fallback[field]
            else:
                normalized[field] = [item.strip() for item in value][:5]
        else:
            if not isinstance(value, str) or not value.strip():
                normalized[field] = fallback[field]
            else:
                normalized[field] = value.strip()

    return normalized


def generate_insights(data: dict[str, Any]) -> dict[str, Any]:
    fallback_report = _build_fallback_report(data)

    if data.get("error"):
        LOGGER.warning("AI report generation skipped because analysis contains an error.")
        return fallback_report

    api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("GROQ_MODEL", DEFAULT_MODEL)

    if not api_key:
        LOGGER.info("GROQ_API_KEY is not configured. Returning fallback report.")
        return fallback_report

    if Groq is None:
        LOGGER.warning("Groq SDK import failed. Returning fallback report. error=%s", GROQ_IMPORT_ERROR)
        return fallback_report

    prompt_payload = json.dumps(data, indent=2)
    prompt = (
        "You are a senior FinOps advisor. Review the cloud cost analysis JSON and respond with JSON only.\n"
        "Return exactly this shape:\n"
        "{\n"
        '  "executive_summary": "string",\n'
        '  "top_cost_drivers": ["string"],\n'
        '  "waste_findings": ["string"],\n'
        '  "recommendations": ["string"],\n'
        '  "risk_warning": "string",\n'
        '  "next_actions": ["string"],\n'
        '  "analysis_confidence": "string"\n'
        "}\n\n"
        "Guidance:\n"
        "- Keep the tone concise, professional, and client-ready.\n"
        "- Mention the largest cost drivers explicitly.\n"
        "- Mention likely waste findings explicitly.\n"
        "- Recommendations should be practical and action-oriented.\n"
        "- Next actions should be concise execution steps.\n"
        "- The confidence field should explain how dependable the analysis is based on the available schema.\n"
        "- Return valid JSON only and no markdown.\n\n"
        f"Analysis JSON:\n{prompt_payload}"
    )

    try:
        LOGGER.info("Groq call start using model=%s", model_name)
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=model_name,
            temperature=0.2,
            max_completion_tokens=900,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You create concise structured FinOps reports for cloud cost optimization. "
                        "Return JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )

        content = response.choices[0].message.content if response.choices else ""
        if not content:
            LOGGER.warning("Groq returned an empty message content. Falling back.")
            return fallback_report

        parsed = json.loads(content)
        return _validate_ai_report(parsed, fallback_report)
    except Exception as exc:
        LOGGER.exception("Groq report generation failed: %s", exc)
        return fallback_report
