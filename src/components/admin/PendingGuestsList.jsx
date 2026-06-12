import { AlertCircle } from "lucide-react";

import { adminContent } from "../../constants/adminContent";
import { isMenuModuleEnabled } from "../../config/features";
import { Guest } from "../../models";
import CollapsiblePanel from "../ui/CollapsiblePanel";
import TableGuestCard from "./TableGuestCard";
import { selectClassName, Label } from "../rsvp/FormPrimitives";
import AdminEmptyState from "./AdminEmptyState";

export default function PendingGuestsList({
  emptyText = adminContent.pendingGuests.emptyText,
  emptyTitle = adminContent.pendingGuests.emptyTitle,
  error = "",
  guests = [],
  onSelect,
  selectedGuestKey = "",
}) {
  if (!guests.length) {
    return <AdminEmptyState text={emptyText} title={emptyTitle} />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50/50 p-4">
          <AlertCircle
            className="mt-0.5 flex-shrink-0 text-red-600"
            size={18}
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <PendingGuestsPage
        guests={guests}
        onSelect={onSelect}
        selectedGuestKey={selectedGuestKey}
      />
    </div>
  );
}

export function PendingGuestsFilters({
  availableConfirmations = [],
  availableMenus = [],
  filters,
  onFilterChange,
}) {
  const activeFilters = [
    filters.group
      ? {
          key: "group",
          label: filters.group,
          onRemove: () => onFilterChange("group", ""),
        }
      : null,
    isMenuModuleEnabled && filters.menu
      ? {
          key: "menu",
          label: filters.menu,
          onRemove: () => onFilterChange("menu", ""),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      title={adminContent.pendingGuests.filtersEyebrow}
    >
      <div
        className={`grid gap-4 ${isMenuModuleEnabled ? "sm:grid-cols-2" : ""}`}
      >
        <div>
          <Label>{adminContent.pendingGuests.confirmationLabel}</Label>
          <select
            value={filters.group}
            onChange={(event) => onFilterChange("group", event.target.value)}
            className={selectClassName}
          >
            <option value="">
              {adminContent.pendingGuests.allConfirmations}
            </option>
            {availableConfirmations.map((confirmation) => (
              <option key={confirmation} value={confirmation}>
                {confirmation}
              </option>
            ))}
          </select>
        </div>

        {isMenuModuleEnabled && (
          <div>
            <Label>{adminContent.pendingGuests.menuLabel}</Label>
            <select
              value={filters.menu}
              onChange={(event) => onFilterChange("menu", event.target.value)}
              className={selectClassName}
            >
              <option value="">{adminContent.pendingGuests.allMenus}</option>
              {availableMenus.map((menu) => (
                <option key={menu} value={menu}>
                  {menu}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}

function PendingGuestsPage({ guests, onSelect, selectedGuestKey }) {
  return (
    <div className="space-y-3">
      {guests.map((guest) => (
        <GuestAssignmentRow
          guest={guest}
          key={getPendingGuestRowKey(guest)}
          onSelect={onSelect}
          selected={getPendingGuestRowKey(guest) === selectedGuestKey}
        />
      ))}
    </div>
  );
}

function GuestAssignmentRow({ guest, onSelect, selected }) {
  return (
    <div
      className={`rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] md:ring-offset-2 md:ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect?.(guest)}
    >
      <TableGuestCard
        decorativeText="?"
        eyebrow={
          guest.confirmationName || adminContent.pendingGuests.pendingEyebrow
        }
        guest={guest}
      />
    </div>
  );
}

function getPendingGuestRowKey(guest) {
  return (
    guest.guestId ||
    guest.id ||
    `${guest.confirmationId || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`
  );
}

