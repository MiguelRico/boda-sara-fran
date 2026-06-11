import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, Plus, Save, Search, Trash2, UsersRound, X } from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import IconButton from "../components/ui/IconButton";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import AdminEntityTabs from "../components/admin/AdminEntityTabs";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import AdminPageShell from "../components/admin/AdminPageShell";
import AdminEditorDialog from "../components/admin/AdminEditorDialog";
import Card from "../components/admin/Card";
import SelectableCardPage from "../components/admin/SelectableCardPage";
import AdminTableSection from "../components/admin/AdminTableSection";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import GuestTotalsPanel from "../components/admin/GuestTotalsPanel";
import TableGuestCard from "../components/admin/TableGuestCard";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import Chip from "../components/ui/Chip";
import RsvpForm from "../forms/RsvpForm";
import { MAX_GUESTS } from "../constants/rsvp";
import { Confirmation, Guest } from "../models";
import {
  deleteAdminConfirmation,
  saveAdminConfirmation,
} from "../api/confirmationsApi";
import {
  loadAdminDataOnce,
  markAdminDataSaved,
  setAdminConfirmations,
} from "../services/adminDataStore";
import {
  inputClassName,
  Label,
  selectClassName,
} from "../components/rsvp/FormPrimitives";
import useSpinner from "../hooks/useSpinner";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useEffectiveSelection from "../hooks/useEffectiveSelection";
import useAdminActiveTab from "../hooks/useAdminActiveTab";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";
import {
  createDraftGroup,
  normalizeAdminGroupBeforeSave,
} from "../utils/drafts";
import { getGroupSummaryChips } from "../utils/rsvpSummaryChips";
import { adminContent } from "../constants/adminContent";
import { normalizeAdminConfirmations } from "../utils/rsvpGroups";
import { validateRsvpContact, validateRsvpForm } from "../utils/rsvpValidation";

const desktopPageSize = 8;
const mobilePageSize = 1;
const filters = adminContent.guests.filters.options;
const ADMIN_GUESTS_ACTIVE_TAB_KEY = "adminGuestsActiveTab";
const getRowId = (item) => item.rowId;

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
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
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
    pagedItems: pagedRows,
    totalPages,
  } = usePagedData({
    desktopPageSize,
    items: visibleRows,
    mobilePageSize,
    page,
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
    getId: getRowId,
    items: pagedRows,
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
    desktopPageSize,
    items: visibleGuestItems,
    mobilePageSize,
    page: guestPage,
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
    getId: getRowId,
    items: pagedGuestItems,
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

  const blocker = useUnsavedChangesNavigation(hasPendingChanges);

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
      "guest",
      currentGuests.length,
    );
  };

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
      setGuestPage(1);
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
      setPage(1);
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
    } else {
      applyConfirmations(
        removeConfirmationFromList(state.confirmations, deleteTarget.group),
      );
      setSelectedRowId("");
      setSelectedGuestId("");
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
        restoredVisibleRows.length /
          (isMobileView ? mobilePageSize : desktopPageSize),
      ),
      1,
    );

    setPage((current) => Math.min(current, restoredTotalPages));
  }, [
    confirmationFilter,
    confirmationQuery,
    isMobileView,
    savedConfirmations,
  ]);

  const handleCancelBlockedNavigation = () => {
    blocker.reset?.();
  };

  const handleConfirmBlockedNavigation = () => {
    handleDiscardPendingChanges();
    blocker.proceed?.();
  };

  const handleSaveAndExitBlockedNavigation = async () => {
    const saved = await handleSavePendingChanges();

    if (saved) {
      blocker.proceed?.();
      return;
    }

    blocker.reset?.();
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      {blocker.state === "blocked" && (
        <UnsavedGuestChangesDialog
          changes={pendingChanges}
          onCancel={handleCancelBlockedNavigation}
          onConfirm={handleConfirmBlockedNavigation}
          onSaveAndExit={handleSaveAndExitBlockedNavigation}
          saving={spinner.loading}
        />
      )}

      <AdminPageShell
        header={adminContent.guests.header}
        innerClassName="max-w-7xl py-6"
        isMobileView={isMobileView}
        isVisible={guestsInView}
        rootRef={guestsRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={guestsInView}>
          <GuestTotalsPanel loading={state.loading} stats={guestStats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.guests.actions.discardChanges}
            discardDialogText="Se desharan los cambios pendientes de confirmaciones e invitados."
            discardDialogTitle="Deshacer cambios de invitados"
            hasPendingChanges={hasPendingChanges}
            loading={state.loading}
            onDiscard={handleDiscardPendingChanges}
            saveLabel={adminContent.guests.actions.saveChanges}
            saving={spinner.loading}
            showSave={false}
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
                      setPage(1);
                    }}
                    onQueryChange={(value) => {
                      cancelPageLoading();
                      setConfirmationQuery(value);
                      setPage(1);
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
                  handlePageChange(currentPage + 1, tableStartRef.current)
                }
                onPrevPage={() =>
                  handlePageChange(currentPage - 1, tableStartRef.current)
                }
                page={currentPage}
                pageDirection={pageDirection}
                pageLabel={adminContent.guests.list.pageLabel}
                pageSize={isMobileView ? mobilePageSize : desktopPageSize}
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
                  content: {
                    columnsClassName: "lg:grid-cols-2",
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
                        "Confirmación sin nombre"
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
                      setGuestPage(1);
                    }}
                    onQueryChange={(value) => {
                      cancelPageLoading();
                      setGuestQuery(value);
                      setGuestPage(1);
                    }}
                    query={guestQuery}
                  />
                }
                getKey={(guest) => guest.rowId}
                isMobileView={isMobileView}
                items={visibleGuestItems}
                loading={state.loading}
                mobilePageLabel={adminContent.guests.guestList.mobilePageLabel}
                onNextPage={() =>
                  handleGuestPageChange(
                    currentGuestPage + 1,
                    tableStartRef.current,
                  )
                }
                onPrevPage={() =>
                  handleGuestPageChange(
                    currentGuestPage - 1,
                    tableStartRef.current,
                  )
                }
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
                  content: {
                    columnsClassName: "lg:grid-cols-2",
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
          isMobileView={isMobileView}
          isCreation={!editingGroup.confirmationName}
          mode={editingMode}
          guestIndex={editingGuestIndex}
          onClose={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
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

function FiltersCard({ filter, onFilterChange, onQueryChange, query }) {
  const selectedFilter = filters.find((item) => item.value === filter);
  const activeFilters = [
    query.trim()
      ? {
          key: "query",
          label: query.trim(),
          onRemove: () => onQueryChange(""),
        }
      : null,
    filter !== "all" && selectedFilter
      ? {
          key: "filter",
          label: selectedFilter.label,
          onRemove: () => onFilterChange("all"),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      className="mb-4"
      title={adminContent.guests.filters.eyebrow}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <Label>{adminContent.guests.filters.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={adminContent.guests.filters.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>{adminContent.guests.filters.showLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onFilterChange(event.target.value)}
            value={filter}
          >
            {filters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

function GuestTableActions({ loading, onCreate, rows, showText = true }) {
  void rows;

  if (!onCreate) return null;

  return (
    <div className="grid w-full gap-3">
      <IconButton
        className="w-full"
        disabled={loading}
        icon={<Plus size={18} strokeWidth={2.4} />}
        label={adminContent.guests.actions.create}
        onClick={onCreate}
        showText={showText ? "always" : undefined}
        tone="primary"
        type="button"
      >
        {showText ? adminContent.guests.actions.create : undefined}
      </IconButton>
    </div>
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

function GuestItemsPage({
  emptyState,
  items,
  onDelete,
  onEdit,
  onSelect,
  selectedGuestId,
}) {
  return (
    <SelectableCardPage
      emptyIcon={UsersRound}
      emptyState={{
        text: emptyState?.text || adminContent.guests.list.emptyText,
        title: emptyState?.title || adminContent.guests.list.emptyTitle,
      }}
      getKey={(guest) => guest.rowId}
      items={items}
      renderCard={(guest) => (
        <GuestItemCard
          guestItem={guest}
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
          selected={guest.rowId === selectedGuestId}
        />
      )}
    />
  );
}

function GuestItemCard({ guestItem, onDelete, onEdit, onSelect, selected }) {
  return (
    <div
      className={`h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(guestItem)}
    >
      <TableGuestCard
        actions={
          <CardActionButtons
            deleteLabel={adminContent.guests.actions.delete}
            editLabel={adminContent.guests.actions.edit}
            onDelete={(event) => {
              event.stopPropagation();
              onDelete?.(guestItem);
            }}
            onEdit={(event) => {
              event.stopPropagation();
              onEdit?.(guestItem);
            }}
          />
        }
        decorativeText={guestItem.guestIndex + 1}
        eyebrow={guestItem.confirmationName}
        guest={guestItem}
      />
    </div>
  );
}

function AdminGuestPage({
  emptyState,
  items,
  onDeleteGroup,
  onEditGroup,
  onSelect,
  selectedRowId,
}) {
  return (
    <SelectableCardPage
      emptyIcon={UsersRound}
      emptyState={{
        text: emptyState?.text || adminContent.guests.list.emptyText,
        title: emptyState?.title || adminContent.guests.list.emptyTitle,
      }}
      getKey={(row) => row.rowId}
      items={items}
      renderCard={(row) => (
        <AdminGuestConfirmationCard
          onDeleteGroup={onDeleteGroup}
          onEditGroup={onEditGroup}
          onSelect={onSelect}
          row={row}
          selected={row.rowId === selectedRowId}
        />
      )}
    />
  );
}

function AdminGuestConfirmationCard({
  onDeleteGroup,
  onEditGroup,
  onSelect,
  row,
  selected,
  titleRef,
  titleStyle,
}) {
  const chips = getGroupSummaryChips(row, row.guests);

  return (
    <div
      className={`relative h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(row)}
    >
      <Card
        actionsPlacement="overlay"
        actions={
          <CardActionButtons
            deleteLabel={adminContent.guests.actions.delete}
            editLabel={adminContent.guests.actions.edit}
            onDelete={(event) => {
              event.stopPropagation();
              onDeleteGroup?.(row);
            }}
            onEdit={(event) => {
              event.stopPropagation();
              onEditGroup?.(row);
            }}
          />
        }
        decorativeText={row.groupSize}
        eyebrow={`${row.groupSize} ${
          row.groupSize === 1 ? "persona" : "personas"
        }`}
        title={row.confirmationName || "Grupo sin nombre"}
        titleRef={titleRef}
        titleStyle={titleStyle}
      >
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chips.map((chip) => (
            <Chip
              className={chip.className}
              href={chip.href}
              icon={chip.icon}
              key={chip.key}
              strong={chip.strong}
              tone={chip.tone}
              value={chip.value}
              valueClassName={chip.valueClassName}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function CardActionButtons({ deleteLabel, editLabel, onDelete, onEdit }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 self-start">
      <IconButton
        className="h-10 w-10 !px-0"
        icon={<Trash2 size={16} strokeWidth={1.8} />}
        label={deleteLabel}
        onClick={onDelete}
        tone="danger"
        type="button"
      />
      <IconButton
        className="h-10 w-10 !px-0"
        icon={<Pencil size={16} strokeWidth={1.8} />}
        label={editLabel}
        onClick={onEdit}
        tone="primary"
        type="button"
      />
    </div>
  );
}

function GroupEditor({
  group,
  guestIndex = null,
  isCreation,
  isMobileView = false,
  mode = "full",
  onClose,
  onSave,
}) {
  const isSingleGuestMode = mode === "guest";
  const initialDraft = useMemo(
    () =>
      isSingleGuestMode
        ? {
            ...group,
            guests: [group.guests?.[guestIndex] || Guest.create()],
          }
        : group,
    [group, guestIndex, isSingleGuestMode],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState({});
  const [validationPopupOpen, setValidationPopupOpen] = useState(false);
  const [unsavedChangesOpen, setUnsavedChangesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedDraftSnapshot = useMemo(
    () =>
      getStableJson(
        normalizeAdminGroupBeforeSave(initialDraft, { isCreation }),
      ),
    [initialDraft, isCreation],
  );
  const currentDraftSnapshot = useMemo(
    () => getStableJson(normalizeAdminGroupBeforeSave(draft, { isCreation })),
    [draft, isCreation],
  );
  const hasUnsavedChanges = savedDraftSnapshot !== currentDraftSnapshot;
  const pendingChanges = useMemo(
    () => buildGroupEditorChanges(group, draft, { isCreation }),
    [draft, group, isCreation],
  );
  const renderFormItem = (index, children) => (
    <CinematicStaggeredRevealItem index={index} isVisible key={index}>
      {children}
    </CinematicStaggeredRevealItem>
  );
  const isGuestListMode = mode === "guests" || isSingleGuestMode;
  const isGroupMode = mode === "group";
  const dialogTitle = isSingleGuestMode
    ? adminContent.guests.dialogs.guestEditorTitle
    : isGuestListMode
      ? adminContent.guests.dialogs.guestListEditorTitle
      : isCreation
        ? adminContent.guests.dialogs.groupCreateTitle
        : adminContent.guests.dialogs.groupEditorTitle;

  const handleRequestClose = () => {
    if (saving) return;

    if (hasUnsavedChanges) {
      setUnsavedChangesOpen(true);
      return;
    }

    onClose();
  };

  const handleDiscardChanges = () => {
    setUnsavedChangesOpen(false);
    onClose();
  };

  const updateContact = (field, value) => {
    setDraft((current) =>
      Confirmation.withUpdatedContact(current, field, value),
    );
  };

  const updateGuest = (index, field, value) => {
    setDraft((current) =>
      Confirmation.withUpdatedGuest(current, index, field, value),
    );
  };

  const addGuest = () => {
    setDraft((current) =>
      Confirmation.withAddedGuest(current, { maxGuests: MAX_GUESTS }),
    );
  };

  const removeGuest = (index) => {
    setDraft((current) => Confirmation.withRemovedGuest(current, index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const groupDraft = isGroupMode
      ? {
          ...draft,
          guests: isCreation
            ? []
            : Guest.normalizeList(group.guests, { ensureOne: false }),
        }
      : draft;
    const groupToSave = normalizeAdminGroupBeforeSave(groupDraft, {
      isCreation,
    });
    const validationErrors = isGroupMode
      ? validateRsvpContact(groupToSave)
      : validateRsvpForm({
          contact: groupToSave,
          guests: groupToSave.guests,
        });

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setValidationPopupOpen(true);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await onSave(
        isSingleGuestMode
          ? mergeSingleGuestIntoGroup(group, groupToSave.guests[0], guestIndex)
          : groupToSave,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminEditorDialog
      onClose={handleRequestClose}
      title={dialogTitle}
      titleId="group-editor-title"
    >
      <RsvpForm
        addText="Invitado"
        cancelText="Cancelar"
        contact={draft}
        deleteContextText="editor"
        disableContactFields={{ confirmationName: !isCreation }}
        errors={errors}
        guests={draft.guests}
        isMobileView={isMobileView}
        loading={saving}
        onAddGuest={addGuest}
        onCancel={handleRequestClose}
        onContactChange={updateContact}
        onGuestChange={updateGuest}
        onRemoveGuest={removeGuest}
        onSubmit={handleSubmit}
        renderItem={renderFormItem}
        canAddGuests={!isSingleGuestMode}
        showContactDetails={!isGuestListMode}
        showGuestList={!isGroupMode}
        submitText="Guardar"
        variant="admin"
      />

      <StatusDialog
        closeText="Cerrar"
        eyebrow={adminContent.guests.dialogs.warningEyebrow}
        message={adminContent.guests.dialogs.validationMessage}
        onClose={() => setValidationPopupOpen(false)}
        open={validationPopupOpen}
        title={adminContent.guests.dialogs.validationTitle}
        type="error"
      />

      {unsavedChangesOpen && (
        <DeleteDialog
          confirmText={adminContent.guests.dialogs.discardChanges}
          message={adminContent.guests.dialogs.unsavedMessage}
          onCancel={() => setUnsavedChangesOpen(false)}
          onConfirm={handleDiscardChanges}
          title={adminContent.guests.dialogs.unsavedTitle}
        >
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-left text-sm text-[var(--color-muted)]">
            {pendingChanges.map((change, index) => (
              <li
                className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
                key={`${change}-${index}`}
              >
                {change}
              </li>
            ))}
          </ul>
        </DeleteDialog>
      )}
    </AdminEditorDialog>
  );
}
function getGuestItems(confirmations) {
  return normalizeAdminConfirmations(confirmations).flatMap((group) =>
    Guest.normalizeList(group.guests, { ensureOne: false }).map(
      (guest, guestIndex) => ({
        ...guest,
        email: group.email,
        group,
        confirmationName: group.confirmationName,
        guestIndex,
        phone: group.phone,
        rowId: `${group.confirmationId || group.id || group.confirmationName || "group"}-${guest.guestId || guest.id || guestIndex}`,
      }),
    ),
  );
}

function findAdminRowForGroup(confirmations, group) {
  const targetKey = getConfirmationKey(group);

  return Confirmation.toAdminRows(confirmations).find(
    (row) => getConfirmationKey(row.group) === targetKey,
  );
}

function removeGuestFromConfirmationList(confirmations, group, guestIndex) {
  const targetKey = getConfirmationKey(group);

  return Confirmation.normalizeList(confirmations).map((confirmation) =>
    getConfirmationKey(confirmation) === targetKey
      ? Confirmation.withRemovedGuest(confirmation, guestIndex)
      : confirmation,
  );
}

function getDeleteTargetLabel(deleteTarget) {
  if (deleteTarget.type === "guest") {
    return Guest.getFullName(deleteTarget.guest, "este invitado");
  }

  return (
    deleteTarget.group?.confirmationName ||
    deleteTarget.group?.email ||
    "esta confirmación"
  );
}

function mergeSingleGuestIntoGroup(group, editedGuest, guestIndex) {
  const normalizedGroup = Confirmation.normalize(group);
  const normalizedGuestIndex = Number(guestIndex);

  if (
    !editedGuest ||
    !Number.isInteger(normalizedGuestIndex) ||
    normalizedGuestIndex < 0
  ) {
    return normalizedGroup;
  }

  if (normalizedGuestIndex >= normalizedGroup.guests.length) {
    return Confirmation.normalize({
      ...normalizedGroup,
      guests: [
        ...normalizedGroup.guests,
        {
          ...editedGuest,
          confirmationId:
            normalizedGroup.confirmationId || normalizedGroup.id || "",
          confirmationName: normalizedGroup.confirmationName,
        },
      ],
    });
  }

  return Confirmation.normalize({
    ...normalizedGroup,
    guests: normalizedGroup.guests.map((guest, index) =>
      index === normalizedGuestIndex
        ? {
            ...editedGuest,
            confirmationId: guest.confirmationId || editedGuest.confirmationId,
            guestId: guest.guestId || guest.id || editedGuest.guestId,
            confirmationName:
              guest.confirmationName || editedGuest.confirmationName,
            id: guest.id || guest.guestId || editedGuest.id,
          }
        : guest,
    ),
  });
}

function filterGuestItems(guests, query, filter) {
  const normalizedQuery = String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return guests.filter((guest) => {
    const searchableText = [
      guest.email,
      guest.phone,
      guest.confirmationName,
      Guest.getFullName(guest),
      guest.menu,
    ]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesFilter =
      filter === "all" ||
      (filter === "allergies" && Guest.hasAllergies(guest)) ||
      (filter === "bus" && Guest.usesBus(guest)) ||
      (filter === "comments" && Guest.hasComments(guest));

    return matchesQuery && matchesFilter;
  });
}

function buildGuestStats(rows, guests) {
  return {
    allergyCount: guests.filter(
      (guest) => Guest.normalize(guest).allergies.length > 0,
    ).length,
    commentsCount: guests.filter(Guest.hasComments).length,
    fishCount: guests.filter((guest) => guest.menu === "Pescado").length,
    groupCount: rows.length,
    guestCount: guests.length,
    meatCount: guests.filter((guest) => guest.menu === "Carne").length,
    otherAllergyCount: guests.filter(Guest.hasOtherAllergies).length,
    outboundBusCount: guests.filter(
      (guest) => guest.outboundBus && guest.outboundBus !== "No",
    ).length,
    returnBusCount: guests.filter(
      (guest) => guest.returnBus && guest.returnBus !== "No",
    ).length,
  };
}

function getGroupEmptyState(groupCount) {
  if (groupCount > 0) {
    return {
      text: adminContent.guests.list.emptyText,
      title: adminContent.guests.list.emptyTitle,
    };
  }

  return {
    text: adminContent.guests.list.noConfirmationsText,
    title: adminContent.guests.list.noConfirmationsTitle,
  };
}

function getGuestListEmptyState(groupCount, guestCount, selectedGroup) {
  if (groupCount === 0) {
    return {
      text: adminContent.guests.guestList.noConfirmationsText,
      title: adminContent.guests.guestList.noConfirmationsTitle,
    };
  }

  if (!selectedGroup) {
    return {
      text: adminContent.guests.guestList.noSelectionText,
      title: adminContent.guests.guestList.noSelectionTitle,
    };
  }

  if (guestCount > 0) {
    return {
      text: adminContent.guests.guestList.noFilterText,
      title: adminContent.guests.list.emptyTitle,
    };
  }

  return {
    text: adminContent.guests.guestList.noGuestsText,
    title: adminContent.guests.guestList.noGuestsTitle,
  };
}

function getStableJson(value) {
  return JSON.stringify(value);
}

function upsertConfirmationInList(confirmations, group) {
  const normalizedGroup = normalizeAdminConfirmations([group])[0];
  const normalizedKey = getConfirmationKey(normalizedGroup);
  const existingIndex = confirmations.findIndex((item) => {
    const itemKey = getConfirmationKey(item);

    return normalizedKey ? itemKey === normalizedKey : false;
  });

  if (existingIndex === -1) {
    return normalizeAdminConfirmations([...confirmations, normalizedGroup]);
  }

  return normalizeAdminConfirmations(
    confirmations.map((item, index) =>
      index === existingIndex ? normalizedGroup : item,
    ),
  );
}

function getConfirmationKey(group) {
  const normalizedGroup = group || {};

  return (
    normalizedGroup.confirmationId ||
    normalizedGroup.id ||
    `draft:${normalizedGroup.email || ""}:${normalizedGroup.phone || ""}`
  );
}

function removeConfirmationFromList(confirmations, target) {
  const targetKey = getConfirmationKey(target);

  return normalizeAdminConfirmations(
    confirmations.filter(
      (group) => group !== target && getConfirmationKey(group) !== targetKey,
    ),
  );
}

async function persistGuestChanges({
  currentConfirmations,
  savedConfirmations,
}) {
  const savedByconfirmationName = new Map(
    savedConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const currentByconfirmationName = new Map(
    currentConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const persistencePromises = [];

  savedByconfirmationName.forEach((group, confirmationName) => {
    if (!currentByconfirmationName.has(confirmationName)) {
      persistencePromises.push(
        deleteAdminConfirmation({
          confirmationId: group.confirmationId || group.id || "",
          password: ADMIN_PASSWORD,
        }),
      );
    }
  });

  currentByconfirmationName.forEach((group, confirmationName) => {
    const savedGroup = savedByconfirmationName.get(confirmationName);
    const isCreation = !savedGroup;

    if (!isCreation && getStableJson(savedGroup) === getStableJson(group)) {
      return;
    }

    persistencePromises.push(
      saveAdminConfirmation({
        confirmation: group,
        method: isCreation ? "POST" : "PUT",
        password: ADMIN_PASSWORD,
      }),
    );
  });

  await Promise.all(persistencePromises);
}

function buildPendingConfirmationChanges(
  savedConfirmations,
  currentConfirmations,
) {
  const savedByconfirmationName = new Map(
    savedConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const currentByconfirmationName = new Map(
    currentConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const changes = [];

  currentByconfirmationName.forEach((group, confirmationName) => {
    const savedGroup = savedByconfirmationName.get(confirmationName);

    if (!savedGroup) {
      changes.push({
        details: buildGroupEditorChanges({}, group, {
          isCreation: true,
        }),
        title: `Confirmacion creada: ${group.confirmationName || confirmationName || group.email || "sin nombre"}`,
      });
      return;
    }

    if (getStableJson(savedGroup) !== getStableJson(group)) {
      changes.push({
        details: buildGroupEditorChanges(savedGroup, group, {
          isCreation: false,
        }),
        title: `Confirmacion editada: ${getGroupChangeLabel(savedGroup, group)}`,
      });
    }
  });

  savedByconfirmationName.forEach((group, confirmationName) => {
    if (!currentByconfirmationName.has(confirmationName)) {
      changes.push({
        details: Guest.normalizeList(group.guests, { ensureOne: false }).map(
          (guest, index) =>
            `Invitado eliminado: ${Guest.getDisplayName(guest, index)}`,
        ),
        title: `Confirmacion eliminada: ${group.confirmationName || confirmationName || group.email || "sin nombre"}`,
      });
    }
  });

  return changes;
}

function buildGroupEditorChanges(originalGroup, draftGroup, { isCreation }) {
  const original = normalizeAdminGroupBeforeSave(originalGroup, { isCreation });
  const draft = normalizeAdminGroupBeforeSave(draftGroup, { isCreation });
  const contactChanges = [];

  if (isCreation) {
    contactChanges.push("Confirmacion nueva");
  }

  [
    ["confirmationName", "Nombre de confirmacion"],
    ["email", "Email"],
    ["phone", "Telefono"],
  ].forEach(([field, label]) => {
    if (String(original[field] || "") !== String(draft[field] || "")) {
      contactChanges.push(label);
    }
  });

  const guestChanges = buildGuestEditorChanges(original.guests, draft.guests);
  const groupLabel = getGroupChangeLabel(original, draft);
  const changeParts = [];

  if (contactChanges.length) {
    changeParts.push(`Contacto: ${contactChanges.join(", ")}`);
  }

  if (guestChanges.added.length) {
    changeParts.push(`Invitados anadidos: ${guestChanges.added.join(", ")}`);
  }

  if (guestChanges.removed.length) {
    changeParts.push(
      `Invitados eliminados: ${guestChanges.removed.join(", ")}`,
    );
  }

  if (guestChanges.modified.length) {
    changeParts.push(
      `Invitados modificados: ${guestChanges.modified.join(", ")}`,
    );
  }

  void groupLabel;

  return changeParts.length ? changeParts : ["Cambios sin guardar"];
}

function buildGuestEditorChanges(originalGuests = [], draftGuests = []) {
  const originalGuestsByKey = getGuestsByEditorKey(originalGuests);
  const draftGuestsByKey = getGuestsByEditorKey(draftGuests);
  const changes = {
    added: [],
    modified: [],
    removed: [],
  };

  originalGuestsByKey.forEach((originalGuest, guestKey) => {
    const draftGuest = draftGuestsByKey.get(guestKey);

    if (!draftGuest) {
      changes.removed.push(getGuestChangeLabel(originalGuest, guestKey));
      return;
    }

    if (getStableJson(originalGuest) !== getStableJson(draftGuest)) {
      changes.modified.push(getGuestChangeLabel(draftGuest, guestKey));
    }
  });

  draftGuestsByKey.forEach((draftGuest, guestKey) => {
    if (!originalGuestsByKey.has(guestKey)) {
      changes.added.push(getGuestChangeLabel(draftGuest, guestKey));
    }
  });

  return changes;
}

function getGuestsByEditorKey(guests = []) {
  const guestKeyCounts = new Map();

  return new Map(
    guests.map((guest, index) => {
      const baseKey = getGuestEditorBaseKey(guest, index);
      const nextCount = (guestKeyCounts.get(baseKey) || 0) + 1;

      guestKeyCounts.set(baseKey, nextCount);

      return [`${baseKey}#${nextCount}`, guest];
    }),
  );
}

function getGuestEditorBaseKey(guest, index) {
  const guestName = Guest.getFullName(guest, "").trim().toLowerCase();

  return guestName || `invitado-${index + 1}`;
}

function getGuestChangeLabel(guest, guestKey) {
  return Guest.getFullName(guest, "") || guestKey.replace(/#\d+$/, "");
}

function getGroupChangeLabel(original, draft) {
  const originalLabel =
    original.confirmationName || original.email || "sin nombre";
  const draftLabel = draft.confirmationName || draft.email || "sin nombre";

  if (originalLabel === draftLabel) return draftLabel;

  return `${originalLabel} -> ${draftLabel}`;
}
