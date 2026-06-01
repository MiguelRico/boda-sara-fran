import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Guest, Table } from "../../models";
import { getTableGroupOption, TABLE_SHAPES } from "../../constants/tables";
import IconButton from "../ui/IconButton";
import RevealOnView from "../ui/RevealOnView";

export default function TableAnimatedInfoCard({
  index = 0,
  onDelete,
  onEdit,
  onSeatClick,
  reveal = true,
  table,
}) {
  const content = (
    <TableInfoCard
      onDelete={onDelete}
      onEdit={onEdit}
      onSeatClick={onSeatClick}
      table={table}
    />
  );

  if (!reveal) return content;

  return (
    <RevealOnView
      as="article"
      amount={0.45}
      margin="0px 0px -12% 0px"
      delay={index * 0.06}
      className="h-full"
    >
      {content}
    </RevealOnView>
  );
}

function TableInfoCard({ onDelete, onEdit, onSeatClick, table }) {
  const [showAssignments, setShowAssignments] = useState(false);
  const assignedGuests = Table.getAssignedGuests(table);
  const tableLabel = table.name || table.id;
  const groupLabel = getTableGroupOption(table.group)?.label;
  const shapeLabel = Table.getShapeLabel(table);

  return (
    <>
      <div
        className="
          group relative block h-full overflow-hidden rounded-[2rem]
          border border-[var(--color-border-strong)] bg-white/55 p-5
          shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-sm
          transition-all duration-700 hover:-translate-y-1
          hover:border-[var(--color-border)] hover:bg-white/80 sm:p-6
        "
      >
        <div className="pointer-events-none absolute right-6 top-6 text-5xl opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
          {table.shape === TABLE_SHAPES.round ? "O" : "[]"}
        </div>

        <div className="relative flex h-full flex-col">
          <div className="mb-4">
            <div className="min-w-0">
              <p className="section-eyebrow mb-2">{groupLabel || "Mesa"}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-serif text-3xl leading-none text-[var(--color-text)] sm:text-4xl">
                    {tableLabel}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-accent)]">
                    {shapeLabel} - {assignedGuests.length}/{table.seats.length}{" "}
                    asientos
                  </p>
                </div>

                {(onEdit || onDelete) && (
                  <div className="shrink-0 self-center flex items-center gap-2">
                    {onEdit && (
                      <IconButton
                        label="Editar mesa"
                        onClick={() => onEdit(table)}
                      >
                        <Pencil size={16} strokeWidth={1.8} />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        label="Eliminar mesa"
                        onClick={() => onDelete(table)}
                        tone="danger"
                      >
                        <Trash2 size={16} strokeWidth={1.8} />
                      </IconButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <TableDiagram
            onSeatClick={onSeatClick}
            onCenterClick={() => setShowAssignments(true)}
            table={table}
          />

          {table.notes && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
              {table.notes}
            </p>
          )}
        </div>
      </div>

      {showAssignments && (
        <AssignmentModal
          table={table}
          onClose={() => setShowAssignments(false)}
        />
      )}
    </>
  );
}

function AssignmentModal({ table, onClose }) {
  const assignedSeats = table.seats.filter((seat) => seat.guest);

  return createPortal(
    <div className="rsvp-dialog-overlay" onClick={onClose}>
      <div
        className="rsvp-dialog-card relative rounded-[2rem] border border-[var(--color-border)] bg-white p-6 text-left shadow-[0_24px_70px_rgba(77,56,40,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Invitados asignados</p>
            <h2 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
              {table.name || table.id}
            </h2>
          </div>

          <IconButton label="Cerrar" onClick={onClose} tone="secondary">
            <X size={16} strokeWidth={1.8} />
          </IconButton>
        </div>

        {assignedSeats.length ? (
          <div className="space-y-4">
            {assignedSeats.map((seat) => (
              <div
                key={seat.seat}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
              >
                <p className="font-medium text-[var(--color-accent-dark)]">
                  Asiento {seat.seat} –{" "}
                  {Guest.getFullName(seat.guest, "Invitado")}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Menú: {seat.guest.menu || "-"}
                </p>
                {seat.guest.phone && (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Teléfono: {seat.guest.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            No hay invitados asignados a esta mesa.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

function TableDiagram({ onSeatClick, onCenterClick, table }) {
  const seats =
    table.shape === TABLE_SHAPES.round
      ? getRoundSeatPositions(table.seats)
      : getRectangularSeatPositions(table.seats);

  return (
    <div className="relative mt-2 h-60 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 sm:h-64">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85),transparent_62%)]" />

      {table.shape === TABLE_SHAPES.round ? <RoundTable /> : <RectTable />}

      {onCenterClick && (
        <button
          type="button"
          onClick={onCenterClick}
          className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-center text-[0.75rem] font-semibold text-[var(--color-accent-dark)] transition hover:text-[var(--color-accent)] focus:outline-none"
        >
          Ver asientos
        </button>
      )}

      {seats.map(({ seat, transform, x, y }) => (
        <SeatDot
          onClick={onSeatClick ? () => onSeatClick({ seat, table }) : undefined}
          key={seat.seat}
          seat={seat}
          style={{
            left: transform ? `${x}%` : `calc(${x}% - 0.65rem)`,
            top: transform ? `${y}%` : `calc(${y}% - 0.65rem)`,
            transform,
          }}
        />
      ))}
    </div>
  );
}

function RectTable() {
  return (
    <div
      className="
        absolute left-[22%] right-[22%] top-1/2 h-16 -translate-y-1/2
        rounded-[1rem] border border-[var(--color-border-strong)]
        bg-[var(--color-surface)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]
      "
    />
  );
}

function RoundTable() {
  return (
    <div
      className="
        absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2
        -translate-y-1/2 rounded-full border border-[var(--color-border-strong)]
        bg-[var(--color-surface)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]
        sm:h-28 sm:w-28
      "
    />
  );
}

function SeatDot({ onClick, seat, style }) {
  const guestName = seat.guest ? Guest.getFullName(seat.guest, "Invitado") : "";
  const initials = seat.guest ? getGuestInitials(seat.guest) : "";
  const Component = onClick ? "button" : "span";

  return (
    <Component
      aria-label={`Asiento ${seat.seat}${guestName ? ` - ${guestName}` : ""}`}
      className={`
        absolute z-10 flex h-5 w-5 items-center justify-center rounded-full
        border text-[0.58rem] font-semibold shadow-[0_8px_18px_rgba(77,56,40,0.12)]
        [--round-seat-offset:5.15rem] sm:[--round-seat-offset:5.65rem]
        ${onClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2" : ""}
        ${
          seat.guest
            ? "border-[var(--color-accent-dark)] bg-[var(--color-accent-dark)] text-white"
            : "border-[var(--color-border-strong)] bg-white text-[var(--color-accent)]"
        }
      `}
      onClick={onClick}
      title={guestName || `Asiento ${seat.seat}`}
      type={onClick ? "button" : undefined}
      style={style}
    >
      {initials}
    </Component>
  );
}

function SeatInfo({ onClick, seat }) {
  const guestName = seat.guest ? Guest.getFullName(seat.guest, "Invitado") : "";
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`
        grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-2xl
        border border-[var(--color-border)] bg-white/50 p-3 text-left text-sm
        ${
          onClick
            ? "cursor-pointer transition-all duration-300 hover:border-[var(--color-border-strong)] hover:bg-white/75 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
            : ""
        }
      `}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <span className="font-medium text-[var(--color-accent-dark)]">
        Asiento {seat.seat}
      </span>
      <span className="min-w-0 truncate text-[var(--color-muted)]">
        {guestName || "Sin asignar"}
      </span>
      {seat.guest?.menu && (
        <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-accent-dark)]">
          {seat.guest.menu}
        </span>
      )}
    </Component>
  );
}

function getRectangularSeatPositions(seats) {
  const topCount = Math.ceil(seats.length / 2);
  const bottomCount = seats.length - topCount;

  return [
    ...seats.slice(0, topCount).map((seat, index) => ({
      seat,
      x: getJustifiedPosition(index, topCount, 22, 78),
      y: 24,
    })),
    ...seats.slice(topCount).map((seat, index) => ({
      seat,
      x: getJustifiedPosition(index, bottomCount, 22, 78),
      y: 76,
    })),
  ];
}

function getRoundSeatPositions(seats) {
  const angleStep = (Math.PI * 2) / seats.length;

  return seats.map((seat, index) => {
    const angle = -Math.PI / 2 + index * angleStep;

    return {
      seat,
      x: 50,
      y: 50,
      transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(var(--round-seat-offset)) rotate(${-angle}rad)`,
    };
  });
}

function getJustifiedPosition(index, count, min, max) {
  if (count <= 1) return 50;

  return min + ((index + 1) / (count + 1)) * (max - min);
}

function getGuestInitials(guest) {
  const normalizedGuest = Guest.normalize(guest);
  const nameInitial = normalizedGuest.name.trim().charAt(0);
  const lastnameInitial = normalizedGuest.lastname.trim().charAt(0);

  return `${nameInitial}${lastnameInitial}`.toUpperCase();
}
