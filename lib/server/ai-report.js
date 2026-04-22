const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatServiceLine(name, cost, totalCost) {
  const share = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;
  return `${name}: $${formatMoney(cost)} (${share}% of total spend)`;
}

function buildFallbackReport(analysis) {
  const totalCost = Number(analysis.total_cost || 0);
  const wasteCost = Number(analysis.waste_cost || 0);
  const estimatedSavings = Number(analysis.estimated_savings || wasteCost || 0);
  const rowCount = Number(analysis.row_count || 0);
  const provider = analysis.provider_detected || "Unknown";
  const topServices = analysis.top_services || {};
  const wasteServices = analysis.waste_services || {};
  const recommendations = analysis.recommendations || [];
  const confidenceScore = Number(analysis.analysis_confidence || 0);
  const qualityNote = analysis.analysis_quality_note || "";

  const topCostDrivers = Object.entries(topServices)
    .slice(0, 5)
    .map(([service, cost]) => formatServiceLine(service, Number(cost || 0), totalCost));

  const wasteFindings = [];
  if (wasteCost > 0) {
    wasteFindings.push(
      `Likely waste is estimated at $${formatMoney(wasteCost)} based on positive-cost rows with zero usage.`,
    );

    for (const [service, cost] of Object.entries(wasteServices).slice(0, 3)) {
      wasteFindings.push(`${service} appears in the waste profile with about $${formatMoney(cost)} in cost.`);
    }
  } else {
    wasteFindings.push(
      "No direct zero-usage waste signal was detected, so the primary opportunities are likely pricing optimization and workload rightsizing.",
    );
  }

  return {
    executive_summary: `The uploaded billing file contains ${rowCount.toLocaleString("en-US")} positive-cost rows with total measured spend of $${formatMoney(
      totalCost,
    )}. Provider detection suggests ${provider}, and the current review indicates a modeled savings opportunity of approximately $${formatMoney(
      estimatedSavings,
    )}.`,
    top_cost_drivers: topCostDrivers.length
      ? topCostDrivers
      : ["No top cost drivers were detected in the uploaded billing file."],
    waste_findings: wasteFindings,
    recommendations:
      recommendations.slice(0, 5).length > 0
        ? recommendations.slice(0, 5)
        : [
            "Review the highest-cost services first and validate whether workloads are correctly sized.",
            "Evaluate commitment discounts such as savings plans or reserved pricing for stable compute usage.",
            "Audit storage retention, snapshots, and lifecycle policies for lower-cost tiering opportunities.",
          ],
    risk_warning:
      wasteCost > 0
        ? `Potential waste of $${formatMoney(wasteCost)} should be validated quickly because idle spend can persist unnoticed.`
        : "Because no direct waste spike was identified, there is a risk that inefficient but active workloads are masking the largest savings opportunities.",
    next_actions: [
      `Validate the top-spend services highlighted in the file and prioritize ${provider} cost owners for review.`,
      `Investigate the modeled savings opportunity of $${formatMoney(
        estimatedSavings,
      )} and confirm which portion is immediately recoverable.`,
      "Re-export billing data with consistent service and usage columns if you want higher-confidence anomaly detection.",
    ],
    analysis_confidence:
      confidenceScore > 0
        ? `Confidence is ${confidenceScore}/100. ${qualityNote}`.trim()
        : "Confidence is moderate because the analysis relied on the fields detected in the uploaded export.",
  };
}

function validateAiReport(candidate, fallbackReport) {
  const requiredFields = [
    "executive_summary",
    "top_cost_drivers",
    "waste_findings",
    "recommendations",
    "risk_warning",
    "next_actions",
    "analysis_confidence",
  ];

  if (!candidate || typeof candidate !== "object") {
    return fallbackReport;
  }

  const normalized = {};

  for (const field of requiredFields) {
    const value = candidate[field];

    if (["top_cost_drivers", "waste_findings", "recommendations", "next_actions"].includes(field)) {
      normalized[field] =
        Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim())
          ? value.map((item) => item.trim()).slice(0, 5)
          : fallbackReport[field];
      continue;
    }

    normalized[field] =
      typeof value === "string" && value.trim() ? value.trim() : fallbackReport[field];
  }

  return normalized;
}

export async function generateAiReport(analysis) {
  const fallbackReport = buildFallbackReport(analysis);
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return fallbackReport;
  }

  const prompt = [
    "You are a senior FinOps advisor.",
    "Review the cloud cost analysis JSON and respond with JSON only.",
    "Return exactly this shape:",
    "{",
    '  "executive_summary": "string",',
    '  "top_cost_drivers": ["string"],',
    '  "waste_findings": ["string"],',
    '  "recommendations": ["string"],',
    '  "risk_warning": "string",',
    '  "next_actions": ["string"],',
    '  "analysis_confidence": "string"',
    "}",
    "",
    "Guidance:",
    "- Keep the tone concise, professional, and client-ready.",
    "- Mention the largest cost drivers explicitly.",
    "- Mention likely waste findings explicitly.",
    "- Recommendations should be practical and action-oriented.",
    "- Next actions should be concise execution steps.",
    "- The confidence field should explain how dependable the analysis is based on the available schema.",
    "- Return valid JSON only and no markdown.",
    "",
    `Analysis JSON:\n${JSON.stringify(analysis, null, 2)}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You create concise structured FinOps reports for cloud cost optimization. Return JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Groq API request failed.", {
        status: response.status,
        body: await response.text(),
      });
      return fallbackReport;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      return fallbackReport;
    }

    const parsed = JSON.parse(content);
    return validateAiReport(parsed, fallbackReport);
  } catch (error) {
    console.error("Groq report generation failed.", error);
    return fallbackReport;
  }
}
