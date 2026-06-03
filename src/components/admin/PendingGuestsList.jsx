import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { adminContent } from "../../constants/adminContent";
import { Table, Guest } from "../../models";
import usePageTransition from "../../hooks/usePageTransition";
import CollapsiblePanel from "../ui/CollapsiblePanel";
import IconButton from "../ui/IconButton";
import PaginatedContent from "../ui/PaginatedContent";
import Pagination from "../ui/Pagination";
import TableGuestCard from "./TableGuestCard";
import { selectClassName, Label } from "../rsvp/FormPrimitives";

/**
 * Lista de invitados sin mesa con filtros y selectores inline para asignar.
 * Controlado por el componente padre (AdminTables).
 *
 * @param {Array} guests - Invitados sin mesa asignada
 * @param {Array} tables - Todas las mesas disponibles
 * @param {Function} onAssignTable - Callback: ({guestId, guestGroupName, tableName, seatNumber}) => Promise
 */
export default function PendingGuestsList({
  guests = [],
  tables = [],
  onAssignTable,
}) {
  const [filters, setFilters] = useState({ group: "", menu: "" });
  const [assigningGuest, setAssigningGuest] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [isMobileList, setIsMobileList] = useState(false);
  const pageSize = isMobileList ? 1 : 8;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobileList = () => setIsMobileList(mediaQuery.matches);

    updateIsMobileList();
    mediaQuery.addEventListener("change", updateIsMobileList);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobileList);
    };
  }, []);

  // Calcular grupos únicos de invitados pendientes
  const availableGroups = useMemo(() => {
    const groupSet = new Set(guests.map((g) => g.groupName).filter(Boolean));
    return Array.from(groupSet);
  }, [guests]);

  // Calcular menús únicos de invitados pendientes
  const availableMenus = useMemo(() => {
    const menuSet = new Set(guests.map((g) => g.menu).filter(Boolean));
    return Array.from(menuSet);
  }, [guests]);

  // Filtrar invitados según criterios
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      if (filters.group && guest.groupName !== filters.group) return false;
      if (filters.menu && guest.menu !== filters.menu) return false;
      return true;
    });
  }, [guests, filters]);

  const totalPages = Math.max(Math.ceil(filteredGuests.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    onPageChange: setPage,
    totalPages,
  });

  // Mesas con asientos disponibles
  const tablesWithSeats = useMemo(() => {
    return tables.filter((table) => {
      const emptySeats = Table.getEmptySeats(table);
      return emptySeats.length > 0;
    });
  }, [tables]);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
    setPage(1);
  };

  const handleAssign = useCallback(
    async (guest, tableName, seatNumber) => {
      if (!tableName || !seatNumber) return;

      setError("");
      setAssigningGuest(getGuestRowKey(guest));

      try {
        await onAssignTable({
          guestId: Guest.getFullName(guest),
          guestGroupName: guest.groupName,
          guestIndex: guest.guestIndex,
          tableName,
          seatNumber,
        });
        // Limpiar estado tras éxito
        setAssigningGuest(null);
      } catch (err) {
        setError(err.message || adminContent.tables.errors.assignTable);
        setAssigningGuest(null);
      }
    },
    [onAssignTable],
  );

  if (!guests.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
        <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
          {adminContent.pendingGuests.emptyTitle}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          {adminContent.pendingGuests.emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CollapsiblePanel title={adminContent.pendingGuests.filtersEyebrow}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{adminContent.pendingGuests.groupLabel}</Label>
            <select
              value={filters.group}
              onChange={(e) => handleFilterChange("group", e.target.value)}
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
              onChange={(e) => handleFilterChange("menu", e.target.value)}
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

      {/* Error global */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50/50 p-4">
          <AlertCircle
            className="mt-0.5 flex-shrink-0 text-red-600"
            size={18}
          />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de invitados */}
      {filteredGuests.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            {adminContent.pendingGuests.noFilterResults}
          </p>
        </div>
      ) : (
        <>
          <PaginatedContent
            allItems={filteredGuests}
            direction={pageDirection}
            getKey={getGuestRowKey}
            page={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            renderMeasurePage={(items) => (
              <PendingGuestsPage
                assigningGuest=""
                guests={items}
                onAssign={() => {}}
                tables={tablesWithSeats}
              />
            )}
            renderPage={(items) => (
              <PendingGuestsPage
                assigningGuest={assigningGuest}
                guests={items}
                onAssign={handleAssign}
                tables={tablesWithSeats}
              />
            )}
          />

          {totalPages > 1 && (
            <Pagination
              className="mt-5"
              label={adminContent.pendingGuests.pageLabel({
                page: currentPage,
                total: totalPages,
              })}
              nextLabel={adminContent.pendingGuests.next}
              onNext={() => handlePageChange(currentPage + 1)}
              onPrev={() => handlePageChange(currentPage - 1)}
              page={currentPage}
              previousLabel={adminContent.pendingGuests.previous}
              totalPages={totalPages}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Fila individual de invitado con selectores inline para mesa/asiento.
 */
function PendingGuestsPage({ assigningGuest, guests, onAssign, tables }) {
  return (
    <div className="space-y-3">
      {guests.map((guest) => (
        <GuestAssignmentRow
          guest={guest}
          isAssigning={assigningGuest === getGuestRowKey(guest)}
          key={getGuestRowKey(guest)}
          onAssign={onAssign}
          tables={tables}
        />
      ))}
    </div>
  );
}

function GuestAssignmentRow({ guest, tables, onAssign, isAssigning }) {
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedSeat, setSelectedSeat] = useState("");

  const selectedTableObj = useMemo(
    () => tables.find((t) => t.name === selectedTable),
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
              onChange={(e) => {
                setSelectedTable(e.target.value);
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
              onChange={(e) => setSelectedSeat(e.target.value)}
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
  );
}

function getGuestRowKey(guest) {
  return `${guest.groupName || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`;
}
