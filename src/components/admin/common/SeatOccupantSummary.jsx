import { uiContent } from "../../../constants/uiContent";

export default function SeatOccupantSummary({ guestName, seat }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4 text-center">
      <p className="section-eyebrow mb-2">
        {seat ? `${uiContent.seat.label} ${seat}` : uiContent.seat.label}
      </p>
      <p className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
        {guestName || uiContent.seat.emptyOccupant}
      </p>
    </div>
  );
}
