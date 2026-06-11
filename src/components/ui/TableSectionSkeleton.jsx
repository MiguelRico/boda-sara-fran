export default function TableSectionSkeleton({
  actions = true,
  cardCount = 4,
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
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {count && (
            <SkeletonBlock className="h-4 w-56 max-w-full rounded-full" />
          )}

          {actions && <TableActionsSkeleton />}
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

export function TableActionsSkeleton() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <div className="grid w-full grid-cols-4 gap-3 sm:w-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-11 min-w-0 rounded-full" key={index} />
        ))}
      </div>
    </div>
  );
}

export function TableFiltersSkeleton() {
  return (
    <div className="my-4 rounded-[1rem] border border-[var(--color-border)] bg-white/45 p-2.5">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-5 w-32 rounded-full" />
        <SkeletonBlock className="h-5 w-9 rounded-full" />
      </div>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <SkeletonBlock className="mb-2 h-3 w-24 rounded-full" />
          <SkeletonBlock className="h-12 rounded-[1rem]" />
        </div>
        <div>
          <SkeletonBlock className="mb-2 h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-12 rounded-[1rem]" />
        </div>
      </div>
    </div>
  );
}

export function TablePaginationSkeleton() {
  return (
    <div className="mb-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <div className="grid grid-cols-3 items-center gap-3 sm:w-auto sm:max-w-md">
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
          className={`${itemClassName} rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5`}
          key={index}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="mt-2 h-7 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonBlock className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: lines }).map((__, lineIndex) => (
              <SkeletonBlock
                className="h-3 w-64 max-w-full rounded-full"
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
