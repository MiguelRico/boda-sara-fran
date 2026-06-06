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
            className={`${cardClassName} grid h-full min-h-24 grid-rows-[auto_1fr] gap-3 text-center`}
          >
            <p className="text-center text-xs leading-snug text-[var(--color-muted)] sm:truncate sm:uppercase sm:tracking-[0.16em]">
              {item.label}
            </p>
            <div className="grid min-w-0 grid-cols-2 items-center gap-2">
              <div className="flex justify-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
                  {item.emoji}
                </div>
              </div>
              <div className="min-w-0 text-center">
                <p className="break-words text-center font-serif text-2xl leading-none text-[var(--color-accent-dark)] sm:text-3xl">
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
          className="grid min-h-24 animate-pulse grid-rows-[auto_1fr] gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 sm:p-5"
          key={index}
        >
          <div className="mx-auto h-3 w-20 max-w-full rounded-full bg-[var(--color-border)]" />
          <div className="grid grid-cols-2 items-center gap-2">
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-[var(--color-border)]" />
            </div>
            <div className="mx-auto h-8 w-12 rounded-full bg-[var(--color-border)] sm:h-10 sm:w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
