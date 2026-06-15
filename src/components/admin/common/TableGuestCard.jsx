import { Guest } from "../../../models";
import { getGuestSummaryChips } from "../../../utils/rsvpSummaryChips";
import Chip from "../../ui/Chip";
import { adminContent } from "../../../constants/adminContent";

export default function TableGuestCard({
  actions,
  children,
  chips = [],
  decorativeText = "?",
  eyebrow,
  guest = {},
  title,
  titleRef,
  titleStyle,
}) {
  const guestName =
    title || Guest.getFullName(guest, adminContent.common.fallbacks.guest);
  const hasSummaryChips = chips.length > 0;

  return (
    <article
      className="
        group relative overflow-hidden rounded-[2rem]
        border border-[var(--color-border-strong)] bg-white/55 p-5
        shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-sm
        transition-all duration-700
      "
    >
      <div className="pointer-events-none absolute right-5 top-5 text-5xl opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
        {decorativeText}
      </div>

      {actions && <div className="absolute right-5 top-4 z-20">{actions}</div>}

      <div className="relative grid gap-5">
        <div className="min-w-0">
          <p className={`section-eyebrow mb-2 pr-24 ${actions ? "mt-4" : ""}`}>
            {eyebrow || guest.confirmationName || adminContent.common.fallbacks.guest}
          </p>
          <h3
            className="break-words font-serif text-2xl leading-none text-[var(--color-text)]"
            ref={titleRef}
            style={titleStyle}
          >
            {guestName}
          </h3>

          <div className="mt-4 text-sm text-[var(--color-muted)]">
            {hasSummaryChips && (
              <div className="flex flex-wrap gap-2 text-xs">
                {chips.map((chip) => (
                  <Chip
                    href={chip.href}
                    icon={chip.icon}
                    key={`${chip.label || ""}-${chip.value}`}
                    strong={chip.strong}
                    tone={chip.tone}
                    value={
                      chip.label ? `${chip.label}: ${chip.value}` : chip.value
                    }
                  />
                ))}
              </div>
            )}

            <GuestDetailChips className="mt-3" guest={guest} />
          </div>
        </div>

        {children}
      </div>
    </article>
  );
}

export function GuestDetailChips({ className = "", guest = {} }) {
  const chips = getGuestSummaryChips(guest);

  if (!chips.length) return null;

  return (
    <div className={`mt-4 grid grid-cols-2 gap-2 text-xs ${className}`}>
      {chips.map((chip) => (
        <Chip
          className={chip.className}
          icon={chip.icon}
          key={chip.key}
          strong={chip.strong}
          value={chip.value}
          valueClassName={chip.valueClassName}
        />
      ))}
    </div>
  );
}
