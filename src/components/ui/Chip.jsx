export default function Chip({ icon, strong = false, value }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        strong
          ? "border-[var(--color-border-strong)] bg-white/60 font-medium text-[var(--color-accent-dark)]"
          : "border-[var(--color-border)] bg-white/45 text-[var(--color-muted)]"
      }`}
    >
      {icon && (
        <span className="shrink-0 text-[var(--color-accent-dark)]">
          {icon}
        </span>
      )}
      <span className="truncate">{value}</span>
    </span>
  );
}
