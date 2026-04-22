"use client";

import { useRef, useState } from "react";

import AnalysisControlPanel from "@/components/dashboard/analysis-control-panel";
import CommandCenterNavbar from "@/components/dashboard/command-center-navbar";
import CommandCenterSidebar from "@/components/dashboard/command-center-sidebar";
import EmptyAnalysisState from "@/components/dashboard/empty-analysis-state";
import SummaryMetrics from "@/components/dashboard/summary-metrics";
import WorkspaceTabs from "@/components/dashboard/workspace-tabs";
import { ActionButton, Badge, Panel } from "@/components/dashboard/primitives";
import {
  BarsIcon,
  CloudIcon,
  SavingsIcon,
  SparkIcon,
  StatusIcon,
  WarningIcon,
} from "@/components/dashboard/icons";
import {
  SAMPLE_CSV_TEXT,
  buildReportText,
  deriveAnalysisModel,
  formatCurrency,
  formatTimestamp,
  getProviderTone,
  statusConfig,
} from "@/lib/dashboard-utils";

function downloadBrowserFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "unknown";
  const responseText = await response.text();

  if (!responseText) {
    console.error("Upload API returned an empty response.", {
      status: response.status,
      contentType,
    });
    return {
      success: false,
      error: `The analysis service returned an empty ${response.status} response.`,
    };
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    const preview = responseText.slice(0, 400);
    const looksLikeHtml = /<!doctype html>|<html[\s>]/i.test(responseText);

    console.error("Upload API returned a non-JSON response.", {
      error,
      status: response.status,
      contentType,
      bodyPreview: preview,
    });

    return {
      success: false,
      error:
        looksLikeHtml
          ? "The upload endpoint did not return JSON. Confirm the deployed app includes the `/api/upload` route and try again."
          : response.status >= 500
            ? "The upload service returned unreadable server output. Please try again in a moment."
            : "The analysis request failed and the server response could not be read. Please retry the upload.",
    };
  }
}

function LoadingWorkspace() {
  return (
    <section className="grid gap-5" id="results">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
        <div className="grid gap-5">
          <div className="h-[200px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
          <div className="h-[200px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </section>
  );
}

export default function UploadDashboard() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState(statusConfig.idle.helper);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [lastAnalyzedFile, setLastAnalyzedFile] = useState(null);

  const uploadUrl = "/api/upload";
  const derived = deriveAnalysisModel(result);

  function scrollToSection(sectionId, tab) {
    if (tab) {
      setActiveTab(tab);
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handlePrimaryUploadAction() {
    scrollToSection("analyzer");
    fileInputRef.current?.click();
  }

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleSelectedFile(file) {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setStatus("idle");
    setMessage(`File staged for analysis: ${file.name}`);
  }

  function handleFileChange(event) {
    handleSelectedFile(event.target.files?.[0] || null);
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setStatus("idle");
    setMessage(statusConfig.idle.helper);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus("error");
      setMessage("Select a CSV file before running the analysis.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setCopiedSummary(false);
    setResult(null);
    setActiveTab("summary");
    setStatus("loading");
    setMessage("Parsing billing rows, modeling savings, and generating AI recommendations.");

    try {
      console.info("Submitting billing CSV for analysis.", {
        uploadUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || "unknown",
      });

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const payload = await readJsonResponse(response);

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || "The analysis request failed. Please verify the CSV file and try again.",
        );
      }

      setResult(payload);
      setStatus("success");
      setMessage("Analysis complete. Review the workspace tabs for spend, waste, and AI signals.");
      setLastAnalyzedFile({
        name: selectedFile.name,
        timestamp: new Date(),
      });

      window.requestAnimationFrame(() => {
        scrollToSection("results", "summary");
      });
    } catch (error) {
      console.error("Upload analysis failed:", error);
      setStatus("error");
      if (error instanceof TypeError) {
        setMessage("Could not reach the upload service. Please try again in a moment.");
      } else {
        setMessage(error.message || statusConfig.error.helper);
      }
    }
  }

  function handleDownloadSample() {
    downloadBrowserFile("sample-cloud-billing.csv", SAMPLE_CSV_TEXT, "text/csv;charset=utf-8");
  }

  function handleExportJson() {
    if (!result) {
      return;
    }

    downloadBrowserFile(
      "ai-cloud-cost-analysis.json",
      JSON.stringify(result, null, 2),
      "application/json;charset=utf-8",
    );
  }

  function handleDownloadReport() {
    if (!result || !derived) {
      return;
    }

    const report = buildReportText(result, derived, lastAnalyzedFile);
    downloadBrowserFile("ai-finops-report.txt", report, "text/plain;charset=utf-8");
  }

  async function handleCopyAiSummary() {
    if (!derived?.aiReport) {
      return;
    }

    try {
      const summaryText = [
        "Executive Summary:",
        derived.aiReport.executiveSummary,
        "",
        "Recommendations:",
        ...derived.aiReport.recommendations.map((item) => `- ${item}`),
        "",
        "Risk Warning:",
        derived.aiReport.riskWarning,
      ].join("\n");

      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 2200);
    } catch {
      setCopiedSummary(false);
    }
  }

  const anomalyCopy = derived
    ? derived.wasteCost > 0
      ? `${formatCurrency(derived.wasteCost)} flagged as likely waste`
      : "No direct zero-usage waste was flagged"
    : "Waiting for a completed billing run";

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <CommandCenterNavbar
        onNavigate={scrollToSection}
        onPrimaryAction={handlePrimaryUploadAction}
        status={status}
      />

      <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[18rem_minmax(0,1fr)] xl:px-8">
        <CommandCenterSidebar
          derived={derived}
          lastAnalyzedFile={lastAnalyzedFile}
          onNavigate={scrollToSection}
          status={status}
        />

        <main className="space-y-6">
          <section id="overview">
            <Panel className="relative overflow-hidden p-6 sm:p-7">
              <div className="absolute -right-14 top-0 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute left-0 top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cyan">AI-Powered</Badge>
                    <Badge tone="emerald">FinOps Signals</Badge>
                    <Badge tone="default">CSV Analyzer</Badge>
                    <Badge tone="default">AWS / Azure</Badge>
                  </div>

                  <h1 className="mt-5 font-[family:var(--font-display)] text-4xl leading-none tracking-[-0.06em] text-white sm:text-5xl xl:text-6xl">
                    Premium AI FinOps command center for cloud cost diagnostics
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">
                    Upload billing exports, surface waste, rank cost drivers, and turn raw CSV
                    data into client-ready optimization guidance without leaving a focused analysis workspace.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <ActionButton onClick={handlePrimaryUploadAction} type="button">
                      Upload CSV
                    </ActionButton>
                    <ActionButton
                      onClick={() => scrollToSection(result ? "results" : "analyzer", result ? "ai" : undefined)}
                      type="button"
                      variant="secondary"
                    >
                      {result ? "Open AI insights" : "Open analyzer"}
                    </ActionButton>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Panel className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                        <CloudIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Provider coverage</p>
                        <p className="mt-1 text-lg font-semibold text-white">AWS + Azure billing exports</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="default">AWS</Badge>
                      <Badge tone="default">Azure</Badge>
                      {derived ? (
                        <Badge className={getProviderTone(derived.provider)} tone="default">
                          {derived.provider}
                        </Badge>
                      ) : null}
                    </div>
                  </Panel>

                  <Panel className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                        <SavingsIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Savings opportunity</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {derived ? formatCurrency(derived.estimatedSavings) : "Ready after upload"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">
                      Conservative modeled savings based on waste and concentrated service optimization signals.
                    </p>
                  </Panel>

                  <Panel className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-200">
                        <WarningIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Anomaly alert</p>
                        <p className="mt-1 text-lg font-semibold text-white">Waste monitor</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{anomalyCopy}</p>
                  </Panel>

                  <Panel className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200">
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Last run</p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {lastAnalyzedFile?.name || "No completed run"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">
                      {formatTimestamp(lastAnalyzedFile?.timestamp)}
                    </p>
                  </Panel>
                </div>
              </div>
            </Panel>
          </section>

          <AnalysisControlPanel
            fileInputRef={fileInputRef}
            isDragging={isDragging}
            lastAnalyzedFile={lastAnalyzedFile}
            message={message}
            onChooseFile={handleChooseFile}
            onClearFile={clearSelectedFile}
            onDownloadSample={handleDownloadSample}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            selectedFile={selectedFile}
            status={status}
          />

          {status === "loading" ? <LoadingWorkspace /> : null}

          {derived ? (
            <>
              <SummaryMetrics analysis={result.analysis} derived={derived} />
              <WorkspaceTabs
                activeTab={activeTab}
                copiedSummary={copiedSummary}
                derived={derived}
                lastAnalyzedFile={lastAnalyzedFile}
                onCopyAiSummary={handleCopyAiSummary}
                onDownloadReport={handleDownloadReport}
                onExportJson={handleExportJson}
                onTabChange={setActiveTab}
                result={result}
              />
            </>
          ) : null}

          {!derived && status !== "loading" ? (
            <EmptyAnalysisState
              onDownloadSample={handleDownloadSample}
              onPrimaryAction={handlePrimaryUploadAction}
            />
          ) : null}

          <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
                    Product Notes
                  </p>
                  <h2 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.05em] text-white">
                    Why this experience feels more like a product
                  </h2>
                </div>
                <Badge tone="violet">Client-ready UI</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: BarsIcon,
                    title: "Tab-driven workspace",
                    copy: "Summary, services, waste, AI, and export views feel like a real analytics surface.",
                  },
                  {
                    icon: SparkIcon,
                    title: "AI guidance hierarchy",
                    copy: "Recommendations are prioritized and visually separated from raw metrics.",
                  },
                  {
                    icon: CloudIcon,
                    title: "FinOps context signals",
                    copy: "Provider detection, confidence, and modeled savings are surfaced as first-class outputs.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-400">{item.copy}</p>
                    </article>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
                    Sample Guidance
                  </p>
                  <h2 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.05em] text-white">
                    Billing sample reference
                  </h2>
                </div>
                <Badge tone="amber">Quick helper</Badge>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
                <pre className="overflow-auto text-xs leading-6 text-slate-400">{SAMPLE_CSV_TEXT}</pre>
              </div>
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
}
