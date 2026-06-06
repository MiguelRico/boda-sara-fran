const DEFAULT_GRID_CLASS =
  "grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6";
const DEFAULT_CARD_CLASS =
  "rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 sm:p-5";

export function AdminMetricGrid({
  items,
  className = DEFAULT_GRID_CLASS,
  cardClassName = DEFAULT_CARD_CLASS,
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div className="min-w-0" key={item.label}>
          <div
            className={`${cardClassName} grid h-full min-h-24 grid-cols-[auto_minmax(0,1fr)] items-center gap-3`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
              {item.emoji}
            </div>
            <div className="min-w-0 text-center">
              <p className="hidden text-center text-xs uppercase tracking-[0.16em] text-[var(--color-muted)] sm:block">
                {item.label}
              </p>
              <p className="mt-1 break-words text-center font-serif text-2xl leading-none text-[var(--color-accent-dark)] sm:text-3xl">
                {item.value}
              </p>
              {item.detail && (
                <p className="mt-1 text-center text-xs leading-snug text-[var(--color-muted)]">
                  {item.detail}
                </p>
              )}
          </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminMetricGridSkeleton({
  count = 3,
  className = DEFAULT_GRID_CLASS,
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="min-h-24 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-2 sm:min-h-48 sm:p-5"
          key={index}
        >
          <div className="h-8 w-8 rounded-full bg-[var(--color-border)] sm:h-11 sm:w-11" />
          <div className="mt-4 h-3 w-full rounded-full bg-[var(--color-border)] sm:mt-8 sm:h-4 sm:w-24" />
          <div className="mt-3 h-8 w-12 rounded-full bg-[var(--color-border)] sm:mt-4 sm:h-12 sm:w-20" />
        </div>
      ))}
    </div>
  );
}
