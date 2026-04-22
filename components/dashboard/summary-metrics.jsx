import {
  formatCurrency,
  formatNumber,
  getProviderTone,
} from "@/lib/dashboard-utils";

import { Badge, Panel } from "./primitives";
import {
  CloudIcon,
  DollarIcon,
  SavingsIcon,
  SparkIcon,
  WarningIcon,
} from "./icons";

const metricStyles = [
  {
    label: "Total Cost",
    accent: "from-slate-400/15 to-white/5",
    icon: DollarIcon,
    helper: "Measured positive-cost spend",
  },
  {
    label: "Waste Cost",
    accent: "from-rose-400/15 to-transparent",
    icon: WarningIcon,
    helper: "Zero-usage billed rows",
  },
  {
    label: "Estimated Savings",
    accent: "from-emerald-400/18 to-cyan-400/8",
    icon: SavingsIcon,
    helper: "Modeled opportunity",
  },
  {
    label: "Top Services Count",
    accent: "from-violet-400/15 to-transparent",
    icon: SparkIcon,
    helper: "Largest visible cost drivers",
  },
  {
    label: "Provider Detected",
    accent: "from-cyan-400/15 to-transparent",
    icon: CloudIcon,
    helper: "Detected from billing signals",
  },
];

export default function SummaryMetrics({ analysis, derived }) {
  const values = [
    formatCurrency(analysis.total_cost),
    formatCurrency(analysis.waste_cost),
    formatCurrency(analysis.estimated_savings || derived.estimatedSavings),
    formatNumber(Object.keys(analysis.top_services || {}).length),
    derived.provider,
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metricStyles.map((item, index) => {
        const Icon = item.icon;
        return (
          <Panel
            key={item.label}
            className={`relative overflow-hidden p-5 before:absolute before:inset-0 before:bg-gradient-to-br ${item.accent}`}
          >
            <div className="relative flex h-full flex-col justify-between gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <strong className="mt-3 block font-[family:var(--font-display)] text-3xl tracking-[-0.05em] text-white">
                    {values[index]}
                  </strong>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">{item.helper}</p>
                {item.label === "Provider Detected" ? (
                  <Badge className={getProviderTone(derived.provider)} tone="default">
                    {derived.provider}
                  </Badge>
                ) : null}
              </div>
            </div>
          </Panel>
        );
      })}
    </section>
  );
}
