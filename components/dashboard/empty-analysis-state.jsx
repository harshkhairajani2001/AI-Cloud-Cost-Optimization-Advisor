import { formatCurrency } from "@/lib/dashboard-utils";

import { ActionButton, Badge, Panel } from "./primitives";
import { ArrowRightIcon, BarsIcon, SavingsIcon, SparkIcon, WarningIcon } from "./icons";

export default function EmptyAnalysisState({ onPrimaryAction, onDownloadSample }) {
  const previewServices = [
    { name: "Amazon EC2", cost: 245.82, width: "100%" },
    { name: "Azure Virtual Machines", cost: 180.22, width: "73%" },
    { name: "Amazon S3", cost: 39.14, width: "16%" },
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]" id="results">
      <Panel className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
              Workspace Preview
            </p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.05em] text-white">
              The analysis workspace activates after the first CSV run
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Upload a billing export to unlock service concentration analysis, waste detection,
              schema confidence, and Groq-powered optimization guidance.
            </p>
          </div>
          <div className="flex gap-3">
            <ActionButton onClick={onPrimaryAction} type="button">
              Upload CSV
              <ArrowRightIcon className="h-4 w-4" />
            </ActionButton>
            <ActionButton onClick={onDownloadSample} type="button" variant="secondary">
              Sample CSV
            </ActionButton>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Sample service spend snapshot</h3>
              <Badge tone="cyan">Preview</Badge>
            </div>

            <div className="mt-5 space-y-4">
              {previewServices.map((service, index) => (
                <article key={service.name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Driver {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{service.name}</p>
                    </div>
                    <p className="text-sm font-bold text-cyan-200">{formatCurrency(service.cost)}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400" style={{ width: service.width }} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  <SavingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Modeled savings</p>
                  <p className="text-2xl font-[family:var(--font-display)] tracking-[-0.04em] text-white">
                    Ready after upload
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-200">
                  <WarningIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Anomaly alerts</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Waste and concentration flags will appear here once usage-aware rows are detected.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <SparkIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">AI guidance</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Executive summaries, optimization opportunities, and risk warnings will be structured here.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-200">
                  <BarsIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">FinOps quality note</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Schema confidence, provider detection, and recommended actions appear after parsing.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </Panel>
    </section>
  );
}
