import { NextResponse } from "next/server";

import { generateAiReport } from "@/lib/server/ai-report";
import { AnalysisError, analyzeBillingCsv } from "@/lib/server/cost-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status },
  );
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Please select a CSV file to analyze.", 400);
    }

    if (!file.name) {
      return errorResponse("Please select a valid CSV file to analyze.", 400);
    }

    const csvText = await file.text();
    const analysis = analyzeBillingCsv(csvText);
    const aiReport = await generateAiReport(analysis);

    return NextResponse.json({
      success: true,
      analysis,
      ai_report: aiReport,
    });
  } catch (error) {
    if (error instanceof AnalysisError) {
      return errorResponse(error.message, error.statusCode || 400);
    }

    console.error("Upload route failed.", error);
    return errorResponse(
      "The upload analysis could not be completed. Please verify the CSV format and try again.",
      500,
    );
  }
}
