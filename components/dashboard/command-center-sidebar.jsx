import { formatTimestamp, getProviderTone, statusConfig } from "@/lib/dashboard-utils";

import { Badge, Panel } from "./primitives";
import {
  GridIcon,
  ReportIcon,
  SettingsIcon,
  SparkIcon,
  StatusIcon,
  UploadIcon,
} from "./icons";

const sidebarItems = [
  { label: "Overview", sectionId: "overview", icon: GridIcon },
  { label: "Upload", sectionId: "analyzer", icon: UploadIcon },
  { label: "Results", sectionId: "results", tab: "summary", icon: StatusIcon },
  { label: "Recommendations", sectionId: "results", tab: "ai", icon: SparkIcon },
  { label: "Export", sectionId: "results", tab: "export", icon: ReportIcon },
  { label: "Settings", sectionId: "analyzer", icon: SettingsIcon },
];

export default function CommandCenterSidebar({
  status,
  derived,
  lastAnalyzedFile,
  onNavigate,
}) {
  return (
    <aside className="sticky top-[88px] hidden h-[calc(100vh-104px)] xl:block xl:w-72">
      <div className="flex h-full flex-col gap-4">
        <Panel className="p-4">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              Command Rail
            </p>
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                    onClick={() => onNavigate(item.sectionId, item.tab)}
                    type="button"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-200">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel className="space-y-4 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              Run Status
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {statusConfig[status].helper}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Last analyzed file
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {lastAnalyzedFile?.name || "No completed analysis"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatTimestamp(lastAnalyzedFile?.timestamp)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Provider signal
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={getProviderTone(derived?.provider || "Undetermined")} tone="default">
                  {derived?.provider || "Undetermined"}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Confidence
              </p>
              <p className="mt-2 text-2xl font-[family:var(--font-display)] tracking-[-0.04em] text-white">
                {derived?.confidence ? `${derived.confidence}/100` : "Waiting"}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </aside>
  );
}
