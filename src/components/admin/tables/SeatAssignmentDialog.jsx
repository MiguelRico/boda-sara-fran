import { useRef, useState } from "react";
import { Armchair, Shuffle, Unlink } from "lucide-react";

import { AdminTableSection, SeatOccupantSummary } from "../common";
import DeleteDialog from "../../ui/DeleteDialog";
import IconButton from "../../ui/IconButton";
import SeatAssignmentModal from "../../ui/SeatAssignmentModal";
import { adminContent } from "../../../constants/adminContent";
import { isMenuModuleEnabled } from "../../../config/features";
import { Guest } from "../../../models";
import { getPendingGuestRowKey } from "../../../services/tablesService";
import useEffectiveSelection from "../../../hooks/useEffectiveSelection";
import usePagedData from "../../../hooks/usePagedData";
import usePageTransition from "../../../hooks/usePageTransition";
import { DEFAULT_TABLE_PAGE_SIZE } from "../../../utils/paginationState";
import PendingGuestsList, { PendingGuestsFilters } from "./PendingGuestsList";

export default function SeatAssignmentDialog({
  assigning,
  guests,
  onAssign,
  onCancel,
  onRemove,
  seat,
  table,
}) {
  const tableKey = table.name;
  const tableLabel = table.name;
  const seatLabel = `Asiento ${seat.seat}`;
  const contentRef = useRef(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    group: "",
    menu: "",
  });
  const currentGuest = guests.find(
    (guest) =>
      guest.table === tableKey && String(guest.seat) === String(seat.seat),
  );
  const currentGuestName = currentGuest
    ? Guest.getFullName(currentGuest, adminContent.common.fallbacks.guest)
    : seat.guest
      ? Guest.getFullName(seat.guest, adminContent.common.fallbacks.guest)
      : "";
  const currentGuestKey = currentGuest
    ? getPendingGuestRowKey(currentGuest)
    : "";
  const canRemoveGuest = Boolean(currentGuest);
  const [selectedGuestKey, setSelectedGuestKey] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const assignableGuests = guests;
  const availableConfirmations = Array.from(
    new Set(
      assignableGuests.map((guest) => guest.confirmationName).filter(Boolean),
    ),
  );
  const availableMenus = Array.from(
    new Set(assignableGuests.map((guest) => guest.menu).filter(Boolean)),
  );
  const filteredGuests = assignableGuests.filter((guest) => {
    if (filters.group && guest.confirmationName !== filters.group) {
      return false;
    }

    if (isMenuModuleEnabled && filters.menu && guest.menu !== filters.menu) {
      return false;
    }

    return true;
  });
  const { currentPage, isMobileView, pageSize, pagedItems, totalPages } =
    usePagedData({
      items: filteredGuests,
      page,
      pageSize: DEFAULT_TABLE_PAGE_SIZE,
    });
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    onPageChange: setPage,
    totalPages,
  });
  const {
    effectiveSelectedId: effectiveSelectedGuestKey,
    selectedItem: selectedGuest,
  } = useEffectiveSelection({
    allItems: filteredGuests,
    currentPage,
    getId: getPendingGuestRowKey,
    items: pagedItems,
    onPageChange: setPage,
    pageSize,
    selectedId: selectedGuestKey,
  });
  const selectedGuestHasSeat = Boolean(selectedGuest?.table && selectedGuest?.seat);
  const selectedGuestIsCurrent = Boolean(
    selectedGuest && getPendingGuestRowKey(selectedGuest) === currentGuestKey,
  );
  const assignLabel = assigning
    ? adminContent.tables.dialogs.assigning
    : selectedGuestHasSeat
      ? adminContent.tables.dialogs.swapSeat
      : adminContent.tables.dialogs.assign;
  const AssignIcon = selectedGuestHasSeat ? Shuffle : Armchair;

  const handleAssign = () => {
    if (!selectedGuest) return;

    onAssign({
      confirmationId: selectedGuest.confirmationId,
      guestId: selectedGuest.guestId || selectedGuest.id,
      guestconfirmationName: selectedGuest.confirmationName,
      guestIndex: selectedGuest.guestIndex,
      guestName: Guest.getFullName(
        selectedGuest,
        adminContent.common.fallbacks.guest,
      ),
    });
  };

  const handleConfirmRemove = () => {
    setShowRemoveConfirm(false);
    onRemove();
  };
  const handleFilterChange = (filterKey, value) => {
    setFilters((current) => ({
      ...current,
      [filterKey]: value,
    }));
  };
  const seatAssignmentEmptyState = getSeatAssignmentEmptyState(guests.length);

  return (
    <>
      <SeatAssignmentModal
        blockRouteChange={!showRemoveConfirm}
        eyebrow={tableLabel}
        maxWidthClassName="max-w-2xl"
        onClose={onCancel}
        title={tableLabel}
      >
        <AdminTableSection
          actions={
            <div className="grid w-full grid-cols-1 gap-3">
              {canRemoveGuest && (
                <IconButton
                  className="w-full"
                  disabled={assigning}
                  icon={<Unlink size={16} strokeWidth={1.8} />}
                  keepTextOnAdminSubpages
                  label={adminContent.tables.dialogs.remove}
                  onClick={() => setShowRemoveConfirm(true)}
                  showText="always"
                  tone="danger"
                  type="button"
                >
                  {adminContent.tables.dialogs.remove}
                </IconButton>
              )}

              <IconButton
                className="w-full"
                disabled={!selectedGuest || selectedGuestIsCurrent || assigning}
                icon={<AssignIcon size={16} strokeWidth={1.8} />}
                keepTextOnAdminSubpages
                label={assignLabel}
                onClick={handleAssign}
                showText="always"
                tone="primary"
                type="button"
              >
                {assignLabel}
              </IconButton>
            </div>
          }
          className="p-4 shadow-none hover:translate-y-0"
          contentRef={contentRef}
          eyebrow={seatLabel}
          filters={
            <PendingGuestsFilters
              availableConfirmations={availableConfirmations}
              availableMenus={availableMenus}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          }
          getKey={getPendingGuestRowKey}
          isMobileView={isMobileView}
          items={filteredGuests}
          lockPageHeight={false}
          mobilePageLabel={adminContent.tables.dialogs.guestLabel}
          onNextPage={() =>
            handlePageChange(currentPage + 1, contentRef.current)
          }
          onPrevPage={() =>
            handlePageChange(currentPage - 1, contentRef.current)
          }
          page={currentPage}
          pageDirection={pageDirection}
          pageLabel={adminContent.tables.header.pageLabel}
          pageSize={pageSize}
          renderMeasurePage={(items) => (
            <PendingGuestsList
              emptyText={seatAssignmentEmptyState.text}
              emptyTitle={seatAssignmentEmptyState.title}
              guests={items}
              onSelect={() => {}}
              selectedGuestKey={effectiveSelectedGuestKey}
            />
          )}
          renderPage={(items) => (
            <PendingGuestsList
              emptyText={seatAssignmentEmptyState.text}
              emptyTitle={seatAssignmentEmptyState.title}
              guests={items}
              onSelect={(guest) =>
                setSelectedGuestKey(getPendingGuestRowKey(guest))
              }
              selectedGuestKey={effectiveSelectedGuestKey}
            />
          )}
          sourceItemsCount={guests.length}
          summary={
            <SeatOccupantSummary
              guestName={currentGuestName}
              seat={seat.seat}
              title="Asignado a"
            />
          }
          title={seatLabel}
          totalPages={totalPages}
        />
      </SeatAssignmentModal>

      {showRemoveConfirm && (
        <DeleteDialog
          confirmText={adminContent.tables.dialogs.unassignSeat}
          message={adminContent.tables.dialogs.unassignSeatMessage(
            currentGuestName,
            tableLabel,
            seat.seat,
          )}
          onCancel={() => setShowRemoveConfirm(false)}
          onConfirm={handleConfirmRemove}
          title={adminContent.tables.dialogs.unassignSeatTitle}
        />
      )}
    </>
  );
}

function getSeatAssignmentEmptyState(sourceGuestCount) {
  if (sourceGuestCount > 0) {
    return {
      text: adminContent.pendingGuests.noFilterResults,
      title: adminContent.pendingGuests.emptyTitle,
    };
  }

  return {
    text: adminContent.pendingGuests.emptyText,
    title: adminContent.pendingGuests.emptyTitle,
  };
}
