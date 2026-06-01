import { useCallback, useState, useMemo } from "react";
import { inputClassName, Label, FieldError } from "../rsvp/FormPrimitives";
import { Table, Guest } from "../../models";
import {
  getTableGroupOption,
  TABLE_GROUP_OPTIONS,
} from "../../constants/tables";
import { GUEST_MENU_OPTIONS } from "../../constants/rsvp";
import IconButton from "../ui/IconButton";
import { Check, AlertCircle } from "lucide-react";

/**
 * Lista de invitados sin mesa con filtros y selectores inline para asignar.
 * Controlado por el componente padre (AdminTables).
 *
 * @param {Array} guests - Invitados sin mesa asignada
 * @param {Array} tables - Todas las mesas disponibles
 * @param {Function} onAssignTable - Callback: ({guestId, guestEmail, tableId, seatNumber}) => Promise
 */
export default function PendingGuestsList({
  guests = [],
  tables = [],
  onAssignTable,
}) {
  const [filters, setFilters] = useState({ group: "", menu: "" });
  const [assigningGuest, setAssigningGuest] = useState(null);
  const [error, setError] = useState("");

  // Calcular grupos únicos de invitados pendientes
  const availableGroups = useMemo(() => {
    const groupSet = new Set(guests.map((g) => g.email).filter(Boolean));
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
      if (filters.group && guest.email !== filters.group) return false;
      if (filters.menu && guest.menu !== filters.menu) return false;
      return true;
    });
  }, [guests, filters]);

  // Mesas con asientos disponibles
  const tablesWithSeats = useMemo(() => {
    return tables.filter((table) => {
      const emptySeats = Table.getEmptySeats(table);
      return emptySeats.length > 0;
    });
  }, [tables]);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const handleAssign = useCallback(
    async (guest, tableId, seatNumber) => {
      if (!tableId || !seatNumber) return;

      setError("");
      setAssigningGuest(guest.name || "");

      try {
        await onAssignTable({
          guestId: guest.name,
          guestEmail: guest.email,
          tableId,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Grupo de invitación</Label>
          <select
            value={filters.group}
            onChange={(e) => handleFilterChange("group", e.target.value)}
            className={inputClassName}
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
            className={inputClassName}
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
        <div className="space-y-3">
          {filteredGuests.map((guest, index) => (
            <GuestAssignmentRow
              key={`${guest.email}-${guest.name}-${index}`}
              guest={guest}
              tables={tablesWithSeats}
              onAssign={handleAssign}
              isAssigning={assigningGuest === guest.name}
            />
          ))}
        </div>
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
    () => tables.find((t) => (t.id || t.name) === selectedTable),
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
    <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white/50 p-4 sm:grid-cols-5 sm:items-end">
      {/* Nombre */}
      <div className="sm:col-span-1">
        <p className="truncate font-medium text-[var(--color-accent-dark)]">
          {guestName}
        </p>
        <p className="truncate text-xs text-[var(--color-muted)]">
          {guest.email}
        </p>
      </div>

      {/* Grupo + Menú */}
      <div className="text-xs text-[var(--color-muted)] sm:col-span-1">
        <span className="block">{guest.groupName || guest.email}</span>
        {guest.menu && (
          <span className="inline-block rounded-full border border-[var(--color-border-strong)] px-2 py-1 text-[0.65rem] text-[var(--color-accent-dark)]">
            {guest.menu}
          </span>
        )}
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
          className={`${inputClassName} text-xs`}
        >
          <option value="">Seleccionar</option>
          {tables.map((table) => {
            const emptySeats = Table.getEmptySeats(table);
            const label = `${table.name || table.id} (${emptySeats.length})`;
            return (
              <option
                key={table.id || table.name}
                value={table.id || table.name}
              >
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
          className={`${inputClassName} text-xs disabled:opacity-50`}
        >
          <option value="">Seleccionar</option>
          {availableSeats.map((seatNum) => (
            <option key={seatNum} value={seatNum}>
              Asiento {seatNum}
            </option>
          ))}
        </select>
      </div>

      {/* Botón Asignar */}
      <div className="sm:col-span-1">
        <IconButton
          className="w-full"
          disabled={!canAssign || isAssigning}
          icon={
            isAssigning ? (
              <span className="inline-block animate-spin">⏳</span>
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
    </div>
  );
}
