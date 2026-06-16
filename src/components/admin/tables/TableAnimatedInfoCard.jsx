import {
  AlertTriangle,
  Beef,
  BriefcaseBusiness,
  Fish,
  Heart,
  MessageCircle,
  Unlink,
  UsersRound,
} from "lucide-react";
import { useRef, useState } from "react";

import { Guest, Table } from "../../../models";
import { getTableGroupOption, TABLE_SHAPES } from "../../../constants/tables";
import { adminContent } from "../../../constants/adminContent";
import { tableContent } from "../../../constants/tableContent";
import { isMenuModuleEnabled } from "../../../config/features";
import usePagedData from "../../../hooks/usePagedData";
import usePageTransition from "../../../hooks/usePageTransition";
import IconButton from "../../ui/IconButton";
import PaginatedContent from "../../ui/PaginatedContent";
import Pagination from "../../ui/Pagination";
import RevealOnView from "../../ui/RevealOnView";
import SeatAssignmentModal from "../../ui/SeatAssignmentModal";
import DeleteDialog from "../../ui/DeleteDialog";
import {
  Card,
  CardActions,
  SelectableCardFrame,
  TableGuestCard,
} from "../common";

const TABLE_GROUP_ICON_MAP = {
  briefcase: BriefcaseBusiness,
  heart: Heart,
  users: UsersRound,
};

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
  const groupOption = getTableGroupOption(table.group);
  const groupLabel = groupOption?.label;
  const shapeLabel = Table.getShapeLabel(table);
  const GroupIcon = TABLE_GROUP_ICON_MAP[groupOption?.icon];

  return (
    <>
      <Card
        actionsPlacement="overlay"
        actions={
          <CardActions
            className="grid shrink-0 grid-cols-2 gap-2"
            deleteLabel={tableContent.card.deleteAction}
            editLabel={tableContent.card.editAction}
            item={table}
            onDelete={onDelete}
            onEdit={onEdit}
            showText={false}
            stopPropagation
          />
        }
        decorativeText={
          GroupIcon ? (
            <GroupIcon size={54} strokeWidth={1.5} />
          ) : table.shape === TABLE_SHAPES.round ? (
            "O"
          ) : (
            "[]"
          )
        }
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
          <div className="mt-2 flex min-w-0 flex-1 basis-[calc(50%-0.375rem)] items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-white/35 px-2.5 py-1.5">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[var(--color-accent)]">
              {table.notes}
            </span>
          </div>
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
}) {
  const contentRef = useRef(null);
  const assignedSeats = table.seats.filter((seat) => seat.guest);
  const [page, setPage] = useState(1);
  const [selectedSeatKey, setSelectedSeatKey] = useState("");
  const [removingSeat, setRemovingSeat] = useState("");
  const [seatToUnassign, setSeatToUnassign] = useState(null);
  const { currentPage, pageSize, totalPages } = usePagedData({
    items: assignedSeats,
    page,
    pageSize: 1,
  });
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    onPageChange: setPage,
    totalPages,
  });
  const effectiveSelectedSeatKey = assignedSeats.some(
    (seat) => getAssignedSeatKey(seat) === selectedSeatKey,
  )
    ? selectedSeatKey
    : getAssignedSeatKey(assignedSeats[0]);
  const selectedSeat =
    assignedSeats.find(
      (seat) => getAssignedSeatKey(seat) === effectiveSelectedSeatKey,
    ) || null;
  const handleConfirmUnassignSeat = async () => {
    if (!onUnassignSeat) return;
    if (!seatToUnassign) return;

    setRemovingSeat(seatToUnassign.seat);

    try {
      await onUnassignSeat({ seat: seatToUnassign, table });
      setSeatToUnassign(null);
    } finally {
      setRemovingSeat("");
    }
  };
  const seatToUnassignGuestName = seatToUnassign?.guest
    ? Guest.getFullName(
        seatToUnassign.guest,
        adminContent.common.fallbacks.guest,
      )
    : "";
  return (
    <>
      <SeatAssignmentModal
        blockRouteChange={!seatToUnassign}
        eyebrow={table.name}
        onClose={onClose}
        title={table.name}
      >
        <div className="space-y-4">
          {onUnassignSeat && (
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
              <IconButton
                className="w-full"
                disabled={!selectedSeat || removingSeat === selectedSeat?.seat}
                icon={<Unlink size={16} strokeWidth={1.8} />}
                keepTextOnAdminSubpages
                label={adminContent.tables.dialogs.unassignSeat}
                onClick={() => selectedSeat && setSeatToUnassign(selectedSeat)}
                showText="always"
                tone="danger"
              >
                {selectedSeat && removingSeat === selectedSeat.seat
                  ? adminContent.tables.dialogs.unassigningSeat
                  : adminContent.tables.dialogs.unassignSeat}
              </IconButton>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              className="my-0"
              onNext={() =>
                handlePageChange(currentPage + 1, contentRef.current)
              }
              onPrev={() =>
                handlePageChange(currentPage - 1, contentRef.current)
              }
              page={currentPage}
              totalPages={totalPages}
            />
          )}

          <div ref={contentRef}>
            <PaginatedContent
              allItems={assignedSeats}
              direction={pageDirection}
              getKey={getAssignedSeatKey}
              lockHeight={false}
              page={currentPage}
              pageSize={pageSize}
              renderMeasurePage={(items) => (
                <AssignedSeatsPage
                  emptyState={getAssignedSeatsEmptyState(assignedSeats.length)}
                  items={items}
                  onSelect={() => {}}
                  selectedSeatKey={effectiveSelectedSeatKey}
                />
              )}
              renderPage={(items) => (
                <AssignedSeatsPage
                  emptyState={getAssignedSeatsEmptyState(assignedSeats.length)}
                  items={items}
                  onSelect={(seat) =>
                    setSelectedSeatKey(getAssignedSeatKey(seat))
                  }
                  selectedSeatKey={effectiveSelectedSeatKey}
                />
              )}
              totalPages={totalPages}
            />
          </div>
        </div>
      </SeatAssignmentModal>

      {seatToUnassign && (
        <DeleteDialog
          confirmText={adminContent.tables.dialogs.unassignSeat}
          message={adminContent.tables.dialogs.unassignSeatMessage(
            seatToUnassignGuestName,
            table.name,
            seatToUnassign.seat,
          )}
          onCancel={() => setSeatToUnassign(null)}
          onConfirm={handleConfirmUnassignSeat}
          title={adminContent.tables.dialogs.unassignSeatTitle}
        />
      )}
    </>
  );
}

function AssignedSeatCard({ onSelect, seat, selected }) {
  const guestGroup = String(seat.guest.confirmationName || "").trim();
  const eyebrow = tableContent.card.seatEyebrow({
    group: guestGroup,
    seat: seat.seat,
  });

  return (
    <SelectableCardFrame onClick={() => onSelect?.(seat)} selected={selected}>
      <TableGuestCard
        decorativeText={seat.seat}
        eyebrow={eyebrow}
        guest={seat.guest}
      />
    </SelectableCardFrame>
  );
}

function AssignedSeatsPage({ emptyState, items, onSelect, selectedSeatKey }) {
  if (!items.length) return <AssignedSeatsEmptyState {...emptyState} />;

  return (
    <div className="grid gap-4">
      {items.map((seat) => (
        <AssignedSeatCard
          key={getAssignedSeatKey(seat)}
          onSelect={onSelect}
          selected={getAssignedSeatKey(seat) === selectedSeatKey}
          seat={seat}
        />
      ))}
    </div>
  );
}

function AssignedSeatsEmptyState({
  text = tableContent.card.emptyAssignmentsText,
  title = tableContent.card.emptyAssignmentsTitle,
}) {
  return (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-white/45 p-6 text-center">
      <p className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {text}
      </p>
    </div>
  );
}

function getAssignedSeatsEmptyState(sourceCount) {
  if (sourceCount > 0) {
    return {
      text: tableContent.card.emptyAssignmentsFilterText,
      title: tableContent.card.emptyAssignmentsTitle,
    };
  }

  return {
    text: tableContent.card.emptyAssignmentsText,
    title: tableContent.card.emptyAssignmentsTitle,
  };
}

function TableDiagram({ onSeatClick, onCenterClick, table }) {
  const seats =
    table.shape === TABLE_SHAPES.round
      ? getRoundSeatPositions(table.seats)
      : getRectangularSeatPositions(table.seats);
  const summaryItems = getTableLegendSummary(table);

  return (
    <div>
      <div className="relative mt-2 h-60 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white/35">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85),transparent_62%)]" />

        {table.shape === TABLE_SHAPES.round ? <RoundTable /> : <RectTable />}

        {onCenterClick && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCenterClick();
            }}
            className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-center text-[0.75rem] font-semibold text-[var(--color-accent-dark)] transition hover:text-[var(--color-accent)] focus:outline-none"
          >
            {tableContent.card.centerAction}
          </button>
        )}

        {seats.map(({ seat, style, transform, x, y }) => (
          <SeatDot
            onClick={
              onSeatClick ? () => onSeatClick({ seat, table }) : undefined
            }
            key={seat.seat}
            seat={seat}
            style={
              style || {
                left: `calc(${x}% - 0.65rem)`,
                top: `calc(${y}% - 0.65rem)`,
                transform,
              }
            }
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
    <div className="flex min-w-0 flex-1 basis-[calc(50%-0.375rem)] items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-white/35 px-2.5 py-1.5">
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
    ...(isMenuModuleEnabled
      ? [
          {
            icon: <Fish size={14} strokeWidth={1.8} />,
            label: tableContent.card.legend.fish,
            value: assignedGuests.filter((guest) => guest.menu === "Pescado")
              .length,
          },
          {
            icon: <Beef size={14} strokeWidth={1.8} />,
            label: tableContent.card.legend.meat,
            value: assignedGuests.filter((guest) => guest.menu === "Carne")
              .length,
          },
        ]
      : []),
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
      "
    />
  );
}

function SeatDot({ onClick, seat, style }) {
  const guestName = seat.guest
    ? Guest.getFullName(seat.guest, adminContent.common.fallbacks.guest)
    : "";
  const initials = seat.guest ? getGuestInitials(seat.guest) : "";
  const Component = onClick ? "button" : "span";
  const handleClick = (event) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <Component
      aria-label={tableContent.card.seatAriaLabel({
        guestName,
        seat: seat.seat,
      })}
      className={`
        absolute z-10 flex h-5 w-5 items-center justify-center rounded-full
        border text-[0.58rem] font-semibold shadow-[0_8px_18px_rgba(77,56,40,0.12)]
        ${onClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" : ""}
        ${
          seat.guest
            ? "border-[var(--color-accent-dark)] bg-[var(--color-accent-dark)] text-white"
            : "border-[var(--color-border-strong)] bg-white text-[var(--color-accent)]"
        }
      `}
      onClick={onClick ? handleClick : undefined}
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
  const seatOffsetRem = 5.15;
  const seatRadiusRem = 0.625;

  return seats.map((seat, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const leftOffset = Math.cos(angle) * seatOffsetRem - seatRadiusRem;
    const topOffset = Math.sin(angle) * seatOffsetRem - seatRadiusRem;

    return {
      seat,
      style: {
        left: `calc(50% + ${leftOffset.toFixed(3)}rem)`,
        top: `calc(50% + ${topOffset.toFixed(3)}rem)`,
      },
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

function getAssignedSeatKey(seat = {}) {
  const guest = seat.guest || {};
  const guestKey = guest.guestId || guest.id || guest.confirmationId;

  return guestKey
    ? `${seat.seat || ""}-${guestKey}`
    : `${seat.seat || ""}-${Guest.getFullName(
        guest,
        adminContent.common.fallbacks.guest,
      )}`;
}

