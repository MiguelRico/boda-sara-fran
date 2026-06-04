export default function Chip({
  className = "",
  icon,
  strong = false,
  value,
  valueClassName = "truncate",
}) {
  return (
    <span
      className={`flex w-full max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        strong
          ? "border-[var(--color-border-strong)] bg-white/60 font-medium text-[var(--color-accent-dark)]"
          : "border-[var(--color-border)] bg-white/45 text-[var(--color-muted)]"
      } ${className}`}
    >
      {icon && (
        <span className="shrink-0 text-[var(--color-accent-dark)]">
          {icon}
        </span>
      )}
      <span className={valueClassName}>{value}</span>
    </span>
  );
}
