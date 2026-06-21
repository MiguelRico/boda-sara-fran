import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Save, Trash2, X } from "lucide-react";

import { ADMIN_PASSWORD } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import {
  AdminEntityTabs,
  AdminPageShell,
  AdminPendingChangesActions,
  AdminTableSection,
  UnsavedChangesDialog,
} from "../components/admin/common";
import {
  AdminGuestPage,
  FiltersCard,
  GuestItemsPage,
  GuestTableActions,
  GuestTotalsPanel,
  GroupEditor,
} from "../components/admin/guests";
import { COMMON_ALLERGIES } from "../constants/rsvp";
import { storageKeys } from "../config/storageKeys";
import { Confirmation, Guest } from "../models";
import {
  loadAdminDataOnce,
  markAdminDataSaved,
  setAdminConfirmations,
} from "../services/adminDataStore";
import {
  buildPendingConfirmationChanges,
  getDuplicateContactErrors,
  persistGuestChanges,
  removeConfirmationFromList,
  upsertConfirmationInList,
} from "../services/guestsService";
import useSpinner from "../hooks/useSpinner";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useEffectiveSelection from "../hooks/useEffectiveSelection";
import useAdminActiveTab from "../hooks/useAdminActiveTab";
import useAdminLocalChanges from "../hooks/useAdminLocalChanges";
import { isAdminSessionAuthenticated } from "../utils/adminSession";
import {
  createDraftGroup,
  normalizeAdminGroupBeforeSave,
} from "../utils/drafts";
import { adminContent } from "../constants/adminContent";
import { normalizeAdminConfirmations } from "../utils/rsvpGroups";
import {
  buildGuestStats,
  filterGuestItems,
  findAdminRowForGroup,
  getDeleteTargetLabel,
  getGroupEmptyState,
  getGuestItems,
  getGuestListEmptyState,
  removeGuestFromConfirmationList,
} from "../utils/guestPageUtils";
import { DEFAULT_TABLE_PAGE_SIZE } from "../utils/paginationState";

const ADMIN_GUESTS_ACTIVE_TAB_KEY = storageKeys.adminActiveTabs.guests;
const getRowId = (item) => item.rowId;
const ADMIN_OUTBOUND_BUS_OPTIONS = [
  { value: "No", label: "No" },
  { value: "18:00", label: "18:00" },
  { value: "18:20", label: "18:20" },
];
const ADMIN_RETURN_BUS_OPTIONS = [
  { value: "No", label: "No" },
  { value: "3:00", label: "3:00" },
  { value: "6:00", label: "6:00" },
];

const emptyState = {
  confirmations: [],
  loading: true,
  error: "",
};

const createInitialPopup = () => ({
  closeText: adminContent.guests.dialogs.close,
  closeTo: null,
  eyebrow: "",
  message: "",
  open: false,
  title: "",
  type: "success",
});

const createAdminPopup = ({ message, title, type = "success" }) => ({
  closeText: adminContent.guests.dialogs.close,
  closeTo: null,
  eyebrow:
    type === "success"
      ? adminContent.guests.dialogs.successEyebrow
      : adminContent.guests.dialogs.warningEyebrow,
  message,
  open: true,
  title,
  type,
});

export default function AdminGuests() {
  const spinner = useSpinner();
  const guestsRef = useRef(null);
  const tableCardRef = useRef(null);
  const tableStartRef = useRef(null);
  const initialLoadStartedRef = useRef(false);
  const guestsInView = useInView(guestsRef, {
    once: true,
    amount: 0.18,
  });
  const isAuthenticated = isAdminSessionAuthenticated();
  const [state, setState] = useState(emptyState);
  const [savedConfirmations, setSavedConfirmations] = useState([]);
  const [confirmationQuery, setConfirmationQuery] = useState("");
  const [confirmationFilter, setConfirmationFilter] = useState("all");
  const [guestQuery, setGuestQuery] = useState("");
  const [guestFilter, setGuestFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [guestPage, setGuestPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingMode, setEditingMode] = useState("full");
  const [editingGuestIndex, setEditingGuestIndex] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popup, setPopup] = useState(createInitialPopup);
  const [activeTab, setActiveTab] = useAdminActiveTab(
    ADMIN_GUESTS_ACTIVE_TAB_KEY,
    "confirmations",
  );

  const loadGuests = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await loadAdminDataOnce({ password: ADMIN_PASSWORD });

      const confirmations = normalizeAdminConfirmations(response.confirmations);

      setSavedConfirmations(confirmations);
      setState({
        confirmations,
        loading: false,
        error: "",
      });
    } catch (error) {
      console.error(error);

      setState({
        confirmations: [],
        loading: false,
        error: adminContent.guests.dialogs.loadError,
      });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (initialLoadStartedRef.current) return;

    initialLoadStartedRef.current = true;

    const timeoutId = window.setTimeout(() => {
      loadGuests({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadGuests]);

  const rows = useMemo(
    () => Confirmation.toAdminRows(state.confirmations),
    [state.confirmations],
  );
  const visibleRows = useMemo(
    () =>
      Confirmation.filterAdminRows(
        rows,
        confirmationQuery,
        confirmationFilter,
      ),
    [confirmationFilter, confirmationQuery, rows],
  );
  const {
    currentPage,
    isMobileView,
    pageSize: rowPageSize,
    pagedItems: pagedRows,
    totalPages,
  } = usePagedData({
    items: visibleRows,
    page,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const { cancelPageLoading, handlePageChange, pageDirection } =
    usePageTransition({
      currentPage,
      onPageChange: setPage,
      totalPages,
    });
  const {
    effectiveSelectedId: effectiveSelectedRowId,
    selectedItem: selectedRow,
  } = useEffectiveSelection({
    allItems: visibleRows,
    currentPage,
    getId: getRowId,
    items: pagedRows,
    onPageChange: setPage,
    pageSize: rowPageSize,
    selectedId: selectedRowId,
  });

  const allGuestItems = useMemo(
    () => getGuestItems(state.confirmations),
    [state.confirmations],
  );
  const guestItems = useMemo(
    () => (selectedRow?.group ? getGuestItems([selectedRow.group]) : []),
    [selectedRow],
  );
  const guestStats = useMemo(
    () => buildGuestStats(rows, allGuestItems),
    [allGuestItems, rows],
  );
  const guestChartStats = useMemo(
    () =>
      Confirmation.buildStats(state.confirmations, {
        allergies: COMMON_ALLERGIES,
        outboundBusOptions: ADMIN_OUTBOUND_BUS_OPTIONS,
        returnBusOptions: ADMIN_RETURN_BUS_OPTIONS,
      }),
    [state.confirmations],
  );
  const visibleGuestItems = useMemo(
    () => filterGuestItems(guestItems, guestQuery, guestFilter),
    [guestFilter, guestItems, guestQuery],
  );
  const {
    currentPage: currentGuestPage,
    pageSize: guestPageSize,
    pagedItems: pagedGuestItems,
    totalPages: guestTotalPages,
  } = usePagedData({
    items: visibleGuestItems,
    page: guestPage,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const {
    handlePageChange: handleGuestPageChange,
    pageDirection: guestPageDirection,
  } = usePageTransition({
    currentPage: currentGuestPage,
    onPageChange: setGuestPage,
    totalPages: guestTotalPages,
  });
  const {
    effectiveSelectedId: effectiveSelectedGuestId,
    selectedItem: selectedGuestItem,
  } = useEffectiveSelection({
    allItems: visibleGuestItems,
    currentPage: currentGuestPage,
    getId: getRowId,
    items: pagedGuestItems,
    onPageChange: setGuestPage,
    pageSize: guestPageSize,
    selectedId: selectedGuestId,
  });
  const selectedGuestGroup =
    selectedGuestItem?.group || selectedRow?.group || null;
  const pendingChanges = useMemo(
    () =>
      buildPendingConfirmationChanges(savedConfirmations, state.confirmations),
    [savedConfirmations, state.confirmations],
  );
  const hasPendingChanges = pendingChanges.length > 0;

  const closePopup = () => {
    setPopup((current) => ({
      ...current,
      open: false,
    }));
  };

  const applyConfirmations = useCallback((confirmations) => {
    const normalizedGroups = setAdminConfirmations(confirmations);

    setState({
      confirmations: normalizedGroups,
      loading: false,
      error: "",
    });

    return normalizedGroups;
  }, []);

  const openGroupEditor = (group, mode = "full", guestIndex = null) => {
    setEditingMode(mode);
    setEditingGuestIndex(guestIndex);
    setEditingGroup(createDraftGroup(group));
  };

  const openGuestEditor = (guestItem) => {
    if (!guestItem?.group) return;

    openGroupEditor(guestItem.group, "guest", guestItem.guestIndex);
  };
  const openNewGuestEditor = (group) => {
    if (!group) return;

    const currentGuests = Guest.normalizeList(group.guests, {
      ensureOne: false,
    });

    openGroupEditor(
      {
        ...group,
        guests: [...currentGuests, Guest.create()],
      },
      "newGuest",
      currentGuests.length,
    );
  };

  const validateUniqueGroupContact = useCallback(
    (group) => getDuplicateContactErrors(group, state.confirmations),
    [state.confirmations],
  );

  const handleSaveGroup = async (group) => {
    const isCreation = !editingGroup?.confirmationName;
    const groupToSave = normalizeAdminGroupBeforeSave(group, { isCreation });
    const nextConfirmations = upsertConfirmationInList(
      state.confirmations,
      groupToSave,
    );
    const normalizedGroups = applyConfirmations(nextConfirmations);
    const selectedRow = findAdminRowForGroup(normalizedGroups, groupToSave);

    if (selectedRow) {
      setSelectedRowId(selectedRow.rowId);
    }

    if (editingMode === "guest") {
      const guestItems = getGuestItems([selectedRow?.group || groupToSave]);
      const selectedGuest =
        editingGuestIndex == null
          ? guestItems.at(-1)
          : guestItems[Number(editingGuestIndex)];

      setSelectedGuestId(selectedGuest?.rowId || "");
    } else {
      setConfirmationFilter("all");
      setConfirmationQuery("");
      setSelectedGuestId("");
    }

    setEditingGroup(null);
    setPopup(
      createAdminPopup({
        message: adminContent.guests.dialogs.pendingMessage,
        title: adminContent.guests.dialogs.pendingTitle,
      }),
    );
  };

  const handleDeleteTarget = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "guest") {
      applyConfirmations(
        removeGuestFromConfirmationList(
          state.confirmations,
          deleteTarget.group,
          deleteTarget.guestIndex,
        ),
      );
      setSelectedGuestId("");
      setGuestPage(1);
    } else {
      applyConfirmations(
        removeConfirmationFromList(state.confirmations, deleteTarget.group),
      );
      setSelectedRowId("");
      setSelectedGuestId("");
      setPage(1);
      setGuestPage(1);
    }

    setDeleteTarget(null);
    setPopup(
      createAdminPopup({
        message: adminContent.guests.dialogs.pendingMessage,
        title: adminContent.guests.dialogs.pendingTitle,
      }),
    );
  };

  const handleSavePendingChanges = async () => {
    if (!hasPendingChanges) return true;

    try {
      spinner.show(adminContent.guests.spinner.saveChanges);

      await persistGuestChanges({
        currentConfirmations: state.confirmations,
        password: ADMIN_PASSWORD,
        savedConfirmations,
      });

      const normalizedGroups = setAdminConfirmations(state.confirmations);
      markAdminDataSaved({ confirmations: normalizedGroups });
      setSavedConfirmations(normalizedGroups);
      setState({
        confirmations: normalizedGroups,
        loading: false,
        error: "",
      });
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.updatedMessage,
          title: adminContent.guests.dialogs.updatedTitle,
        }),
      );
      return true;
    } catch (error) {
      console.error(error);
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.saveError,
          title: adminContent.guests.dialogs.problemTitle,
          type: "error",
        }),
      );
      return false;
    } finally {
      spinner.hide();
    }
  };

  const handleDiscardPendingChanges = useCallback(() => {
    const restoredConfirmations = setAdminConfirmations(savedConfirmations);

    setState({
      confirmations: restoredConfirmations,
      loading: false,
      error: "",
    });
    setEditingGroup(null);
    setDeleteTarget(null);

    const restoredRows = Confirmation.toAdminRows(restoredConfirmations);
    const restoredVisibleRows = Confirmation.filterAdminRows(
      restoredRows,
      confirmationQuery,
      confirmationFilter,
    );
    const restoredTotalPages = Math.max(
      Math.ceil(
        restoredVisibleRows.length / DEFAULT_TABLE_PAGE_SIZE,
      ),
      1,
    );

    setPage((current) => Math.min(current, restoredTotalPages));
  }, [
    confirmationFilter,
    confirmationQuery,
    savedConfirmations,
  ]);

  const {
    blocker,
    cancelBlockedNavigation,
    discardAndContinueNavigation,
    saveAndContinueNavigation,
  } = useAdminLocalChanges({
    hasPendingChanges,
    onDiscard: handleDiscardPendingChanges,
    onSave: handleSavePendingChanges,
  });

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      {blocker.state === "blocked" && (
        <UnsavedGuestChangesDialog
          changes={pendingChanges}
          onCancel={cancelBlockedNavigation}
          onConfirm={discardAndContinueNavigation}
          onSaveAndExit={saveAndContinueNavigation}
          saving={spinner.loading}
        />
      )}

      <AdminPageShell
        header={adminContent.guests.header}
        innerClassName="max-w-7xl py-6"
        isVisible={guestsInView}
        rootRef={guestsRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={guestsInView}>
          <GuestTotalsPanel
            chartStats={guestChartStats}
            loading={state.loading}
            stats={guestStats}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.guests.actions.discardChanges}
            discardDialogText={adminContent.guests.dialogs.discardPendingText}
            discardDialogTitle={adminContent.guests.dialogs.discardPendingTitle}
            hasPendingChanges={hasPendingChanges}
            loading={state.loading}
            onDiscard={handleDiscardPendingChanges}
            onSave={handleSavePendingChanges}
            saveLabel={adminContent.guests.actions.saveChanges}
            saving={spinner.loading}
            showText={!isMobileView}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={guestsInView}>
          <AdminEntityTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={adminContent.guests.tabs}
          >
            {activeTab === "confirmations" ? (
              <AdminTableSection
                actions={
                  <GuestTableActions
                    loading={state.loading}
                    onCreate={() => openGroupEditor(undefined, "group")}
                    rows={rows}
                    showText={!isMobileView}
                  />
                }
                contentRef={tableStartRef}
                eyebrow={adminContent.guests.list.eyebrow}
                filters={
                  <FiltersCard
                    filter={confirmationFilter}
                    onFilterChange={(value) => {
                      cancelPageLoading();
                      setConfirmationFilter(value);
                    }}
                    onQueryChange={(value) => {
                      cancelPageLoading();
                      setConfirmationQuery(value);
                    }}
                    query={confirmationQuery}
                  />
                }
                getKey={(row) => row.rowId}
                isMobileView={isMobileView}
                items={visibleRows}
                loading={state.loading}
                mobilePageLabel={adminContent.guests.list.mobilePageLabel}
                onNextPage={() =>
                  handlePageChange(currentPage + 1)
                }
                onPrevPage={() =>
                  handlePageChange(currentPage - 1)
                }
                page={currentPage}
                pageDirection={pageDirection}
                pageLabel={adminContent.guests.list.pageLabel}
                pageSize={rowPageSize}
                renderMeasurePage={(items) => (
                  <AdminGuestPage
                    emptyState={getGroupEmptyState(rows.length)}
                    items={items}
                    onDeleteGroup={(row) =>
                      setDeleteTarget({ type: "group", group: row.group })
                    }
                    onEditGroup={(row) => openGroupEditor(row.group, "group")}
                    onSelect={() => {}}
                    selectedRowId={effectiveSelectedRowId}
                  />
                )}
                renderPage={(items) => (
                  <AdminGuestPage
                    emptyState={getGroupEmptyState(rows.length)}
                    items={items}
                    onDeleteGroup={(row) =>
                      setDeleteTarget({ type: "group", group: row.group })
                    }
                    onEditGroup={(row) => openGroupEditor(row.group, "group")}
                    onSelect={(row) => {
                      setSelectedRowId(row.rowId);
                      setGuestPage(1);
                      setSelectedGuestId("");
                    }}
                    selectedRowId={effectiveSelectedRowId}
                  />
                )}
                sectionRef={tableCardRef}
                sourceItemsCount={rows.length}
                skeletonConfig={{
                  actionCount: 3,
                  content: {
                    itemClassName: "min-h-40",
                    lines: 2,
                  },
                  filters: true,
                }}
                title={adminContent.guests.list.title}
                totalPages={totalPages}
              />
            ) : (
              <AdminTableSection
                actions={
                  selectedGuestGroup ? (
                    <GuestTableActions
                      loading={state.loading}
                      onCreate={
                        selectedGuestGroup
                          ? () => openNewGuestEditor(selectedGuestGroup)
                          : null
                      }
                      rows={visibleGuestItems}
                      showText={!isMobileView}
                    />
                  ) : null
                }
                contentRef={tableStartRef}
                count={
                  selectedGuestGroup
                    ? `${adminContent.guests.list.pageLabel}: ${
                        selectedGuestGroup.confirmationName ||
                        selectedGuestGroup.email ||
                        adminContent.common.fallbacks.confirmation
                      }`
                    : ""
                }
                eyebrow={adminContent.guests.guestList.eyebrow}
                filters={
                  <FiltersCard
                    filter={guestFilter}
                    onFilterChange={(value) => {
                      cancelPageLoading();
                      setGuestFilter(value);
                    }}
                    onQueryChange={(value) => {
                      cancelPageLoading();
                      setGuestQuery(value);
                    }}
                    query={guestQuery}
                  />
                }
                getKey={(guest) => guest.rowId}
                isMobileView={isMobileView}
                items={visibleGuestItems}
                loading={state.loading}
                mobilePageLabel={adminContent.guests.guestList.mobilePageLabel}
                onNextPage={() => handleGuestPageChange(currentGuestPage + 1)}
                onPrevPage={() => handleGuestPageChange(currentGuestPage - 1)}
                page={currentGuestPage}
                pageDirection={guestPageDirection}
                pageLabel={adminContent.guests.list.pageLabel}
                pageSize={guestPageSize}
                renderMeasurePage={(items) => (
                  <GuestItemsPage
                    emptyState={getGuestListEmptyState(
                      rows.length,
                      guestItems.length,
                      selectedGuestGroup,
                    )}
                    items={items}
                    onDelete={(guest) =>
                      setDeleteTarget({
                        type: "guest",
                        group: guest.group,
                        guest,
                        guestIndex: guest.guestIndex,
                      })
                    }
                    onEdit={openGuestEditor}
                    onSelect={() => {}}
                    selectedGuestId={effectiveSelectedGuestId}
                  />
                )}
                renderPage={(items) => (
                  <GuestItemsPage
                    emptyState={getGuestListEmptyState(
                      rows.length,
                      guestItems.length,
                      selectedGuestGroup,
                    )}
                    items={items}
                    onDelete={(guest) =>
                      setDeleteTarget({
                        type: "guest",
                        group: guest.group,
                        guest,
                        guestIndex: guest.guestIndex,
                      })
                    }
                    onEdit={openGuestEditor}
                    onSelect={(guest) => setSelectedGuestId(guest.rowId)}
                    selectedGuestId={effectiveSelectedGuestId}
                  />
                )}
                sectionRef={tableCardRef}
                sourceItemsCount={guestItems.length}
                skeletonConfig={{
                  actionCount: 3,
                  content: {
                    itemClassName: "min-h-40",
                    lines: 2,
                  },
                  filters: true,
                }}
                title={adminContent.guests.guestList.title}
                totalPages={guestTotalPages}
              />
            )}
          </AdminEntityTabs>
        </CinematicStaggeredRevealItem>
      </AdminPageShell>

      {editingGroup && (
        <GroupEditor
          group={editingGroup}
          isCreation={!editingGroup.confirmationName}
          mode={editingMode}
          guestIndex={editingGuestIndex}
          onClose={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
          validateUniqueContact={validateUniqueGroupContact}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          message={
            deleteTarget.type === "guest"
              ? adminContent.guests.dialogs.guestDeleteMessage(
                  getDeleteTargetLabel(deleteTarget),
                )
              : adminContent.guests.dialogs.deleteMessage(
                  getDeleteTargetLabel(deleteTarget),
                )
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTarget}
          title={
            deleteTarget.type === "guest"
              ? adminContent.guests.dialogs.guestDeleteTitle
              : adminContent.guests.dialogs.deleteTitle
          }
        />
      )}

      <StatusDialog
        closeText={popup.closeText}
        closeTo={popup.closeTo}
        eyebrow={popup.eyebrow}
        message={popup.message}
        onClose={closePopup}
        open={popup.open}
        title={popup.title}
        type={popup.type}
      />

      <StatusDialog
        eyebrow={adminContent.guests.dialogs.warningEyebrow}
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title={adminContent.guests.dialogs.problemTitle}
        type="error"
      />
    </CinematicPage>
  );
}
function UnsavedGuestChangesDialog({
  changes,
  mode = "navigate",
  onCancel,
  onConfirm,
  onSave,
  onSaveAndExit,
  saving = false,
}) {
  const isSaveMode = mode === "save";

  return (
    <UnsavedChangesDialog
      actions={
        isSaveMode
          ? [
              {
                disabled: saving,
                icon: <Save size={16} strokeWidth={1.8} />,
                label: adminContent.guests.actions.saveChanges,
                onClick: onSave,
                tone: "primary",
              },
              {
                disabled: saving,
                icon: <X size={16} strokeWidth={1.8} />,
                label: adminContent.guests.dialogs.keepEditing,
                onClick: onCancel,
                tone: "terciary",
              },
            ]
          : [
              {
                icon: <Trash2 size={16} strokeWidth={1.8} />,
                label: adminContent.guests.dialogs.exitWithoutSaving,
                onClick: onConfirm,
                tone: "danger",
              },
              {
                disabled: saving,
                icon: <Save size={16} strokeWidth={1.8} />,
                label: adminContent.guests.dialogs.saveAndExit,
                onClick: onSaveAndExit,
                tone: "primary",
              },
              {
                icon: <X size={16} strokeWidth={1.8} />,
                label: adminContent.guests.dialogs.keepEditing,
                onClick: onCancel,
                tone: "terciary",
              },
            ]
      }
      changes={changes}
      labels={{
        eyebrow: adminContent.guests.dialogs.warningEyebrow,
        exitWithoutSaving: adminContent.guests.dialogs.exitWithoutSaving,
        keepEditing: adminContent.guests.dialogs.keepEditing,
        saveAndExit: adminContent.guests.dialogs.saveAndExit,
        text: isSaveMode
          ? "Se enviaran estos cambios a Apps Script."
          : adminContent.guests.dialogs.unsavedText,
        title: isSaveMode
          ? adminContent.guests.actions.saveChanges
          : adminContent.guests.dialogs.unsavedTitle,
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onSaveAndExit={onSaveAndExit}
      titleId="unsaved-guest-changes-title"
    />
  );
}
