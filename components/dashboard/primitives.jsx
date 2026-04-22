import { cn } from "@/lib/dashboard-utils";

const badgeTones = {
  default: "border-white/10 bg-white/[0.04] text-slate-200",
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-200",
};

const priorityTones = {
  High: "border-rose-400/25 bg-rose-400/12 text-rose-200",
  Medium: "border-amber-400/25 bg-amber-400/12 text-amber-200",
  Low: "border-cyan-400/25 bg-cyan-400/12 text-cyan-200",
};

export function Panel({ children, className }) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,28,0.98),rgba(9,15,24,0.9))] shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Badge({ children, className, tone = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]",
        badgeTones[tone] || badgeTones.default,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        priorityTones[priority] || priorityTones.Low,
      )}
    >
      {priority}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.05em] text-white sm:text-[2rem]">
          {title}
        </h2>
        {description ? <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ActionButton({
  children,
  className,
  variant = "primary",
  ...props
}) {
  const variantClasses = {
    primary:
      "border border-cyan-400/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(14,165,233,0.24))] text-white shadow-[0_18px_45px_rgba(14,165,233,0.18)] hover:border-cyan-300/40 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.24),rgba(14,165,233,0.3))]",
    secondary:
      "border border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]",
    ghost:
      "border border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04]",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
