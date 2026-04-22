export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const SAMPLE_CSV_TEXT = `ServiceName,UsageQuantity,Cost
Amazon EC2,120,245.82
Amazon S3,0,39.14
Azure Virtual Machines,55,180.22
`;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const AWS_KEYWORDS = ["amazon", "aws", "ec2", "s3", "rds", "lambda", "dynamodb", "eks"];
const AZURE_KEYWORDS = ["azure", "blob", "virtual machine", "virtual machines", "aks", "cosmos"];

export const statusConfig = {
  idle: {
    label: "Awaiting file",
    chip: "Idle",
    tone: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    banner: "border-white/10 bg-white/[0.03] text-slate-300",
    helper: "Upload a billing CSV to initialize the command center.",
  },
  loading: {
    label: "Analysis in progress",
    chip: "Processing",
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    banner: "border-amber-400/20 bg-amber-400/10 text-amber-100",
    helper: "Parsing cost rows, modeling savings, and generating AI insight output.",
  },
  success: {
    label: "Analysis complete",
    chip: "Ready",
    tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    banner: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    helper: "The latest billing file has been processed successfully.",
  },
  error: {
    label: "Attention required",
    chip: "Blocked",
    tone: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    banner: "border-rose-400/20 bg-rose-400/10 text-rose-100",
    helper: "The last run did not complete successfully.",
  },
};

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

export function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

export function formatTimestamp(value) {
  if (!value) {
    return "Not analyzed yet";
  }

  return dateTimeFormatter.format(value);
}

function inferProvider(analysis) {
  if (analysis?.provider_detected && analysis.provider_detected !== "Unknown") {
    return analysis.provider_detected;
  }

  const haystack = [
    ...Object.keys(analysis?.top_services || {}),
    analysis?.detected_columns?.service || "",
    analysis?.detected_columns?.cost || "",
  ]
    .join(" ")
    .toLowerCase();

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
  return "Undetermined";
}

export function getProviderTone(provider) {
  if (provider === "AWS") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }
  if (provider === "Azure") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  if (provider === "Multi-cloud") {
    return "border-violet-400/20 bg-violet-400/10 text-violet-200";
  }
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export function getConfidenceMeta(score) {
  if (score >= 90) {
    return {
      label: "High confidence",
      tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      bar: "from-emerald-400 via-cyan-400 to-sky-400",
    };
  }
  if (score >= 80) {
    return {
      label: "Strong confidence",
      tone: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
      bar: "from-cyan-400 via-sky-400 to-indigo-400",
    };
  }
  return {
    label: "Moderate confidence",
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    bar: "from-amber-400 via-orange-400 to-rose-400",
  };
}

function normalizeSectionHeading(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function parseAiInsights(aiText, fallbackRecommendations = []) {
  const sections = {
    executiveSummary: "",
    optimizationOpportunities: [],
    riskWarning: "",
  };

  if (!aiText) {
    return {
      ...sections,
      optimizationOpportunities: fallbackRecommendations,
    };
  }

  const lines = aiText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection = "executiveSummary";

  for (const line of lines) {
    const normalizedHeading = normalizeSectionHeading(line.replace(/:$/, ""));
    if (normalizedHeading === "executive summary") {
      currentSection = "executiveSummary";
      continue;
    }
    if (normalizedHeading === "optimization opportunities" || normalizedHeading === "optimization recommendations") {
      currentSection = "optimizationOpportunities";
      continue;
    }
    if (normalizedHeading === "risk warning" || normalizedHeading === "risk / warning") {
      currentSection = "riskWarning";
      continue;
    }

    const cleanedLine = line.replace(/^[-*]\s*/, "").trim();
    if (!cleanedLine) {
      continue;
    }

    if (currentSection === "optimizationOpportunities") {
      sections.optimizationOpportunities.push(cleanedLine);
      continue;
    }

    if (currentSection === "riskWarning") {
      sections.riskWarning = sections.riskWarning
        ? `${sections.riskWarning} ${cleanedLine}`
        : cleanedLine;
      continue;
    }

    sections.executiveSummary = sections.executiveSummary
      ? `${sections.executiveSummary} ${cleanedLine}`
      : cleanedLine;
  }

  if (!sections.optimizationOpportunities.length) {
    sections.optimizationOpportunities = fallbackRecommendations;
  }

  return sections;
}

export function getPriorityForRecommendation(text) {
  const value = text.toLowerCase();

  if (
    ["idle", "waste", "zero-usage", "largest share", "top spend", "rightsizing", "fastest savings"].some((keyword) =>
      value.includes(keyword),
    )
  ) {
    return "High";
  }
  if (
    ["reserved", "savings plan", "commitment", "storage", "tier", "lifecycle", "anomaly", "alerts"].some((keyword) =>
      value.includes(keyword),
    )
  ) {
    return "Medium";
  }
  return "Low";
}

export function buildRecommendationFeed(opportunities = [], fallbackRecommendations = []) {
  const baseItems = opportunities.length ? opportunities : fallbackRecommendations;

  return baseItems.map((text) => ({
    text,
    priority: getPriorityForRecommendation(text),
  }));
}

function parseLegacyAiText(result, fallbackRecommendations) {
  const aiText = result?.ai_insights || "";
  const parsed = parseAiInsights(aiText, fallbackRecommendations);
  return {
    executive_summary: parsed.executiveSummary,
    top_cost_drivers: [],
    waste_findings: [],
    recommendations: parsed.optimizationOpportunities,
    risk_warning: parsed.riskWarning,
    next_actions: fallbackRecommendations.slice(0, 3),
    analysis_confidence: "",
  };
}

function derivedKeyFindings({ analysis, estimatedSavings, savingsRatio, topService, wasteCost, wasteRatio }) {
  const findings = [];

  if (topService) {
    findings.push(
      `${topService.name} is the largest visible cost driver at ${formatCurrency(topService.cost)} (${formatPercent(
        topService.share,
      )} of measured spend).`,
    );
  }

  if (wasteCost > 0) {
    findings.push(
      `${formatCurrency(wasteCost)} in likely waste was detected, representing about ${formatPercent(
        wasteRatio,
      )} of measured spend.`,
    );
  } else {
    findings.push(
      "No direct zero-usage waste was detected in this export, so the strongest savings signals are likely rightsizing and pricing optimization.",
    );
  }

  findings.push(
    `${formatCurrency(estimatedSavings)} in modeled savings is currently visible, equal to about ${formatPercent(
      savingsRatio,
    )} of measured spend.`,
  );

  if (analysis.provider_detected && analysis.provider_detected !== "Unknown") {
    findings.push(`The billing profile is most consistent with ${analysis.provider_detected} cost signals.`);
  }

  return findings;
}

export function deriveAnalysisModel(result) {
  if (!result?.analysis) {
    return null;
  }

  const analysis = result.analysis;
  const totalCost = Number(analysis.total_cost || 0);
  const wasteCost = Number(analysis.waste_cost || 0);
  const estimatedSavings = Number(analysis.estimated_savings || wasteCost || 0);
  const provider = inferProvider(analysis);
  const confidence = Number(analysis.analysis_confidence || 78);
  const aiReport = result.ai_report || parseLegacyAiText(result, analysis.recommendations || []);
  const recommendationFeed = buildRecommendationFeed(
    aiReport.recommendations || [],
    analysis.recommendations || [],
  );

  const serviceEntries = Object.entries(analysis.top_services || {}).map(([name, cost], index) => {
    const numericCost = Number(cost || 0);
    const share = totalCost > 0 ? (numericCost / totalCost) * 100 : 0;
    return {
      index: index + 1,
      name,
      cost: numericCost,
      share,
    };
  });

  const wasteEntries = Object.entries(analysis.waste_services || {}).map(([name, cost]) => ({
    name,
    cost: Number(cost || 0),
  }));

  const topService = serviceEntries[0] || null;
  const wasteRatio = totalCost > 0 ? (wasteCost / totalCost) * 100 : 0;
  const savingsRatio = totalCost > 0 ? (estimatedSavings / totalCost) * 100 : 0;
  const confidenceSummary =
    aiReport.analysis_confidence ||
    `${getConfidenceMeta(confidence).label} at ${confidence}/100. ${
      analysis.analysis_quality_note ||
      "Schema matching completed and the output reflects the columns detected in the uploaded billing file."
    }`;
  const keyFindings = derivedKeyFindings({
    analysis,
    estimatedSavings,
    savingsRatio,
    topService,
    wasteCost,
    wasteRatio,
  });

  return {
    totalCost,
    wasteCost,
    estimatedSavings,
    provider,
    confidence,
    confidenceMeta: getConfidenceMeta(confidence),
    recommendationFeed,
    serviceEntries,
    wasteEntries,
    topService,
    wasteRatio,
    savingsRatio,
    keyFindings,
    confidenceSummary,
    analysisQualityNote:
      analysis.analysis_quality_note ||
      "Schema matching completed and recommendations are based on detected billing signals.",
    keyTakeaways:
      analysis.key_takeaways ||
      recommendationFeed.slice(0, 3).map((item) => item.text),
    wasteDetectionMethod:
      analysis.waste_detection_method ||
      "Positive-cost rows with zero usage are treated as likely waste when usage data is present.",
    aiReport: {
      executiveSummary:
        aiReport.executive_summary || "No executive summary was returned for this analysis.",
      topCostDrivers:
        aiReport.top_cost_drivers && aiReport.top_cost_drivers.length
          ? aiReport.top_cost_drivers
          : serviceEntries.map((entry) =>
              `${entry.name}: ${formatCurrency(entry.cost)} (${formatPercent(entry.share)})`,
            ),
      wasteFindings:
        aiReport.waste_findings && aiReport.waste_findings.length
          ? aiReport.waste_findings
          : wasteEntries.length
            ? wasteEntries.map((entry) => `${entry.name}: ${formatCurrency(entry.cost)} in likely waste`)
            : [
                "No service-level waste findings were returned. Review rightsizing and pricing commitments as the next likely opportunities.",
              ],
      recommendations:
        aiReport.recommendations && aiReport.recommendations.length
          ? aiReport.recommendations
          : analysis.recommendations || [],
      riskWarning:
        aiReport.risk_warning || "No dedicated risk warning was returned for this run.",
      nextActions:
        aiReport.next_actions && aiReport.next_actions.length
          ? aiReport.next_actions
          : (analysis.recommendations || []).slice(0, 3),
      analysisConfidence: confidenceSummary,
    },
  };
}

export function buildReportText(result, derived, lastAnalyzedFile) {
  if (!result?.analysis || !derived) {
    return "";
  }

  const analysis = result.analysis;
  const serviceLines = derived.serviceEntries.length
    ? derived.serviceEntries.map((entry) => `- ${entry.name}: ${formatCurrency(entry.cost)} (${formatPercent(entry.share)})`).join("\n")
    : "- No service breakdown available";

  const wasteLines = derived.wasteEntries.length
    ? derived.wasteEntries.map((entry) => `- ${entry.name}: ${formatCurrency(entry.cost)}`).join("\n")
    : "- No service-level waste detail available";

  const recommendations = derived.recommendationFeed.length
    ? derived.recommendationFeed
        .map((item) => `- [${item.priority}] ${item.text}`)
        .join("\n")
    : "- No recommendations available";

  return `AI Cloud Cost Optimization Advisor Report
Generated: ${formatTimestamp(new Date())}
Source File: ${lastAnalyzedFile?.name || "Unknown"}

Executive Summary
${derived.aiReport.executiveSummary || "No executive summary available."}

Core Metrics
- Total Cost: ${formatCurrency(analysis.total_cost)}
- Waste Cost: ${formatCurrency(analysis.waste_cost)}
- Estimated Savings: ${formatCurrency(analysis.estimated_savings || derived.estimatedSavings)}
- Rows Processed: ${formatNumber(analysis.row_count)}
- Provider Detected: ${derived.provider}
- Analysis Confidence: ${analysis.analysis_confidence || derived.confidence}/100
- Confidence Note: ${derived.aiReport.analysisConfidence || derived.confidenceSummary}

Top Services
${serviceLines}

AI Report
- Top Cost Drivers:
${derived.aiReport.topCostDrivers.map((item) => `  - ${item}`).join("\n")}
- Waste Findings:
${derived.aiReport.wasteFindings.map((item) => `  - ${item}`).join("\n")}

Waste Detection
- Detection Method: ${derived.wasteDetectionMethod}
- Likely Waste Ratio: ${formatPercent(derived.wasteRatio)}
${wasteLines}

Recommendations
${derived.aiReport.recommendations.map((item) => `- ${item}`).join("\n") || recommendations}

Risk Warning
${derived.aiReport.riskWarning || "No additional risk warning was returned."}

Key Findings
${derived.keyFindings.map((item) => `- ${item}`).join("\n")}

Next Actions
${derived.aiReport.nextActions.map((item) => `- ${item}`).join("\n")}
`;
}
