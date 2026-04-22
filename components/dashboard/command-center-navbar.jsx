import { statusConfig } from "@/lib/dashboard-utils";

import { ActionButton, Badge } from "./primitives";
import { ArrowRightIcon, FinopsLogo, SparkIcon, StatusIcon } from "./icons";

const navigationItems = [
  { label: "Overview", sectionId: "overview" },
  { label: "Analyzer", sectionId: "analyzer" },
  { label: "Insights", sectionId: "results", tab: "ai" },
  { label: "Reports", sectionId: "results", tab: "export" },
];

export default function CommandCenterNavbar({ status, onNavigate, onPrimaryAction }) {
  const currentStatus = statusConfig[status];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111b]/85 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
            <FinopsLogo className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-[family:var(--font-display)] text-base tracking-[-0.04em] text-white sm:text-lg">
              AI Cloud Cost Optimization Advisor
            </p>
            <p className="truncate text-xs uppercase tracking-[0.22em] text-slate-500">
              Premium AI FinOps Command Center
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              onClick={() => onNavigate(item.sectionId, item.tab)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Badge className="hidden md:inline-flex" tone="default">
            <SparkIcon className="h-3.5 w-3.5" />
            Dark FinOps
          </Badge>

          <Badge className={currentStatus.tone} tone="default">
            <StatusIcon className="h-3.5 w-3.5" />
            {currentStatus.label}
          </Badge>

          <ActionButton className="hidden sm:inline-flex" onClick={onPrimaryAction} type="button">
            Upload CSV
            <ArrowRightIcon className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>
    </header>
  );
}
