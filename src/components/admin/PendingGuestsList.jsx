import { useCallback, useEffect, useMemo, useState } from "react";
import { selectClassName, Label } from "../rsvp/FormPrimitives";
import { Table, Guest } from "../../models";
import IconButton from "../ui/IconButton";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  UsersRound,
} from "lucide-react";

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
  const pagedGuests = filteredGuests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
        setError(
          err.message || "No se pudo asignar la mesa. Intenta de nuevo.",
        );
        setAssigningGuest(null);
      }
    },
    [onAssignTable],
  );

  if (!guests.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
        <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
          Sin invitados pendientes
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          Todos los invitados confirmados tienen mesa asignada. 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <section
        className="
          overflow-hidden rounded-[2rem]
          border border-[var(--color-border-strong)] bg-white/80 p-5
          shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-md
        "
      >
        <div className="mb-4">
          <div>
            <p className="section-eyebrow mb-2">Filtros</p>
            <h3 className="font-serif text-3xl leading-none text-[var(--color-text)]">
              Invitados pendientes
            </h3>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Grupo de invitación</Label>
          <select
            value={filters.group}
            onChange={(e) => handleFilterChange("group", e.target.value)}
            className={selectClassName}
          >
            <option value="">Todos los grupos</option>
            {availableGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Preferencia de menú</Label>
          <select
            value={filters.menu}
            onChange={(e) => handleFilterChange("menu", e.target.value)}
            className={selectClassName}
          >
            <option value="">Todos los menús</option>
            {availableMenus.map((menu) => (
              <option key={menu} value={menu}>
                {menu}
              </option>
            ))}
          </select>
        </div>
        </div>
      </section>

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
            No hay invitados que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pagedGuests.map((guest, index) => (
              <GuestAssignmentRow
                key={`${guest.groupName}-${guest.name}-${index}`}
                guest={guest}
                tables={tablesWithSeats}
                onAssign={handleAssign}
                isAssigning={assigningGuest === getGuestRowKey(guest)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-muted)]">
                Página {currentPage} de {totalPages}
              </p>

              <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex">
                <IconButton
                  className="w-full sm:w-auto"
                  disabled={currentPage === 1}
                  icon={<ChevronLeft size={16} strokeWidth={1.8} />}
                  label="Anterior"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  showText
                  tone="secondary"
                  type="button"
                >
                  Anterior
                </IconButton>
                <IconButton
                  className="w-full sm:w-auto"
                  disabled={currentPage === totalPages}
                  icon={<ChevronRight size={16} strokeWidth={1.8} />}
                  label="Siguiente"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  showText
                  tone="secondary"
                  type="button"
                >
                  Siguiente
                </IconButton>
              </div>
            </div>
          )}
        </>
      )}

      {/* Resumen */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white/30 p-4">
        <p className="text-xs text-[var(--color-muted)]">
          Mostrando{" "}
          <span className="font-medium text-[var(--color-accent-dark)]">
            {filteredGuests.length}
          </span>{" "}
          de{" "}
          <span className="font-medium text-[var(--color-accent-dark)]">
            {guests.length}
          </span>{" "}
          invitados pendientes
        </p>
      </div>
    </div>
  );
}

/**
 * Fila individual de invitado con selectores inline para mesa/asiento.
 */
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
      // Reset selectors tras asignar (opcional, comentado para flujo rápido)
      // setSelectedTable("");
      // setSelectedSeat("");
    }
  };

  const guestName = Guest.getFullName(guest, "Invitado");

  return (
    <article
      className="
        group relative grid gap-4 overflow-hidden rounded-[2rem]
        border border-[var(--color-border-strong)] bg-white/55 p-5
        shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-sm
        transition-all duration-700 hover:-translate-y-1
        hover:border-[var(--color-border)] hover:bg-white/80
        sm:grid-cols-5 sm:items-end
      "
    >
      <div className="min-w-0 sm:col-span-2">
        <p className="section-eyebrow mb-2">
          {guest.groupName || "Invitado pendiente"}
        </p>
        <p className="break-words font-serif text-2xl leading-none text-[var(--color-text)]">
          {guestName}
        </p>

        <div className="mt-3 grid gap-2 text-xs text-[var(--color-muted)]">
          {guest.email && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail size={13} strokeWidth={1.8} />
              <span className="truncate">{guest.email}</span>
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {guest.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} strokeWidth={1.8} />
                {guest.phone}
              </span>
            )}
            {guest.menu && (
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-white/60 px-3 py-1.5 text-[0.7rem] font-medium text-[var(--color-accent-dark)]">
                <UsersRound className="mr-1.5" size={13} strokeWidth={1.8} />
                {guest.menu}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selector Mesa */}
      <div className="sm:col-span-1">
        <Label className="mb-1 block text-xs">Mesa</Label>
        <select
          value={selectedTable}
          onChange={(e) => {
            setSelectedTable(e.target.value);
            setSelectedSeat(""); // Reset asiento al cambiar mesa
          }}
          disabled={isAssigning}
          className={`${selectClassName} text-xs`}
        >
          <option value="">Seleccionar</option>
          {tables.map((table) => {
            const emptySeats = Table.getEmptySeats(table);
            const label = `${table.name} (${emptySeats.length} asientos libres)`;
            return (
              <option key={table.name} value={table.name}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      {/* Selector Asiento */}
      <div className="sm:col-span-1">
        <Label className="mb-1 block text-xs">Asiento</Label>
        <select
          value={selectedSeat}
          onChange={(e) => setSelectedSeat(e.target.value)}
          disabled={!selectedTable || isAssigning}
          className={`${selectClassName} text-xs disabled:opacity-50`}
        >
          <option value="">Seleccionar</option>
          {availableSeats.map((seatNum) => (
            <option key={seatNum} value={seatNum}>
              Asiento {seatNum}
            </option>
          ))}
        </select>
      </div>

      {/* BotÃ³n Asignar */}
      <div className="sm:col-span-1">
        <IconButton
          className="w-full"
          disabled={!canAssign || isAssigning}
          icon={
            isAssigning ? (
              <span className="inline-block animate-spin">â³</span>
            ) : (
              <Check size={16} strokeWidth={2} />
            )
          }
          label={isAssigning ? "Asignando..." : "Asignar"}
          onClick={handleAssignClick}
          showText="always"
          tone={canAssign ? "primary" : "default"}
        >
          {isAssigning ? "Asignando..." : "Asignar"}
        </IconButton>
      </div>
    </article>
  );
}

function getGuestRowKey(guest) {
  return `${guest.groupName || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`;
}
