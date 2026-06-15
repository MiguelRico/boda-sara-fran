import { SkeletonBlock } from "../../ui/TableSectionSkeleton";

const DEFAULT_GRID_CLASS =
  "grid grid-cols-2 gap-2";
const DEFAULT_CARD_CLASS =
  "rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-2.5";

export function AdminMetricGrid({
  items,
  className = DEFAULT_GRID_CLASS,
  cardClassName = DEFAULT_CARD_CLASS,
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div
          className={`min-w-0 ${item.wrapperClassName || ""}`}
          key={item.label}
        >
          <div
            className={`${cardClassName} grid h-full min-h-20 grid-rows-[auto_1fr] gap-2 text-center`}
          >
            <p className="text-center text-xs leading-snug text-[var(--color-muted)]">
              {item.label}
            </p>
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <div className="flex justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
                  {item.icon}
                </div>
              </div>
              <div className="min-w-0 text-center">
                <p className="break-words text-center font-serif text-xl leading-none text-[var(--color-accent-dark)]">
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
          className="grid min-h-20 grid-rows-[auto_1fr] gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-2.5"
          key={index}
        >
          <SkeletonBlock className="mx-auto h-3 w-20 max-w-full rounded-full" />
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex justify-start">
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="mx-auto h-7 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminMetricGroupCard({
  className = "",
  icon,
  items,
  showHeaderIcon = true,
  showHeaderTitle = true,
  title,
}) {
  const hasHeader = (showHeaderIcon && icon) || (showHeaderTitle && title);

  return (
    <article
      className={`rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 ${className}`}
    >
      {hasHeader && (
        <div
          className={`mb-3 grid items-center gap-2 ${
            showHeaderIcon && icon
              ? "grid-cols-[auto_minmax(0,1fr)]"
              : "grid-cols-1"
          }`}
        >
          {showHeaderIcon && icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
              {icon}
            </div>
          )}
          {showHeaderTitle && title && (
            <p className="min-w-0 text-xs leading-snug text-[var(--color-muted)]">
              {title}
            </p>
          )}
        </div>
      )}
      <div className={`grid gap-2 ${getGroupColumnsClass(items.length)}`}>
        {items.map((item) => (
          <div className="min-w-0 text-center" key={item.label}>
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
              {item.icon}
            </div>
            <p className="mt-2 text-[0.66rem] leading-snug text-[var(--color-muted)]">
              {item.label}
            </p>
            <p className="mt-1 break-words font-serif text-lg leading-none text-[var(--color-accent-dark)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function AdminMetricGroupCardSkeleton({
  className = "",
  itemCount = 3,
  showHeader = true,
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 ${className}`}
    >
      {showHeader && (
        <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <SkeletonBlock className="h-3 w-28 max-w-full rounded-full" />
        </div>
      )}
      <div className={`grid gap-2 ${getGroupColumnsClass(itemCount)}`}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <div className="min-w-0 text-center" key={index}>
            <SkeletonBlock className="mx-auto h-8 w-8 rounded-full" />
            <SkeletonBlock className="mx-auto mt-2 h-3 w-16 rounded-full" />
            <SkeletonBlock className="mx-auto mt-2 h-7 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getGroupColumnsClass(count) {
  if (count <= 2) return "grid-cols-2";

  return "grid-cols-3";
}
