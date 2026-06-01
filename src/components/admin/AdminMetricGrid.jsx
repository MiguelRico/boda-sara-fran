import AnimatedInfoCard from "../ui/AnimatedInfoCard";

const DEFAULT_GRID_CLASS =
  "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
const DEFAULT_CARD_CLASS =
  "rounded-[1.5rem] border-[var(--color-border)] bg-white/45 p-4 sm:p-5";

export function AdminMetricGrid({
  items,
  className = DEFAULT_GRID_CLASS,
  cardClassName = DEFAULT_CARD_CLASS,
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <AnimatedInfoCard
          card={{
            className: cardClassName,
            description: item.detail,
            emoji: item.emoji,
            inlineTitleDescription: true,
            showAction: false,
            subtitle: item.label,
            title: String(item.value),
          }}
          index={index}
          key={item.label}
        />
      ))}
    </div>
  );
}

export function AdminMetricGridSkeleton({
  count = 6,
  className = DEFAULT_GRID_CLASS,
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="min-h-48 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5"
          key={index}
        >
          <div className="h-11 w-11 rounded-full bg-[var(--color-border)]" />
          <div className="mt-8 h-4 w-24 rounded-full bg-[var(--color-border)]" />
          <div className="mt-4 h-12 w-20 rounded-full bg-[var(--color-border)]" />
        </div>
      ))}
    </div>
  );
}
