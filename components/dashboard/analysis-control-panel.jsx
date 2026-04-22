import { SAMPLE_CSV_TEXT, cn, formatNumber, statusConfig } from "@/lib/dashboard-utils";

import { ActionButton, Badge, Panel, SectionTitle } from "./primitives";
import {
  ArrowRightIcon,
  CheckIcon,
  DatabaseIcon,
  DownloadIcon,
  SparkIcon,
  UploadIcon,
} from "./icons";

function UploadStatus({ status, message, selectedFile }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        statusConfig[status].banner,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-current" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{message || statusConfig[status].helper}</p>
          <p className="text-xs text-current/75">
            {selectedFile
              ? `${selectedFile.name} • ${formatNumber(selectedFile.size)} bytes`
              : "Supports CSV billing exports with cost, service, and usage columns."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisControlPanel({
  selectedFile,
  status,
  message,
  isDragging,
  fileInputRef,
  onChooseFile,
  onClearFile,
  onFileChange,
  onSubmit,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDownloadSample,
  lastAnalyzedFile,
}) {
  const selectedName = selectedFile ? `${selectedFile.name} • ${formatNumber(selectedFile.size)} bytes` : "No file staged";

  return (
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" id="analyzer">
      <Panel className="p-5 sm:p-6">
        <SectionTitle
          eyebrow="Analyzer"
          title="Upload billing data and run a FinOps-grade analysis"
          description="Drag in an AWS or Azure billing CSV, validate the schema, and trigger a full AI-assisted cost optimization run."
          action={<Badge tone="cyan">CSV Analyzer</Badge>}
        />

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFileChange}
            ref={fileInputRef}
            type="file"
          />

          <div
            className={cn(
              "relative overflow-hidden rounded-[26px] border border-dashed px-5 py-6 transition",
              isDragging
                ? "border-cyan-300/70 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                : "border-white/15 bg-[linear-gradient(180deg,rgba(13,20,32,0.85),rgba(10,16,26,0.75))]",
            )}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <UploadIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Drag and drop a billing CSV</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Supported cost columns: TotalCost, Cost, PretaxCost, ExtendedCost, Amount
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{selectedName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton onClick={onChooseFile} type="button" variant="secondary">
                  Select file
                </ActionButton>
                <ActionButton
                  disabled={!selectedFile || status === "loading"}
                  type="submit"
                >
                  {status === "loading" ? "Processing..." : "Run analysis"}
                  <ArrowRightIcon className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="default">AWS</Badge>
            <Badge tone="default">Azure</Badge>
            <Badge tone="emerald">Schema matching</Badge>
            <Badge tone="violet">Groq insights</Badge>
            {selectedFile ? (
              <button
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-white"
                onClick={onClearFile}
                type="button"
              >
                Clear selection
              </button>
            ) : null}
          </div>

          <UploadStatus message={message} selectedFile={selectedFile} status={status} />
        </form>
      </Panel>

      <div className="grid gap-5">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
                Sample Guidance
              </p>
              <h3 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.04em] text-white">
                Prepare a clean billing extract
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-200">
              <DatabaseIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <pre className="overflow-auto text-xs leading-6 text-slate-400">{SAMPLE_CSV_TEXT}</pre>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton onClick={onDownloadSample} type="button" variant="secondary">
              <DownloadIcon className="h-4 w-4" />
              Download sample CSV
            </ActionButton>
            <Badge tone="amber">Header trimming enabled</Badge>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
                Run Readiness
              </p>
              <h3 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.04em] text-white">
                Command center notes
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-emerald-200">
              <SparkIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Last completed run
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {lastAnalyzedFile?.name || "No completed analysis yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/8 p-4">
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 text-emerald-200" />
                <p className="text-sm leading-6 text-emerald-100">
                  Upload workflows keep the existing FastAPI, pandas, and Groq pipeline intact.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}
