import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  getProviderTone,
} from "@/lib/dashboard-utils";

import { ActionButton, Badge, Panel, PriorityBadge, SectionTitle } from "./primitives";
import {
  CopyIcon,
  DollarIcon,
  DownloadIcon,
  JsonIcon,
  SavingsIcon,
  StatusIcon,
  WarningIcon,
} from "./icons";

const tabs = [
  { id: "summary", label: "Summary" },
  { id: "services", label: "Top Services" },
  { id: "waste", label: "Waste Detection" },
  { id: "ai", label: "AI Insights" },
  { id: "export", label: "Export" },
];

function TabButton({ active, label, onClick }) {
  return (
    <button
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "border border-cyan-400/25 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.16)]"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SummaryTab({ analysis, derived }) {
  return (
    <div className="grid gap-5">
      <Panel className="p-6">
        <SectionTitle
          eyebrow="Executive Summary"
          title="Client-ready analysis briefing"
          description="The summary view is now organized as a polished report with explicit sections for spend, waste, savings, recommendations, and confidence."
          action={<Badge tone="cyan">Report view</Badge>}
        />

        <div className="mt-6 rounded-[28px] border border-cyan-400/20 bg-cyan-400/8 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Executive Summary</p>
          <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-100">
            {derived.aiReport.executiveSummary ||
              "The analysis completed successfully and produced a structured cloud cost review."}
          </p>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Key Findings</p>
                <Badge tone="default">{derived.keyFindings.length} findings</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {derived.keyFindings.map((item, index) => (
                  <article
                    key={`${index}-${item}`}
                    className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                      Finding {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Top Cost Drivers</p>
                <Badge tone="cyan">{derived.aiReport.topCostDrivers.length} drivers</Badge>
              </div>

              <div className="mt-4 rounded-[24px] border border-cyan-400/20 bg-cyan-400/8 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                      Biggest cost driver
                    </p>
                    <p className="mt-2 text-2xl font-[family:var(--font-display)] tracking-[-0.05em] text-white">
                      {derived.topService?.name || "Not available"}
                    </p>
                    <p className="mt-2 text-sm text-cyan-100/90">
                      {derived.topService
                        ? `${formatCurrency(derived.topService.cost)} | ${formatPercent(derived.topService.share)} of measured spend`
                        : "No service-level spend breakdown is available for this run."}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    <DollarIcon className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {derived.aiReport.topCostDrivers.map((item) => (
                  <article
                    key={item}
                    className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <WarningIcon className="h-5 w-5 text-rose-200" />
                  <p className="text-xs uppercase tracking-[0.18em] text-rose-200">Likely Waste</p>
                </div>
                <Badge tone="rose">{formatPercent(derived.wasteRatio)} of spend</Badge>
              </div>

              <p className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.05em] text-white">
                {formatCurrency(derived.wasteCost)}
              </p>
              <div className="mt-4 space-y-3">
                {derived.aiReport.wasteFindings.map((item) => (
                  <article
                    key={item}
                    className="rounded-[20px] border border-rose-400/15 bg-black/20 px-4 py-4"
                  >
                    <p className="text-sm leading-7 text-rose-50/90">{item}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(6,182,212,0.12))] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <SavingsIcon className="h-5 w-5 text-emerald-200" />
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Estimated Savings</p>
                </div>
                <Badge tone="emerald">{formatPercent(derived.savingsRatio)} of spend</Badge>
              </div>

              <p className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.05em] text-white">
                {formatCurrency(derived.estimatedSavings)}
              </p>
              <p className="mt-3 text-sm leading-7 text-emerald-50/85">
                This modeled opportunity combines likely waste recovery with pricing and concentration-based optimization potential.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StatusIcon className="h-5 w-5 text-cyan-200" />
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Analysis Confidence</p>
                </div>
                <Badge className={derived.confidenceMeta.tone} tone="default">
                  {derived.confidenceMeta.label}
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${derived.confidenceMeta.bar}`}
                  style={{ width: `${Math.max(derived.confidence, 8)}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{derived.confidence}/100</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">{derived.aiReport.analysisConfidence}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="p-6">
          <SectionTitle
            eyebrow="Recommendations"
            title="Prioritized optimization actions"
            description="These actions are organized to be presentation-ready while still staying operationally specific."
          />

          <div className="mt-6 space-y-3">
            {derived.aiReport.recommendations.map((text) => {
              const priority = derived.recommendationFeed.find((item) => item.text === text)?.priority || "Low";
              return (
                <article
                  key={`${priority}-${text}`}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-7 text-slate-200">{text}</p>
                    <PriorityBadge priority={priority} />
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-5">
          <Panel className="p-6">
            <SectionTitle
              eyebrow="Risk Warning"
              title="Primary caution for this analysis"
              description="A concise warning panel keeps the report realistic and client-facing."
            />

            <div className="mt-6 rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5">
              <div className="flex items-start gap-3">
                <WarningIcon className="mt-0.5 h-5 w-5 text-rose-200" />
                <p className="text-sm leading-7 text-rose-100">
                  {derived.aiReport.riskWarning ||
                    "No additional risk warning was returned by the reporting layer."}
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <SectionTitle
              eyebrow="Analysis Signals"
              title="Supporting context"
              description="These fields explain why the confidence level and provider mapping look the way they do."
            />

            <div className="mt-6 grid gap-3">
              <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <span className="text-sm font-semibold text-white">Provider detected</span>
                <Badge className={getProviderTone(derived.provider)} tone="default">
                  {derived.provider}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <span className="text-sm font-semibold text-white">Rows processed</span>
                <span className="text-sm text-slate-300">{formatNumber(analysis.row_count)}</span>
              </div>
              {[
                ["Detected cost column", analysis.detected_columns?.cost || "Not detected"],
                ["Detected service column", analysis.detected_columns?.service || "Not detected"],
                ["Detected usage column", analysis.detected_columns?.usage || "Not detected"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <span className="text-sm font-semibold text-white">{label}</span>
                  <span className="text-sm text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function TopServicesTab({ derived }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <Panel className="p-6">
        <SectionTitle
          eyebrow="Top services"
          title="Ranked spend concentration"
          description="The biggest cost drivers are emphasized first so optimization work can start where the impact is highest."
        />

        <div className="mt-6 space-y-4">
          {derived.serviceEntries.map((service) => (
            <article
              key={service.name}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Rank {service.index}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">{service.name}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-lg font-semibold text-cyan-200">
                    {formatCurrency(service.cost)}
                  </p>
                  <p className="text-sm text-slate-400">{formatPercent(service.share)} of total</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400"
                  style={{ width: `${Math.max(service.share, 6)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5">
        <Panel className="p-6">
          <SectionTitle
            eyebrow="Spend concentration"
            title="How concentrated the bill is"
            description="The top services can dominate total spend. High concentration usually means faster optimization wins."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary cost driver</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {derived.topService?.name || "Not available"}
              </p>
              <p className="mt-2 text-sm text-cyan-200">
                {derived.topService ? formatPercent(derived.topService.share) : "0%"} of measured spend
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Modeled savings signal</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {formatCurrency(derived.estimatedSavings)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Based on detected waste plus concentration-driven optimization opportunities.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle
            eyebrow="Distribution preview"
            title="Visual service mix"
            description="A compact comparison of the top cost categories returned by the analyzer."
          />

          <div className="mt-6 flex h-56 items-end gap-3">
            {derived.serviceEntries.map((service) => (
              <div key={service.name} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t-[18px] bg-gradient-to-t from-cyan-500/30 via-sky-400/40 to-cyan-300/80"
                    style={{ height: `${Math.max(service.share, 12)}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {service.index}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{service.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function WasteTab({ derived }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel className="p-6">
        <SectionTitle
          eyebrow="Waste detection"
          title="Idle spend and recovery opportunities"
          description="Waste detection is based on billed rows that still carry cost when recorded usage is zero."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5">
            <div className="flex items-center gap-3">
              <WarningIcon className="h-5 w-5 text-rose-200" />
              <p className="text-xs uppercase tracking-[0.18em] text-rose-200">Likely waste amount</p>
            </div>
            <p className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.05em] text-white">
              {formatCurrency(derived.wasteCost)}
            </p>
            <p className="mt-3 text-sm text-rose-100/85">
              {formatPercent(derived.wasteRatio)} of measured spend was flagged as potential waste.
            </p>
          </div>

          <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="flex items-center gap-3">
              <SavingsIcon className="h-5 w-5 text-amber-200" />
              <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Estimated recoverable value</p>
            </div>
            <p className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.05em] text-white">
              {formatCurrency(derived.estimatedSavings)}
            </p>
            <p className="mt-3 text-sm text-amber-100/85">
              Modeled from idle spend plus optimization potential in concentrated services.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detection method</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{derived.wasteDetectionMethod}</p>
        </div>
      </Panel>

      <div className="grid gap-5">
        <Panel className="p-6">
          <SectionTitle
            eyebrow="Impacted services"
            title="Where waste appears"
            description="Service-level flags are shown when the backend detected zero-usage billed rows."
          />

          <div className="mt-6 space-y-3">
            {derived.wasteEntries.length ? (
              derived.wasteEntries.map((entry) => (
                <article
                  key={entry.name}
                  className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Impacted service</p>
                  </div>
                  <p className="text-sm font-bold text-rose-200">{formatCurrency(entry.cost)}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
                No service-level waste details were returned. If the billing export lacks usage
                quantities, the analyzer falls back to conservative waste guidance.
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle
            eyebrow="Suggested actions"
            title="Recommended next steps"
            description="These actions prioritize the fastest savings and highest confidence operational follow-up."
          />

          <div className="mt-6 space-y-3">
            {derived.recommendationFeed.slice(0, 4).map((item) => (
              <article
                key={item.text}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{item.text}</p>
                  <PriorityBadge priority={item.priority} />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function InsightsTab({ derived }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]" id="insights">
      <Panel className="relative overflow-hidden p-6 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%)]">
        <div className="relative">
          <SectionTitle
            eyebrow="Groq insights"
            title="AI-guided optimization narrative"
            description="This panel is designed to feel like an executive-facing AI briefing rather than a plain text dump."
            action={<Badge tone="cyan">AI-Powered</Badge>}
          />

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/8 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Executive summary</p>
              <p className="mt-3 text-sm leading-7 text-slate-100">
                {derived.aiReport.executiveSummary || "No executive summary was returned."}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Top cost drivers</p>
                <Badge tone="default">{derived.aiReport.topCostDrivers.length} drivers</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {derived.aiReport.topCostDrivers.map((item) => (
                  <article
                    key={item}
                    className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Optimization opportunities
                </p>
                <Badge tone="emerald">{derived.recommendationFeed.length} items</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {derived.aiReport.recommendations.map((text) => {
                  const priority = derived.recommendationFeed.find((item) => item.text === text)?.priority || "Low";
                  return (
                  <article
                    key={`${priority}-${text}`}
                    className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-7 text-slate-200">{text}</p>
                      <PriorityBadge priority={priority} />
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5">
        <Panel className="p-6">
          <SectionTitle
            eyebrow="Risk warning"
            title="Primary caution for this dataset"
            description="A concise warning card helps the result read like a serious product output."
          />

          <div className="mt-6 rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5">
            <div className="flex items-start gap-3">
              <WarningIcon className="mt-0.5 h-5 w-5 text-rose-200" />
              <p className="text-sm leading-7 text-rose-100">
                {derived.aiReport.riskWarning ||
                  "No additional risk warning was returned by the AI layer."}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle
            eyebrow="Next best actions"
            title="Execution shortlist"
            description="These are the immediate follow-up steps surfaced by the reporting layer."
          />

          <div className="mt-6 space-y-3">
            {derived.aiReport.nextActions.map((item) => (
              <article
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300"
              >
                {item}
              </article>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle
            eyebrow="Priority mix"
            title="Recommendation ladder"
            description="Priority badges make the AI guidance easier to act on during review sessions."
          />

          <div className="mt-6 grid gap-3">
            {["High", "Medium", "Low"].map((priority) => {
              const total = derived.recommendationFeed.filter((item) => item.priority === priority).length;
              return (
                <div
                  key={priority}
                  className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={priority} />
                    <span className="text-sm text-slate-300">{priority} priority actions</span>
                  </div>
                  <span className="text-lg font-semibold text-white">{total}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ExportTab({
  derived,
  lastAnalyzedFile,
  onCopyAiSummary,
  onDownloadReport,
  onExportJson,
  copiedSummary,
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]" id="reports">
      <Panel className="p-6">
        <SectionTitle
          eyebrow="Export"
          title="Package the analysis for sharing"
          description="These controls make the dashboard feel closer to a client-ready product instead of a demo surface."
        />

        <div className="mt-6 grid gap-4">
          <ActionButton className="justify-between px-5" onClick={onDownloadReport} type="button">
            <span className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              Download report
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-white/70">TXT</span>
          </ActionButton>

          <ActionButton className="justify-between px-5" onClick={onExportJson} type="button" variant="secondary">
            <span className="flex items-center gap-2">
              <JsonIcon className="h-4 w-4" />
              Export JSON
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-white/70">API</span>
          </ActionButton>

          <ActionButton className="justify-between px-5" onClick={onCopyAiSummary} type="button" variant="secondary">
            <span className="flex items-center gap-2">
              <CopyIcon className="h-4 w-4" />
              Copy AI summary
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-white/70">
              {copiedSummary ? "Copied" : "Clipboard"}
            </span>
          </ActionButton>
        </div>
      </Panel>

      <div className="grid gap-5">
        <Panel className="p-6">
          <SectionTitle
            eyebrow="Report payload"
            title="What gets included"
            description="The export package is structured for stakeholder review and technical follow-up."
          />

          <div className="mt-6 grid gap-3">
            {[
              `Source file: ${lastAnalyzedFile?.name || "Unknown"}`,
              `Provider detected: ${derived.provider}`,
              `Estimated savings: ${formatCurrency(derived.estimatedSavings)}`,
              `Recommendation count: ${derived.recommendationFeed.length}`,
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle
            eyebrow="Output note"
            title="Client-ready delivery"
            description="Reports include metrics, service concentration, waste detection, recommendations, and the AI narrative."
          />

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
            This export layer is intentionally structured like a premium analytics product:
            a readable report download, JSON for integrations, and a one-click AI summary copy
            action for executive updates or proposal notes.
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function WorkspaceTabs({
  result,
  derived,
  activeTab,
  onTabChange,
  onDownloadReport,
  onExportJson,
  onCopyAiSummary,
  copiedSummary,
  lastAnalyzedFile,
}) {
  const analysis = result.analysis;

  return (
    <section className="space-y-5" id="results">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
              Analysis Workspace
            </p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.05em] text-white">
              Review spend signals, waste, and AI recommendations
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </div>
        </div>
      </Panel>

      {activeTab === "summary" ? <SummaryTab analysis={analysis} derived={derived} /> : null}
      {activeTab === "services" ? <TopServicesTab derived={derived} /> : null}
      {activeTab === "waste" ? <WasteTab derived={derived} /> : null}
      {activeTab === "ai" ? <InsightsTab derived={derived} /> : null}
      {activeTab === "export" ? (
        <ExportTab
          copiedSummary={copiedSummary}
          derived={derived}
          lastAnalyzedFile={lastAnalyzedFile}
          onCopyAiSummary={onCopyAiSummary}
          onDownloadReport={onDownloadReport}
          onExportJson={onExportJson}
        />
      ) : null}
    </section>
  );
}
