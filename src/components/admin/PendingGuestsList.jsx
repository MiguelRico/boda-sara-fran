import { useMemo, useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { adminContent } from "../../constants/adminContent";
import { Table, Guest } from "../../models";
import CollapsiblePanel from "../ui/CollapsiblePanel";
import IconButton from "../ui/IconButton";
import TableGuestCard from "./TableGuestCard";
import { selectClassName, Label } from "../rsvp/FormPrimitives";

export default function PendingGuestsList({
  assigningGuest = "",
  emptyText = adminContent.pendingGuests.emptyText,
  emptyTitle = adminContent.pendingGuests.emptyTitle,
  error = "",
  guests = [],
  tables = [],
  onAssignTable,
  onSelect,
  selectedGuestKey = "",
}) {
  const tablesWithSeats = useMemo(() => {
    return tables.filter((table) => Table.getEmptySeats(table).length > 0);
  }, [tables]);

  if (!guests.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
        <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
          {emptyTitle}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          {emptyText}
        </p>
      </div>
    );
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
        assigningGuest={assigningGuest}
        guests={guests}
        onAssign={onAssignTable}
        onSelect={onSelect}
        selectedGuestKey={selectedGuestKey}
        tables={tablesWithSeats}
      />
    </div>
  );
}

export function PendingGuestsFilters({
  availableGroups = [],
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
    filters.menu
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{adminContent.pendingGuests.groupLabel}</Label>
          <select
            value={filters.group}
            onChange={(event) => onFilterChange("group", event.target.value)}
            className={selectClassName}
          >
            <option value="">{adminContent.pendingGuests.allGroups}</option>
            {availableGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

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
      </div>
    </CollapsiblePanel>
  );
}

function PendingGuestsPage({
  assigningGuest,
  guests,
  onAssign,
  onSelect,
  selectedGuestKey,
  tables,
}) {
  return (
    <div className="space-y-3">
      {guests.map((guest) => (
        <GuestAssignmentRow
          guest={guest}
          isAssigning={assigningGuest === getPendingGuestRowKey(guest)}
          key={getPendingGuestRowKey(guest)}
          onAssign={onAssign}
          onSelect={onSelect}
          selected={getPendingGuestRowKey(guest) === selectedGuestKey}
          tables={tables}
        />
      ))}
    </div>
  );
}

function GuestAssignmentRow({
  guest,
  tables,
  onAssign,
  onSelect,
  isAssigning,
  selected,
}) {
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedSeat, setSelectedSeat] = useState("");

  const selectedTableObj = useMemo(
    () => tables.find((table) => table.name === selectedTable),
    [selectedTable, tables],
  );

  const availableSeats = useMemo(() => {
    if (!selectedTableObj) return [];

    return Table.getEmptySeats(selectedTableObj).map((seat) => seat.seat);
  }, [selectedTableObj]);

  const canAssign = Boolean(selectedTable && selectedSeat);

  const handleAssignClick = () => {
    if (canAssign) {
      onAssign(guest, selectedTable, selectedSeat);
    }
  };

  return (
    <div
      className={`rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect?.(guest)}
    >
      <TableGuestCard
        decorativeText="?"
        eyebrow={guest.groupName || adminContent.pendingGuests.pendingEyebrow}
        guest={guest}
      >
        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:grid-cols-1">
            <div>
              <Label>{adminContent.pendingGuests.tableLabel}</Label>
              <select
                value={selectedTable}
                onChange={(event) => {
                  setSelectedTable(event.target.value);
                  setSelectedSeat("");
                }}
                disabled={isAssigning}
                className={`${selectClassName} text-sm`}
              >
                <option value="">
                  {adminContent.pendingGuests.tablePlaceholder}
                </option>
                {tables.map((table) => {
                  const emptySeats = Table.getEmptySeats(table);
                  const label = `${table.name} (${adminContent.pendingGuests.emptySeatsLabel(emptySeats.length)})`;

                  return (
                    <option key={table.name} value={table.name}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <Label>{adminContent.pendingGuests.seatLabel}</Label>
              <select
                value={selectedSeat}
                onChange={(event) => setSelectedSeat(event.target.value)}
                disabled={!selectedTable || isAssigning}
                className={`${selectClassName} text-sm disabled:opacity-50`}
              >
                <option value="">
                  {selectedTable
                    ? adminContent.pendingGuests.tablePlaceholder
                    : adminContent.pendingGuests.selectTableFirst}
                </option>
                {availableSeats.map((seatNum) => (
                  <option key={seatNum} value={seatNum}>
                    {adminContent.pendingGuests.seatOption(seatNum)}
                  </option>
                ))}
              </select>
            </div>

            <IconButton
              className="w-full"
              disabled={!canAssign || isAssigning}
              icon={
                isAssigning ? (
                  <span className="inline-block animate-spin">...</span>
                ) : (
                  <Check size={16} strokeWidth={2} />
                )
              }
              label={
                isAssigning
                  ? adminContent.pendingGuests.assigning
                  : adminContent.pendingGuests.assign
              }
              onClick={handleAssignClick}
              showText="always"
              tone={canAssign ? "primary" : "default"}
            >
              {isAssigning
                ? adminContent.pendingGuests.assigning
                : adminContent.pendingGuests.assign}
            </IconButton>
          </div>
        </div>
      </TableGuestCard>
    </div>
  );
}

function getPendingGuestRowKey(guest) {
  return `${guest.groupName || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`;
}
