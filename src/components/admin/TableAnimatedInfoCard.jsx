import {
  AlertTriangle,
  Beef,
  Fish,
  MessageCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Guest, Table } from "../../models";
import { getTableGroupOption, TABLE_SHAPES } from "../../constants/tables";
import IconButton from "../ui/IconButton";
import RevealOnView from "../ui/RevealOnView";
import TableGuestCard from "./TableGuestCard";

export default function TableAnimatedInfoCard({
  index = 0,
  onDelete,
  onEdit,
  onSeatClick,
  onUnassignSeat,
  reveal = true,
  table,
}) {
  const content = (
    <TableInfoCard
      onDelete={onDelete}
      onEdit={onEdit}
      onSeatClick={onSeatClick}
      onUnassignSeat={onUnassignSeat}
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

function TableInfoCard({
  onDelete,
  onEdit,
  onSeatClick,
  onUnassignSeat,
  table,
}) {
  const [showAssignments, setShowAssignments] = useState(false);
  const assignedGuests = Table.getAssignedGuests(table);
  const tableLabel = table.name;
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-serif text-3xl leading-none text-[var(--color-text)] sm:truncate sm:text-4xl">
                    {tableLabel}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
                    {shapeLabel} - {assignedGuests.length}/{table.seats.length}{" "}
                    asientos
                  </p>
                </div>

                {(onEdit || onDelete) && (
                  <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:w-auto sm:flex sm:items-center sm:justify-end sm:gap-2 sm:self-center">
                    {onEdit && (
                      <IconButton
                        className="!w-full sm:!w-11"
                        label="Editar mesa"
                        onClick={() => onEdit(table)}
                      >
                        <Pencil size={16} strokeWidth={1.8} />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        className="!w-full sm:!w-11"
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
          onUnassignSeat={onUnassignSeat}
          table={table}
          onClose={() => setShowAssignments(false)}
        />
      )}
    </>
  );
}

function AssignmentModal({ onUnassignSeat, table, onClose }) {
  const assignedSeats = table.seats.filter((seat) => seat.guest);
  const [removingSeat, setRemovingSeat] = useState("");

  const handleUnassignSeat = async (seat) => {
    if (!onUnassignSeat) return;

    setRemovingSeat(seat.seat);

    try {
      await onUnassignSeat({ seat, table });
    } finally {
      setRemovingSeat("");
    }
  };

  return createPortal(
    <div className="rsvp-dialog-overlay" onClick={onClose}>
      <div
        aria-labelledby="assigned-seats-title"
        aria-modal="true"
        className="premium-card max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto p-5 text-left sm:max-h-[calc(100dvh-3rem)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Mesa {table.name}</p>
            <h2
              className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]"
              id="assigned-seats-title"
            >
              Asientos asignados
            </h2>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {assignedSeats.length}{" "}
              {assignedSeats.length === 1
                ? "invitado asignado"
                : "invitados asignados"}
            </p>
          </div>

          <IconButton label="Cerrar" onClick={onClose} tone="secondary">
            <X size={16} strokeWidth={1.8} />
          </IconButton>
        </div>

        {assignedSeats.length ? (
          <div className="space-y-4">
            {assignedSeats.map((seat) => (
              <AssignedSeatCard
                isRemoving={removingSeat === seat.seat}
                key={seat.seat}
                onUnassign={
                  onUnassignSeat ? () => handleUnassignSeat(seat) : undefined
                }
                seat={seat}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-white/45 p-6 text-center">
            <p className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
              Sin asientos asignados
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
              No hay invitados asignados a esta mesa.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function AssignedSeatCard({ isRemoving, onUnassign, seat }) {
  const guestGroup = String(seat.guest.groupName || "").trim();
  const eyebrow = `Asiento ${seat.seat}${guestGroup ? ` - ${guestGroup}` : ""}`;

  return (
    <TableGuestCard
      decorativeText={seat.seat}
      eyebrow={eyebrow}
      guest={seat.guest}
    >
      {onUnassign && (
        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
          <IconButton
            className="w-full"
            disabled={isRemoving}
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label="Liberar asiento"
            onClick={onUnassign}
            showText="always"
            tone="danger"
          >
            {isRemoving ? "Liberando..." : "Liberar asiento"}
          </IconButton>
        </div>
      )}
    </TableGuestCard>
  );
}

function TableDiagram({ onSeatClick, onCenterClick, table }) {
  const seats =
    table.shape === TABLE_SHAPES.round
      ? getRoundSeatPositions(table.seats)
      : getRectangularSeatPositions(table.seats);
  const summaryItems = getTableLegendSummary(table);

  return (
    <div>
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
            onClick={
              onSeatClick ? () => onSeatClick({ seat, table }) : undefined
            }
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

      <div className="mt-2 flex flex-wrap gap-1.5 text-[0.78rem] text-[var(--color-muted)]">
        {summaryItems.map((item) => (
          <TableLegendItem
            icon={item.icon}
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
}

function TableLegendItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-1 basis-[calc(50%-0.375rem)] items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-white/35 px-2.5 py-1.5 sm:basis-[calc(25%-0.375rem)]">
      <span className="inline-flex min-w-0 items-center gap-1.5 text-[var(--color-accent)]">
        {icon && (
          <span className="shrink-0 text-[var(--color-accent-dark)]">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-medium text-[var(--color-accent-dark)]">
        {value}
      </span>
    </div>
  );
}

function getTableLegendSummary(table) {
  const assignedGuests = Table.getAssignedGuests(table);

  return [
    {
      icon: <Fish size={14} strokeWidth={1.8} />,
      label: "Pescado",
      value: assignedGuests.filter((guest) => guest.menu === "Pescado").length,
    },
    {
      icon: <Beef size={14} strokeWidth={1.8} />,
      label: "Carne",
      value: assignedGuests.filter((guest) => guest.menu === "Carne").length,
    },
    {
      icon: <AlertTriangle size={14} strokeWidth={1.8} />,
      label: "Alergias",
      value: assignedGuests.filter(Guest.hasAllergies).length,
    },
    {
      icon: <MessageCircle size={14} strokeWidth={1.8} />,
      label: "Notas",
      value: assignedGuests.filter(Guest.hasComments).length,
    },
  ];
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
