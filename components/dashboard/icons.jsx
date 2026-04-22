function IconBase({ children, className = "h-5 w-5", strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
        {children}
      </g>
    </svg>
  );
}

export function FinopsLogo(props) {
  return (
    <IconBase {...props}>
      <path d="M4 14c2.5-5.333 5.667-8 9.5-8 3.334 0 5.834 1.5 7.5 4.5" />
      <path d="M4.5 17.5h6l2-4 2.5 5 1.5-3H21" />
      <circle cx="12" cy="12" r="9" />
    </IconBase>
  );
}

export function GridIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </IconBase>
  );
}

export function UploadIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 16V7" />
      <path d="m8.5 10.5 3.5-3.5 3.5 3.5" />
      <path d="M5 18.5h14" />
      <path d="M6 20h12" />
    </IconBase>
  );
}

export function SparkIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.7 4.8L18.5 9l-4.8 1.2L12 15l-1.7-4.8L5.5 9l4.8-1.2L12 3Z" />
      <path d="m19 15 .7 2 .8.2-.8.2L19 19l-.7-1.6-.8-.2.8-.2.7-2Z" />
      <path d="m6 15 .9 2.4 2.6.7-2.6.7L6 21l-.9-2.2-2.6-.7 2.6-.7L6 15Z" />
    </IconBase>
  );
}

export function ReportIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M8 4h8l4 4v12H8z" />
      <path d="M16 4v4h4" />
      <path d="M11 13h6" />
      <path d="M11 17h4" />
    </IconBase>
  );
}

export function StatusIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 12h3l2-5 3 10 2-5h2" />
      <path d="M4 12a8 8 0 1 1 16 0" />
    </IconBase>
  );
}

export function ArrowRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function CloudIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7.5 18.5H16a4 4 0 1 0-.8-7.9A5.5 5.5 0 0 0 5 13.5a3.5 3.5 0 0 0 2.5 5Z" />
    </IconBase>
  );
}

export function ShieldIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3c2.7 2 5.7 3 9 3 0 8.5-3.7 12.9-9 15-5.3-2.1-9-6.5-9-15 3.3 0 6.3-1 9-3Z" />
      <path d="m9.5 12 1.7 1.7 3.8-4.2" />
    </IconBase>
  );
}

export function DatabaseIcon(props) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </IconBase>
  );
}

export function DollarIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18" />
      <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.3 2.5 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
    </IconBase>
  );
}

export function SavingsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 14c0-5.5 3.6-9 8-9 3.7 0 6.7 2.5 7.7 6" />
      <path d="M20 10v5h-5" />
      <path d="M12 10v6" />
      <path d="M9.5 13h5" />
    </IconBase>
  );
}

export function WarningIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

export function CopyIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </IconBase>
  );
}

export function DownloadIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </IconBase>
  );
}

export function JsonIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 5c-2 1-3 3.5-3 7s1 6 3 7" />
      <path d="M15 5c2 1 3 3.5 3 7s-1 6-3 7" />
      <path d="M11 8.5 9.5 12l1.5 3.5" />
      <path d="M13 8.5 14.5 12 13 15.5" />
    </IconBase>
  );
}

export function CheckIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m6.5 12.5 3.5 3.5 7-7" />
      <circle cx="12" cy="12" r="9" />
    </IconBase>
  );
}

export function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5Z" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.6.1-1Z" />
    </IconBase>
  );
}

export function BarsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </IconBase>
  );
}
