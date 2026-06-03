export default function InfoLine({ icon, label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white/40 p-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-[var(--color-accent)]">
        {icon && (
          <span className="shrink-0 text-[var(--color-accent-dark)]">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </span>
      <span className="text-right text-[var(--color-accent-dark)]">
        {value}
      </span>
    </div>
  );
}
