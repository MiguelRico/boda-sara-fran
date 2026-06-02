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

export default function TableGuestCard({
  children,
  decorativeText = "?",
  eyebrow,
  guest,
}) {
  const guestName = Guest.getFullName(guest, "Invitado");
  const guestEmail = String(guest.email || "").trim();
  const guestPhone = String(guest.phone || "").trim();
  const guestMenu = String(guest.menu || "").trim();
  const allergyText = formatGuestAllergies(guest);
  const comments = String(guest.comments || "").trim();

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
          <h3 className="break-words font-serif text-3xl leading-none text-[var(--color-text)]">
            {guestName}
          </h3>

          <div className="mt-4 text-sm text-[var(--color-muted)]">
            {(guestEmail || guestPhone || guestMenu || allergyText || comments) && (
              <div className="flex flex-wrap gap-2 text-xs">
                {guestEmail && (
                  <TableGuestChip
                    icon={<Mail size={13} strokeWidth={1.8} />}
                    value={guestEmail}
                  />
                )}
                {guestPhone && (
                  <TableGuestChip
                    icon={<Phone size={13} strokeWidth={1.8} />}
                    value={guestPhone}
                  />
                )}
                {guestMenu && (
                  <TableGuestChip
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
                {allergyText && (
                  <TableGuestChip
                    icon={<AlertTriangle size={13} strokeWidth={1.8} />}
                    value={`Alergias: ${allergyText}`}
                  />
                )}
                {comments && (
                  <TableGuestChip
                    icon={<MessageCircle size={13} strokeWidth={1.8} />}
                    value={`Notas: ${comments}`}
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

function TableGuestChip({ icon, strong = false, value }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        strong
          ? "border-[var(--color-border-strong)] bg-white/60 font-medium text-[var(--color-accent-dark)]"
          : "border-[var(--color-border)] bg-white/45 text-[var(--color-muted)]"
      }`}
    >
      <span className="shrink-0 text-[var(--color-accent-dark)]">{icon}</span>
      <span className="truncate">{value}</span>
    </span>
  );
}

function formatGuestAllergies(guest) {
  const normalizedGuest = Guest.normalize(guest);
  const allergyText = normalizedGuest.allergies.length
    ? normalizedGuest.allergies.join(", ")
    : "";
  const otherAllergies = String(normalizedGuest.otherAllergies || "").trim();

  if (allergyText && otherAllergies) {
    return `${allergyText}. ${otherAllergies}`;
  }

  return allergyText || otherAllergies;
}

function TableGuestMenuIcon({ menu, ...props }) {
  const normalizedMenu = String(menu || "").trim().toLowerCase();
  const Icon =
    normalizedMenu === "pescado"
      ? Fish
      : normalizedMenu === "carne"
        ? Beef
        : Utensils;

  return <Icon {...props} />;
}
