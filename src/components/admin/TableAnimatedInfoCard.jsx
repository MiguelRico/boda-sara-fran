import {
  AlertTriangle,
  Beef,
  Fish,
  MessageCircle,
  Trash2,
  Armchair,
} from "lucide-react";
import { useState } from "react";

import { Guest, Table } from "../../models";
import { getTableGroupOption, TABLE_SHAPES } from "../../constants/tables";
import { adminContent } from "../../constants/adminContent";
import { tableContent } from "../../constants/tableContent";
import IconButton from "../ui/IconButton";
import RevealOnView from "../ui/RevealOnView";
import SeatAssignmentModal from "../ui/SeatAssignmentModal";
import Card from "./Card";
import CardActions from "./CardActions";
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
      <Card
        actions={
          <CardActions
            className="grid w-full shrink-0 grid-cols-2 gap-3 sm:w-auto sm:flex sm:items-center sm:justify-end sm:gap-2 sm:self-center"
            deleteLabel="Eliminar mesa"
            editLabel="Editar mesa"
            item={table}
            onDelete={onDelete}
            onEdit={onEdit}
            showText={false}
          />
        }
        decorativeText={table.shape === TABLE_SHAPES.round ? "O" : "[]"}
        detail={tableContent.card.detail({
          assigned: assignedGuests.length,
          seats: table.seats.length,
          shape: shapeLabel,
        })}
        eyebrow={groupLabel || tableContent.card.defaultEyebrow}
        title={tableLabel}
      >
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
      </Card>

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

function AssignmentModal({
  onUnassignSeat,
  table,
  onClose,
  title = adminContent.tables.dialogs.assignedTitle,
}) {
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

  return (
    <SeatAssignmentModal
      eyebrow={`Mesa ${table.name} ${assignedSeats.length} ${
        assignedSeats.length === 1
          ? "invitado asignado"
          : "invitados asignados"
      }`}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Armchair size={22} strokeWidth={1.8} />
          {title}
        </span>
      }
    >

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
              {tableContent.card.emptyAssignmentsTitle}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
              {tableContent.card.emptyAssignmentsText}
            </p>
          </div>
        )}
    </SeatAssignmentModal>
  );
}

function AssignedSeatCard({ isRemoving, onUnassign, seat }) {
  const guestGroup = String(seat.guest.groupName || "").trim();
  const eyebrow = tableContent.card.seatEyebrow({
    group: guestGroup,
    seat: seat.seat,
  });

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
            label={adminContent.tables.dialogs.unassignSeat}
            onClick={onUnassign}
            showText="always"
            tone="danger"
          >
            {isRemoving
              ? adminContent.tables.dialogs.unassigningSeat
              : adminContent.tables.dialogs.unassignSeat}
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
            {tableContent.card.centerAction}
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
      label: tableContent.card.legend.fish,
      value: assignedGuests.filter((guest) => guest.menu === "Pescado").length,
    },
    {
      icon: <Beef size={14} strokeWidth={1.8} />,
      label: tableContent.card.legend.meat,
      value: assignedGuests.filter((guest) => guest.menu === "Carne").length,
    },
    {
      icon: <AlertTriangle size={14} strokeWidth={1.8} />,
      label: tableContent.card.legend.allergies,
      value: assignedGuests.filter(Guest.hasAllergies).length,
    },
    {
      icon: <MessageCircle size={14} strokeWidth={1.8} />,
      label: tableContent.card.legend.notes,
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
      aria-label={tableContent.card.seatAriaLabel({
        guestName,
        seat: seat.seat,
      })}
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
      title={tableContent.card.seatTitle({ guestName, seat: seat.seat })}
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
