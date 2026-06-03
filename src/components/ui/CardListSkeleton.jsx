export default function CardListSkeleton({
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
