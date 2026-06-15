import { uiContent } from "../../../constants/uiContent";

export default function SeatOccupantSummary({
  guestName,
  seat,
  title = uiContent.seat.label,
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4 text-center">
      <p className="section-eyebrow mb-2">
        {seat && title === uiContent.seat.label
          ? `${title} ${seat}`
          : title}
      </p>
      <p className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
        {guestName || uiContent.seat.emptyOccupant}
      </p>
    </div>
  );
}
