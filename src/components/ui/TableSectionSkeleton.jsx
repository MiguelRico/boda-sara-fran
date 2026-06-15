export default function TableSectionSkeleton({
  actions = true,
  actionCount = 3,
  cardCount = 1,
  columnsClassName = "",
  count = true,
  filters = false,
  itemClassName = "min-h-24",
  lines = 2,
  pagination = true,
}) {
  return (
    <>
      {(count || actions) && (
        <div className="mt-4 flex flex-col gap-3">
          {count && (
            <SkeletonBlock className="h-4 w-56 max-w-full rounded-full" />
          )}

          {actions && <TableActionsSkeleton count={actionCount} />}
        </div>
      )}

      {filters && <TableFiltersSkeleton />}

      {pagination && <TablePaginationSkeleton />}

      <TableCardsSkeleton
        columnsClassName={columnsClassName}
        count={cardCount}
        itemClassName={itemClassName}
        lines={lines}
      />
    </>
  );
}

export function TableActionsSkeleton({ count = 3 }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <div
        className="grid w-full gap-3"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonBlock className="h-11 min-w-0 rounded-full" key={index} />
        ))}
      </div>
    </div>
  );
}

export function TableFiltersSkeleton() {
  return (
    <div className="my-4 rounded-[1rem] border border-[var(--color-border)] bg-white/45 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <SkeletonBlock className="h-5 w-32 rounded-full" />
        <SkeletonBlock className="h-[1.125rem] w-8 rounded-full" />
      </div>
    </div>
  );
}

export function TablePaginationSkeleton() {
  return (
    <div className="mb-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <div className="grid grid-cols-3 items-center gap-3">
        <SkeletonBlock className="h-11 rounded-full" />
        <SkeletonBlock className="h-5 rounded-full" />
        <SkeletonBlock className="h-11 rounded-full" />
      </div>
    </div>
  );
}

export function TableCardsSkeleton({
  columnsClassName = "",
  count = 4,
  itemClassName = "min-h-24",
  lines = 2,
}) {
  return (
    <div className={`grid gap-4 ${columnsClassName}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          className={`${itemClassName} relative overflow-hidden rounded-[2rem] border border-[var(--color-border-strong)] bg-white/55 p-5 shadow-[0_24px_70px_rgba(77,56,40,0.08)]`}
          key={index}
        >
          <SkeletonBlock className="absolute right-6 top-6 h-14 w-14 rounded-full opacity-50" />
          <div className="absolute right-5 top-4 z-10 grid grid-cols-2 gap-2">
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-9 w-9 rounded-full" />
          </div>
          <div className="relative">
            <SkeletonBlock className="mt-4 h-3 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-44 max-w-[70%] rounded-full" />
          </div>
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: Math.max(lines, 2) }).map((_, lineIndex) => (
              <SkeletonBlock
                className={`h-9 rounded-full ${
                  lineIndex > 1 ? "col-span-2" : ""
                }`}
                key={lineIndex}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[var(--color-border)] ${className}`}
    />
  );
}
