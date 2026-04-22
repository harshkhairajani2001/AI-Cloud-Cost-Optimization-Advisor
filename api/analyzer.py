from __future__ import annotations

import logging
import re
from typing import Any

import pandas as pd


COST_CANDIDATES = ["TotalCost", "Cost", "PretaxCost", "ExtendedCost", "Amount"]
SERVICE_CANDIDATES = ["ProductName", "ServiceName", "MeterCategory", "Service", "Product"]
USAGE_CANDIDATES = ["UsageQuantity", "Quantity", "ConsumedQuantity", "Usage"]
AWS_KEYWORDS = [
    "amazon",
    "aws",
    "ec2",
    "s3",
    "rds",
    "lambda",
    "cloudfront",
    "dynamodb",
    "redshift",
    "eks",
    "elastic",
]
AZURE_KEYWORDS = [
    "azure",
    "virtual machines",
    "blob",
    "sql database",
    "app service",
    "cosmos",
    "aks",
    "monitor",
    "key vault",
    "storage account",
]
COMPUTE_KEYWORDS = ["ec2", "compute", "vm", "virtual machine", "kubernetes", "container", "aks", "eks"]
STORAGE_KEYWORDS = ["storage", "s3", "blob", "disk", "snapshot", "backup", "archive"]
LOGGER = logging.getLogger(__name__)


def _normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.strip().lower())


def _read_csv(file_path: str) -> pd.DataFrame:
    read_attempts: list[dict[str, Any]] = [
        {"low_memory": False},
        {"low_memory": False, "encoding": "utf-8-sig"},
        {"low_memory": False, "encoding": "latin-1"},
    ]

    last_error: Exception | None = None
    for options in read_attempts:
        try:
            return pd.read_csv(file_path, **options)
        except Exception as exc:
            last_error = exc

    raise ValueError(f"Unable to read the CSV file. {last_error}")


def _detect_column(columns: list[str], candidates: list[str]) -> str | None:
    normalized_lookup = {_normalize_key(column): column for column in columns}
    for candidate in candidates:
        match = normalized_lookup.get(_normalize_key(candidate))
        if match:
            return match
    return None


def _format_top_services(series: pd.Series) -> dict[str, float]:
    return {str(name): round(float(value), 2) for name, value in series.items()}


def _detect_provider(service_names: list[str], available_columns: list[str]) -> str:
    haystack = " ".join(service_names + available_columns).lower()
    aws_hits = sum(keyword in haystack for keyword in AWS_KEYWORDS)
    azure_hits = sum(keyword in haystack for keyword in AZURE_KEYWORDS)

    if aws_hits and azure_hits:
        return "Multi-cloud"
    if aws_hits:
        return "AWS"
    if azure_hits:
        return "Azure"
    return "Unknown"


def _compute_confidence(service_column: str | None, usage_column: str | None, row_count: int) -> int:
    score = 70
    if service_column:
        score += 12
    if usage_column:
        score += 10
    if row_count >= 25:
        score += 8
    elif row_count >= 10:
        score += 5
    return min(score, 100)


def _build_quality_note(confidence: int, usage_column_detected: bool) -> str:
    if confidence >= 92:
        note = "High-confidence schema detection with strong service and usage coverage."
    elif confidence >= 82:
        note = "Strong schema match with enough signal for reliable cost and waste analysis."
    else:
        note = "Moderate confidence analysis; adding richer usage fields will improve precision."

    if usage_column_detected:
        return f"{note} Waste detection used positive-cost rows with zero recorded usage."
    return f"{note} Waste detection is conservative because no usage column was available."


def _estimate_savings(total_cost: float, waste_cost: float, top_services: dict[str, float]) -> float:
    if total_cost <= 0:
        return 0.0

    service_names = list(top_services.keys())
    top_service_cost = next(iter(top_services.values()), 0.0)
    concentration_ratio = top_service_cost / total_cost if total_cost else 0.0

    modeled_savings = waste_cost
    if concentration_ratio >= 0.4:
        modeled_savings += total_cost * 0.04

    lowered_services = " ".join(service_names).lower()
    if any(keyword in lowered_services for keyword in COMPUTE_KEYWORDS):
        modeled_savings += total_cost * 0.03
    if any(keyword in lowered_services for keyword in STORAGE_KEYWORDS):
        modeled_savings += total_cost * 0.02

    modeled_savings = max(modeled_savings, waste_cost)
    return round(min(modeled_savings, total_cost * 0.18), 2)


def _build_takeaways(
    total_cost: float,
    waste_cost: float,
    top_services: dict[str, float],
    provider_detected: str,
    confidence: int,
    usage_column_detected: bool,
    estimated_savings: float,
) -> list[str]:
    takeaways: list[str] = []
    top_service_name, top_service_cost = next(iter(top_services.items()), ("Unspecified Service", 0.0))
    concentration_ratio = (top_service_cost / total_cost * 100) if total_cost else 0.0

    takeaways.append(
        f"{top_service_name} is the largest visible cost driver at {concentration_ratio:.0f}% of measured spend."
    )

    if usage_column_detected and waste_cost > 0:
        takeaways.append(
            f"Zero-usage billed rows suggest ${waste_cost:,.2f} in likely waste that can be investigated first."
        )
    elif usage_column_detected:
        takeaways.append(
            "Usage-aware analysis completed without clear zero-usage waste, indicating the largest opportunities are likely rightsizing or pricing commitments."
        )
    else:
        takeaways.append(
            "Usage data was not present, so waste detection is conservative and should be validated against idle resource inventories."
        )

    takeaways.append(
        f"{provider_detected} billing patterns were detected with an analysis confidence score of {confidence}/100, and modeled savings opportunity is about ${estimated_savings:,.2f}."
    )

    return takeaways


def _build_recommendations(
    total_cost: float,
    waste_cost: float,
    top_services: dict[str, float],
    usage_column_detected: bool,
) -> list[str]:
    recommendations: list[str] = []
    service_names = list(top_services.keys())
    primary_services = ", ".join(service_names[:3]) if service_names else "your highest-cost services"

    recommendations.append(
        f"Review spend concentration across {primary_services} and set budgets or anomaly alerts for the largest cost drivers."
    )

    if usage_column_detected and waste_cost > 0:
        recommendations.append(
            f"Investigate idle resources with zero usage that still incurred charges; the current file shows about ${waste_cost:,.2f} in likely waste."
        )
    elif usage_column_detected:
        recommendations.append(
            "No zero-usage billed rows were detected, but idle resources should still be validated with tagging, schedules, and shutdown policies."
        )
    else:
        recommendations.append(
            "Include a usage quantity column in future exports to improve idle resource detection and waste estimation."
        )

    lowered_services = " ".join(name.lower() for name in service_names)
    if any(keyword in lowered_services for keyword in ["ec2", "compute", "vm", "kubernetes", "container"]):
        recommendations.append(
            "Evaluate reserved pricing, savings plans, or committed-use discounts for predictable compute workloads."
        )
    else:
        recommendations.append(
            "Review long-running workloads for commitment discounts such as reserved capacity or savings plans."
        )

    if any(keyword in lowered_services for keyword in ["storage", "s3", "disk", "blob"]):
        recommendations.append(
            "Optimize storage tiering and lifecycle policies so cold data moves to lower-cost archival or infrequent-access classes."
        )
    else:
        recommendations.append(
            "Audit storage retention, snapshots, and backups to ensure older data is moved to lower-cost tiers."
        )

    top_service_name, top_service_cost = next(iter(top_services.items()), ("the leading service", 0.0))
    if total_cost > 0 and top_service_cost / total_cost >= 0.4:
        recommendations.append(
            f"{top_service_name} represents a large share of total spend, so rightsizing and procurement reviews there will likely deliver the fastest savings."
        )

    return recommendations[:5]


def analyze_cost(file_path: str) -> dict[str, Any]:
    LOGGER.info("CSV parsing start for file: %s", file_path)
    try:
        dataframe = _read_csv(file_path)
    except Exception as exc:
        LOGGER.exception("CSV parsing failed for file %s: %s", file_path, exc)
        return {"error": f"Could not read the uploaded CSV file. {exc}"}

    if dataframe.empty:
        LOGGER.warning("Uploaded CSV is empty: %s", file_path)
        return {"error": "The uploaded CSV is empty."}

    dataframe.columns = [str(column).strip() for column in dataframe.columns]
    available_columns = dataframe.columns.tolist()

    cost_column = _detect_column(available_columns, COST_CANDIDATES)
    service_column = _detect_column(available_columns, SERVICE_CANDIDATES)
    usage_column = _detect_column(available_columns, USAGE_CANDIDATES)

    detected_columns = {
        "cost": cost_column,
        "service": service_column,
        "usage": usage_column,
    }
    LOGGER.info("Detected columns for %s: %s", file_path, detected_columns)

    if not cost_column:
        expected_columns = ", ".join(COST_CANDIDATES)
        LOGGER.warning("Missing required cost column for %s. Available columns: %s", file_path, available_columns)
        return {
            "error": f"Could not find a supported cost column. Expected one of: {expected_columns}.",
            "detected_columns": detected_columns,
            "available_columns": available_columns,
        }

    working_df = dataframe.copy()
    working_df[cost_column] = pd.to_numeric(working_df[cost_column], errors="coerce")
    working_df = working_df[working_df[cost_column].notna()]
    working_df = working_df[working_df[cost_column] > 0]

    if working_df.empty:
        LOGGER.warning("No positive numeric cost rows found for %s", file_path)
        return {
            "error": "No rows with a positive numeric cost were found in the uploaded CSV.",
            "detected_columns": detected_columns,
            "available_columns": available_columns,
        }

    if service_column:
        working_df[service_column] = (
            working_df[service_column]
            .fillna("Unspecified Service")
            .astype(str)
            .str.strip()
            .replace("", "Unspecified Service")
        )
        service_series = working_df[service_column]
    else:
        service_series = pd.Series(["Unspecified Service"] * len(working_df), index=working_df.index)

    waste_cost = 0.0
    waste_services: dict[str, float] = {}
    if usage_column:
        working_df[usage_column] = pd.to_numeric(working_df[usage_column], errors="coerce")
        waste_df = working_df[(working_df[usage_column] == 0) & (working_df[cost_column] > 0)]
        waste_cost = float(waste_df[cost_column].sum())
        if not waste_df.empty:
            waste_services_series = (
                waste_df.assign(_service_label=service_series.loc[waste_df.index])
                .groupby("_service_label")[cost_column]
                .sum()
                .sort_values(ascending=False)
                .head(5)
            )
            waste_services = _format_top_services(waste_services_series)

    top_services_series = (
        working_df.assign(_service_label=service_series)
        .groupby("_service_label")[cost_column]
        .sum()
        .sort_values(ascending=False)
        .head(5)
    )
    top_services = _format_top_services(top_services_series)

    total_cost = float(working_df[cost_column].sum())
    provider_detected = _detect_provider(list(top_services.keys()), available_columns)
    analysis_confidence = _compute_confidence(service_column, usage_column, int(len(working_df)))
    estimated_savings = _estimate_savings(total_cost, waste_cost, top_services)
    analysis_quality_note = _build_quality_note(analysis_confidence, bool(usage_column))
    recommendations = _build_recommendations(
        total_cost=total_cost,
        waste_cost=waste_cost,
        top_services=top_services,
        usage_column_detected=bool(usage_column),
    )
    key_takeaways = _build_takeaways(
        total_cost=total_cost,
        waste_cost=waste_cost,
        top_services=top_services,
        provider_detected=provider_detected,
        confidence=analysis_confidence,
        usage_column_detected=bool(usage_column),
        estimated_savings=estimated_savings,
    )
    LOGGER.info(
        "Analysis complete for %s. provider=%s rows=%s total_cost=%.2f waste_cost=%.2f",
        file_path,
        provider_detected,
        int(len(working_df)),
        total_cost,
        waste_cost,
    )

    return {
        "total_cost": round(total_cost, 2),
        "waste_cost": round(waste_cost, 2),
        "estimated_savings": estimated_savings,
        "row_count": int(len(working_df)),
        "provider_detected": provider_detected,
        "analysis_confidence": analysis_confidence,
        "analysis_quality_note": analysis_quality_note,
        "detected_columns": detected_columns,
        "top_services": top_services,
        "waste_services": waste_services,
        "waste_detection_method": (
            "Rows with positive cost and zero numeric usage were flagged as likely waste."
            if usage_column
            else "No usage column was detected, so waste analysis is limited to conservative recommendations."
        ),
        "key_takeaways": key_takeaways,
        "recommendations": recommendations,
    }
