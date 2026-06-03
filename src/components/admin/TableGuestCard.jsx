import {
  AlertTriangle,
  Beef,
  Fish,
  Mail,
  MessageCircle,
  Phone,
  Utensils,
} from "lucide-react";

import { Guest } from "../../models";
import { rsvpContent } from "../../constants/rsvpContent";
import Chip from "../ui/Chip";

export default function TableGuestCard({
  children,
  chips = [],
  decorativeText = "?",
  eyebrow,
  guest = {},
  title,
  titleRef,
  titleStyle,
}) {
  const normalizedGuest = Guest.normalize(guest);
  const guestName = title || Guest.getFullName(guest, "Invitado");
  const guestEmail = String(guest.email || "").trim();
  const guestPhone = String(guest.phone || "").trim();
  const guestMenu = String(guest.menu || "").trim();
  const allergies = normalizedGuest.allergies;
  const otherAllergies = String(normalizedGuest.otherAllergies || "").trim();
  const comments = String(normalizedGuest.comments || "").trim();
  const hasSummaryChips = chips.length > 0;
  const hasDetailChips =
    guestEmail ||
    guestPhone ||
    guestMenu ||
    allergies.length > 0 ||
    otherAllergies ||
    comments;

  return (
    <article
      className="
        group relative overflow-hidden rounded-[2rem]
        border border-[var(--color-border-strong)] bg-white/55 p-5
        shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-sm
        transition-all duration-700 hover:-translate-y-1
        hover:border-[var(--color-border)] hover:bg-white/80
      "
    >
      <div className="pointer-events-none absolute right-5 top-5 text-5xl opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
        {decorativeText}
      </div>

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(23rem,1fr)] lg:items-start">
        <div className="min-w-0">
          <p className="section-eyebrow mb-2">
            {eyebrow || guest.groupName || "Invitado"}
          </p>
          <h3
            className="break-words font-serif text-3xl leading-none text-[var(--color-text)]"
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
                    icon={chip.icon}
                    key={`${chip.label || ""}-${chip.value}`}
                    strong={chip.strong}
                    value={
                      chip.label ? `${chip.label}: ${chip.value}` : chip.value
                    }
                  />
                ))}
              </div>
            )}

            {hasDetailChips && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {guestEmail && (
                  <Chip
                    className="col-span-2 w-full"
                    icon={<Mail size={13} strokeWidth={1.8} />}
                    value={guestEmail}
                  />
                )}
                {guestPhone && (
                  <Chip
                    className="w-full"
                    icon={<Phone size={13} strokeWidth={1.8} />}
                    value={guestPhone}
                  />
                )}
                {guestMenu && (
                  <Chip
                    className="w-full"
                    icon={
                      <TableGuestMenuIcon
                        menu={guestMenu}
                        size={13}
                        strokeWidth={1.8}
                      />
                    }
                    strong
                    value={guestMenu}
                  />
                )}
                {allergies.map((allergy) => (
                  <Chip
                    className="w-full"
                    icon={<AlertTriangle size={13} strokeWidth={1.8} />}
                    key={allergy}
                    value={allergy}
                  />
                ))}
                {otherAllergies && (
                  <Chip
                    className="col-span-2 w-full items-start"
                    icon={<AlertTriangle size={13} strokeWidth={1.8} />}
                    value={`${rsvpContent.guest.chipLabels.otherAllergies}: ${otherAllergies}`}
                    valueClassName="min-w-0 whitespace-normal break-words leading-relaxed"
                  />
                )}
                {comments && (
                  <Chip
                    className="col-span-2 w-full items-start"
                    icon={<MessageCircle size={13} strokeWidth={1.8} />}
                    value={`${rsvpContent.guest.chipLabels.notes}: ${comments}`}
                    valueClassName="min-w-0 whitespace-normal break-words leading-relaxed"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {children}
      </div>
    </article>
  );
}

function TableGuestMenuIcon({ menu, ...props }) {
  const normalizedMenu = String(menu || "")
    .trim()
    .toLowerCase();
  const Icon =
    normalizedMenu === "pescado"
      ? Fish
      : normalizedMenu === "carne"
        ? Beef
        : Utensils;

  return <Icon {...props} />;
}
