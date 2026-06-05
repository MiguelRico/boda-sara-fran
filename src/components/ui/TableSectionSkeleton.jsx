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
            <div className="h-4 w-56 max-w-full animate-pulse rounded-full bg-[var(--color-border)]" />
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
          <div
            className="h-11 min-w-0 animate-pulse rounded-full bg-[var(--color-border)]"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export function TableFiltersSkeleton() {
  return (
    <div className="my-5 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-32 rounded-full bg-[var(--color-border)]" />
        <div className="h-10 w-10 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <div className="mb-2 h-3 w-24 rounded-full bg-[var(--color-border)]" />
          <div className="h-12 rounded-[1rem] bg-[var(--color-border)]" />
        </div>
        <div>
          <div className="mb-2 h-3 w-20 rounded-full bg-[var(--color-border)]" />
          <div className="h-12 rounded-[1rem] bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}

export function TablePaginationSkeleton() {
  return (
    <div className="mb-4 grid animate-pulse grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
      <div className="h-11 rounded-full bg-[var(--color-border)]" />
      <div className="h-11 rounded-full bg-[var(--color-border)]" />
      <div className="h-11 rounded-full bg-[var(--color-border)]" />
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
          className={`${itemClassName} animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5`}
          key={index}
        >
          <div className="h-4 w-40 rounded-full bg-[var(--color-border)]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: lines }).map((__, lineIndex) => (
              <div
                className="h-3 w-64 max-w-full rounded-full bg-[var(--color-border)]"
                key={lineIndex}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
