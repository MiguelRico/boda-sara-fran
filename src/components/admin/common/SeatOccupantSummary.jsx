import { ArrowLeftRight } from "lucide-react";

import { uiContent } from "../../../constants/uiContent";

export default function SeatOccupantSummary({
  description = "",
  guestName,
  items = [],
  seat,
  title = "",
}) {
  const hasItems = items.length > 0;
  const showSwapLayout = items.length === 2;

  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4 text-center">
      {title && (
        <p className="section-eyebrow mb-2">
          {seat && title === uiContent.seat.label
            ? `${title} ${seat}`
            : title}
        </p>
      )}

      {hasItems ? (
        <div
          className={
            showSwapLayout
              ? "grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-2"
              : "grid gap-2"
          }
        >
          <SummaryItem item={items[0]} />
          {showSwapLayout && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/60 text-[var(--color-accent-dark)]">
              <ArrowLeftRight size={14} strokeWidth={1.8} />
            </span>
          )}
          {showSwapLayout && <SummaryItem item={items[1]} />}
        </div>
      ) : (
        <>
          <p className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
            {guestName || uiContent.seat.emptyOccupant}
          </p>
          {description && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              {description}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SummaryItem({ item }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-white/40 px-2.5 py-2 text-center">
      <p className="mb-1 truncate text-[0.6rem] uppercase tracking-[0.14em] text-[var(--color-accent)]">
        {item.title}
      </p>
      <p className="truncate font-serif text-base leading-none text-[var(--color-accent-dark)] sm:text-lg">
        {item.guestName || uiContent.seat.emptyOccupant}
      </p>
      {item.description && (
        <p className="mt-1 whitespace-pre-line text-[0.68rem] leading-snug text-[var(--color-muted)]">
          {item.description}
        </p>
      )}
    </div>
  );
}
