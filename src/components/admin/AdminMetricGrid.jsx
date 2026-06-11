import { SkeletonBlock } from "../ui/TableSectionSkeleton";

const DEFAULT_GRID_CLASS =
  "grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6";
const DEFAULT_CARD_CLASS =
  "rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-2.5 sm:p-5";

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
            className={`${cardClassName} grid h-full min-h-20 grid-rows-[auto_1fr] gap-2 text-center sm:min-h-24 sm:gap-3`}
          >
            <p className="text-center text-xs leading-snug text-[var(--color-muted)] sm:truncate sm:uppercase sm:tracking-[0.16em]">
              {item.label}
            </p>
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-2">
              <div className="flex justify-start sm:justify-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)] sm:h-10 sm:w-10">
                  {item.emoji}
                </div>
              </div>
              <div className="min-w-0 text-center">
                <p className="break-words text-center font-serif text-xl leading-none text-[var(--color-accent-dark)] sm:text-3xl">
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
          className="grid min-h-20 grid-rows-[auto_1fr] gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-2.5 sm:min-h-24 sm:gap-3 sm:p-5"
          key={index}
        >
          <SkeletonBlock className="mx-auto h-3 w-20 max-w-full rounded-full" />
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-2">
            <div className="flex justify-start sm:justify-center">
              <SkeletonBlock className="h-8 w-8 rounded-full sm:h-10 sm:w-10" />
            </div>
            <SkeletonBlock className="mx-auto h-7 w-10 rounded-full sm:h-10 sm:w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
