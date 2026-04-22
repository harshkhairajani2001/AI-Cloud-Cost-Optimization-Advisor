const COST_CANDIDATES = ["TotalCost", "Cost", "PretaxCost", "ExtendedCost", "Amount"];
const SERVICE_CANDIDATES = ["ProductName", "ServiceName", "MeterCategory", "Service", "Product"];
const USAGE_CANDIDATES = ["UsageQuantity", "Quantity", "ConsumedQuantity", "Usage"];

const AWS_KEYWORDS = [
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
];

const AZURE_KEYWORDS = [
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
];

const COMPUTE_KEYWORDS = ["ec2", "compute", "vm", "virtual machine", "kubernetes", "container", "aks", "eks"];
const STORAGE_KEYWORDS = ["storage", "s3", "blob", "disk", "snapshot", "backup", "archive"];

export class AnalysisError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AnalysisError";
    this.statusCode = statusCode;
  }
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvText(csvText) {
  const text = String(csvText || "").replace(/^\uFEFF/, "");

  if (!text.trim()) {
    throw new AnalysisError("The uploaded CSV is empty.");
  }

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const normalizedRows = rows.filter((currentRow) =>
    currentRow.some((value) => String(value || "").trim().length > 0),
  );

  if (!normalizedRows.length) {
    throw new AnalysisError("The uploaded CSV is empty.");
  }

  const [headerRow, ...dataRows] = normalizedRows;
  const headers = headerRow.map((value) => String(value || "").trim());

  if (!headers.some(Boolean)) {
    throw new AnalysisError("The uploaded CSV does not contain a valid header row.");
  }

  return dataRows.map((currentRow) => {
    const record = {};

    headers.forEach((header, index) => {
      record[header] = String(currentRow[index] ?? "").trim();
    });

    return record;
  });
}

function detectColumn(columns, candidates) {
  const normalizedLookup = new Map(columns.map((column) => [normalizeKey(column), column]));

  for (const candidate of candidates) {
    const match = normalizedLookup.get(normalizeKey(candidate));
    if (match) {
      return match;
    }
  }

  return null;
}

function toNumericValue(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[$,\s]/g, "");

  if (!normalized) {
    return Number.NaN;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatTopEntries(entries) {
  return Object.fromEntries(entries.map(([name, value]) => [String(name), roundCurrency(value)]));
}

function detectProvider(serviceNames, availableColumns) {
  const haystack = [...serviceNames, ...availableColumns].join(" ").toLowerCase();
  const awsHits = AWS_KEYWORDS.filter((keyword) => haystack.includes(keyword)).length;
  const azureHits = AZURE_KEYWORDS.filter((keyword) => haystack.includes(keyword)).length;

  if (awsHits && azureHits) {
    return "Multi-cloud";
  }
  if (awsHits) {
    return "AWS";
  }
  if (azureHits) {
    return "Azure";
  }
  return "Unknown";
}

function computeConfidence({ serviceColumn, usageColumn, rowCount }) {
  let score = 70;

  if (serviceColumn) {
    score += 12;
  }
  if (usageColumn) {
    score += 10;
  }
  if (rowCount >= 25) {
    score += 8;
  } else if (rowCount >= 10) {
    score += 5;
  }

  return Math.min(score, 100);
}

function buildQualityNote(confidence, usageColumnDetected) {
  let note = "Moderate confidence analysis; adding richer usage fields will improve precision.";

  if (confidence >= 92) {
    note = "High-confidence schema detection with strong service and usage coverage.";
  } else if (confidence >= 82) {
    note = "Strong schema match with enough signal for reliable cost and waste analysis.";
  }

  if (usageColumnDetected) {
    return `${note} Waste detection used positive-cost rows with zero recorded usage.`;
  }

  return `${note} Waste detection is conservative because no usage column was available.`;
}

function estimateSavings(totalCost, wasteCost, topServices) {
  if (totalCost <= 0) {
    return 0;
  }

  const serviceNames = Object.keys(topServices);
  const topServiceCost = Object.values(topServices)[0] || 0;
  const concentrationRatio = topServiceCost / totalCost;

  let modeledSavings = wasteCost;

  if (concentrationRatio >= 0.4) {
    modeledSavings += totalCost * 0.04;
  }

  const loweredServices = serviceNames.join(" ").toLowerCase();

  if (COMPUTE_KEYWORDS.some((keyword) => loweredServices.includes(keyword))) {
    modeledSavings += totalCost * 0.03;
  }
  if (STORAGE_KEYWORDS.some((keyword) => loweredServices.includes(keyword))) {
    modeledSavings += totalCost * 0.02;
  }

  return roundCurrency(Math.min(Math.max(modeledSavings, wasteCost), totalCost * 0.18));
}

function buildTakeaways({
  totalCost,
  wasteCost,
  topServices,
  providerDetected,
  confidence,
  usageColumnDetected,
  estimatedSavings,
}) {
  const takeaways = [];
  const [topServiceName = "Unspecified Service", topServiceCost = 0] = Object.entries(topServices)[0] || [];
  const concentrationRatio = totalCost > 0 ? (topServiceCost / totalCost) * 100 : 0;

  takeaways.push(
    `${topServiceName} is the largest visible cost driver at ${Math.round(concentrationRatio)}% of measured spend.`,
  );

  if (usageColumnDetected && wasteCost > 0) {
    takeaways.push(
      `Zero-usage billed rows suggest $${wasteCost.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} in likely waste that should be investigated first.`,
    );
  } else if (usageColumnDetected) {
    takeaways.push(
      "Usage-aware analysis completed without a clear zero-usage waste spike, indicating the largest gains are likely rightsizing or pricing commitments.",
    );
  } else {
    takeaways.push(
      "Usage data was not present, so waste detection is conservative and should be validated against idle resource inventories.",
    );
  }

  takeaways.push(
    `${providerDetected} billing patterns were detected with an analysis confidence score of ${confidence}/100, and the modeled savings opportunity is about $${estimatedSavings.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}.`,
  );

  return takeaways;
}

function buildRecommendations({ totalCost, wasteCost, topServices, usageColumnDetected }) {
  const recommendations = [];
  const serviceNames = Object.keys(topServices);
  const primaryServices = serviceNames.length ? serviceNames.slice(0, 3).join(", ") : "your highest-cost services";

  recommendations.push(
    `Review spend concentration across ${primaryServices} and place budget or anomaly controls on the largest cost drivers.`,
  );

  if (usageColumnDetected && wasteCost > 0) {
    recommendations.push(
      `Investigate billed resources with zero usage first; this file indicates approximately $${wasteCost.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      )} in likely waste.`,
    );
  } else if (usageColumnDetected) {
    recommendations.push(
      "No zero-usage billed rows were detected, but idle resources should still be reviewed with schedules, rightsizing rules, and shutdown policies.",
    );
  } else {
    recommendations.push(
      "Include a usage quantity column in future billing exports to improve idle resource detection and waste estimation.",
    );
  }

  const loweredServices = serviceNames.join(" ").toLowerCase();

  if (COMPUTE_KEYWORDS.some((keyword) => loweredServices.includes(keyword))) {
    recommendations.push(
      "Evaluate reserved pricing, savings plans, or commitment discounts for predictable compute workloads.",
    );
  } else {
    recommendations.push(
      "Review long-running workloads for commitment discounts such as reserved capacity or savings plans.",
    );
  }

  if (STORAGE_KEYWORDS.some((keyword) => loweredServices.includes(keyword))) {
    recommendations.push(
      "Optimize storage tiering and lifecycle policies so colder data moves to lower-cost archival or infrequent-access classes.",
    );
  } else {
    recommendations.push(
      "Audit storage retention, snapshots, and backups to ensure older data is moved to lower-cost tiers.",
    );
  }

  const [topServiceName = "the leading service", topServiceCost = 0] = Object.entries(topServices)[0] || [];
  if (totalCost > 0 && topServiceCost / totalCost >= 0.4) {
    recommendations.push(
      `${topServiceName} represents a large share of total spend, so rightsizing and procurement review there will likely deliver the fastest savings.`,
    );
  }

  return recommendations.slice(0, 5);
}

function aggregateTopEntries(rows, valueSelector, maxEntries = 5) {
  const totals = new Map();

  for (const row of rows) {
    const key = row.serviceLabel || "Unspecified Service";
    const nextValue = totals.get(key) || 0;
    totals.set(key, nextValue + valueSelector(row));
  }

  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, maxEntries);
}

export function analyzeBillingCsv(csvText) {
  const records = parseCsvText(csvText);

  if (!records.length) {
    throw new AnalysisError("The uploaded CSV does not contain any billing rows.");
  }

  const availableColumns = Object.keys(records[0]);
  const costColumn = detectColumn(availableColumns, COST_CANDIDATES);
  const serviceColumn = detectColumn(availableColumns, SERVICE_CANDIDATES);
  const usageColumn = detectColumn(availableColumns, USAGE_CANDIDATES);

  const detectedColumns = {
    cost: costColumn,
    service: serviceColumn,
    usage: usageColumn,
  };

  if (!costColumn) {
    throw new AnalysisError(
      `Could not find a supported cost column. Expected one of: ${COST_CANDIDATES.join(", ")}.`,
    );
  }

  const normalizedRows = records
    .map((record) => {
      const cost = toNumericValue(record[costColumn]);
      const usage = usageColumn ? toNumericValue(record[usageColumn]) : Number.NaN;
      const serviceLabel = serviceColumn
        ? String(record[serviceColumn] || "").trim() || "Unspecified Service"
        : "Unspecified Service";

      return {
        cost,
        usage,
        serviceLabel,
      };
    })
    .filter((row) => Number.isFinite(row.cost) && row.cost > 0);

  if (!normalizedRows.length) {
    throw new AnalysisError("No rows with a positive numeric cost were found in the uploaded CSV.");
  }

  const totalCost = normalizedRows.reduce((sum, row) => sum + row.cost, 0);
  const wasteRows = usageColumn
    ? normalizedRows.filter((row) => Number.isFinite(row.usage) && row.usage === 0 && row.cost > 0)
    : [];
  const wasteCost = wasteRows.reduce((sum, row) => sum + row.cost, 0);

  const topServices = formatTopEntries(aggregateTopEntries(normalizedRows, (row) => row.cost));
  const wasteServices = formatTopEntries(aggregateTopEntries(wasteRows, (row) => row.cost));
  const providerDetected = detectProvider(Object.keys(topServices), availableColumns);
  const analysisConfidence = computeConfidence({
    serviceColumn,
    usageColumn,
    rowCount: normalizedRows.length,
  });
  const estimatedSavings = estimateSavings(totalCost, wasteCost, topServices);
  const analysisQualityNote = buildQualityNote(analysisConfidence, Boolean(usageColumn));
  const recommendations = buildRecommendations({
    totalCost,
    wasteCost,
    topServices,
    usageColumnDetected: Boolean(usageColumn),
  });
  const keyTakeaways = buildTakeaways({
    totalCost,
    wasteCost,
    topServices,
    providerDetected,
    confidence: analysisConfidence,
    usageColumnDetected: Boolean(usageColumn),
    estimatedSavings,
  });

  return {
    total_cost: roundCurrency(totalCost),
    waste_cost: roundCurrency(wasteCost),
    estimated_savings: estimatedSavings,
    row_count: normalizedRows.length,
    provider_detected: providerDetected,
    analysis_confidence: analysisConfidence,
    analysis_quality_note: analysisQualityNote,
    detected_columns: detectedColumns,
    top_services: topServices,
    waste_services: wasteServices,
    waste_detection_method: usageColumn
      ? "Rows with positive cost and zero numeric usage were flagged as likely waste."
      : "No usage column was detected, so waste analysis is limited to conservative recommendations.",
    key_takeaways: keyTakeaways,
    recommendations,
  };
}
