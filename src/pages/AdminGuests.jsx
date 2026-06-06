import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useBeforeUnload } from "react-router-dom";
import {
  AlertTriangle,
  Beef,
  BusFront,
  Fish,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Utensils,
  UsersRound,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import IconButton from "../components/ui/IconButton";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import AdminEntityActions from "../components/admin/AdminEntityActions";
import AdminEntityTabs from "../components/admin/AdminEntityTabs";
import AdminEmptyState from "../components/admin/AdminEmptyState";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import AdminPageShell from "../components/admin/AdminPageShell";
import AdminEditorDialog from "../components/admin/AdminEditorDialog";
import Card from "../components/admin/Card";
import CardGrid from "../components/admin/CardGrid";
import AdminTableSection from "../components/admin/AdminTableSection";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
} from "../components/admin/AdminMetricGrid";
import TableGuestCard from "../components/admin/TableGuestCard";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import Chip from "../components/ui/Chip";
import RsvpForm from "../forms/RsvpForm";
import {
  COMMON_ALLERGIES,
  GUEST_MENU_OPTIONS,
  MAX_GUESTS,
} from "../constants/rsvp";
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
import { getEmailHref, getPhoneHref } from "../utils/contactLinks";
import { adminContent } from "../constants/adminContent";
import { normalizeAdminConfirmations } from "../utils/rsvpGroups";
import {
  validateRsvpContact,
  validateRsvpForm,
} from "../utils/rsvpValidation";

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
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
    () => Confirmation.filterAdminRows(rows, query, filter),
    [filter, query, rows],
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
    () => filterGuestItems(guestItems, query, filter),
    [filter, guestItems, query],
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
      setFilter("all");
      setQuery("");
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

  const handleDeleteGroup = () => {
    if (!deleteTarget) return;

    applyConfirmations(
      removeConfirmationFromList(state.confirmations, deleteTarget),
    );
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
      query,
      filter,
    );
    const restoredTotalPages = Math.max(
      Math.ceil(
        restoredVisibleRows.length /
          (isMobileView ? mobilePageSize : desktopPageSize),
      ),
      1,
    );

    setPage((current) => Math.min(current, restoredTotalPages));
  }, [filter, isMobileView, query, savedConfirmations]);

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
          <GuestsOverview loading={state.loading} stats={guestStats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
          <AdminPendingChangesActions
            discardLabel={adminContent.guests.actions.discardChanges}
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
                    hasPendingChanges={hasPendingChanges}
                    loading={state.loading}
                    onCreate={() => openGroupEditor(undefined, "group")}
                    onDelete={() => setDeleteTarget(selectedRow.group)}
                    onDiscard={handleDiscardPendingChanges}
                    onEdit={() => openGroupEditor(selectedRow.group, "group")}
                    onSave={handleSavePendingChanges}
                    rows={rows}
                    saving={spinner.loading}
                    selectedGroup={selectedRow?.group}
                    showText={!isMobileView}
                  />
                }
                contentRef={tableStartRef}
                eyebrow={adminContent.guests.list.eyebrow}
                filters={
                  <FiltersCard
                    filter={filter}
                    onFilterChange={(value) => {
                      cancelPageLoading();
                      setFilter(value);
                      setPage(1);
                      setGuestPage(1);
                    }}
                    onQueryChange={(value) => {
                      cancelPageLoading();
                      setQuery(value);
                      setPage(1);
                      setGuestPage(1);
                    }}
                    query={query}
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
                    onSelect={() => {}}
                    selectedRowId={effectiveSelectedRowId}
                  />
                )}
                renderPage={(items) => (
                  <AdminGuestPage
                    emptyState={getGroupEmptyState(rows.length)}
                    items={items}
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
                  hasPendingChanges ||
                  visibleGuestItems.length ||
                  selectedGuestGroup ? (
                    <GuestTableActions
                      hasPendingChanges={hasPendingChanges}
                      loading={state.loading}
                      onCreate={
                        selectedGuestGroup
                          ? () => openNewGuestEditor(selectedGuestGroup)
                          : null
                      }
                      onDelete={() =>
                        selectedGuestItem && openGuestEditor(selectedGuestItem)
                      }
                      onDiscard={handleDiscardPendingChanges}
                      onEdit={() =>
                        selectedGuestItem && openGuestEditor(selectedGuestItem)
                      }
                      onSave={handleSavePendingChanges}
                      rows={visibleGuestItems}
                      saving={spinner.loading}
                      selectedGroup={selectedGuestGroup}
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
                    filter={filter}
                    onFilterChange={(value) => {
                      cancelPageLoading();
                      setFilter(value);
                      setPage(1);
                      setGuestPage(1);
                    }}
                    onQueryChange={(value) => {
                      cancelPageLoading();
                      setQuery(value);
                      setPage(1);
                      setGuestPage(1);
                    }}
                    query={query}
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
          message={adminContent.guests.dialogs.deleteMessage(
            deleteTarget.confirmationName || deleteTarget.email,
          )}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteGroup}
          title={adminContent.guests.dialogs.deleteTitle}
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

function GuestsOverview({ loading, stats }) {
  const metrics = adminContent.guests.overview.metrics;

  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-2">
        {adminContent.guests.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.guests.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
          count={4}
        />
      ) : (
        <AdminMetricGrid
          className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
          items={[
            {
              emoji: <UsersRound size={22} strokeWidth={1.8} />,
              label: metrics.confirmations,
              value: stats.groupCount,
            },
            {
              emoji: <UsersRound size={22} strokeWidth={1.8} />,
              label: metrics.guests,
              value: stats.guestCount,
            },
            {
              emoji: <AlertTriangle size={22} strokeWidth={1.8} />,
              label: metrics.allergies,
              value: stats.allergyCount,
            },
            {
              emoji: <BusFront size={22} strokeWidth={1.8} />,
              label: metrics.bus,
              value: stats.busCount,
            },
          ]}
        />
      )}
    </section>
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

function GuestTableActions({
  hasPendingChanges,
  loading,
  onCreate,
  onDelete,
  onDiscard,
  onEdit,
  onSave,
  rows,
  saving,
  selectedGroup,
  showText = true,
}) {
  return (
    <AdminEntityActions
      addLabel={adminContent.guests.actions.create}
      deleteLabel={adminContent.guests.actions.delete}
      discardLabel={adminContent.guests.actions.discardChanges}
      editLabel={adminContent.guests.actions.edit}
      hasItems={rows.length > 0}
      hasPendingChanges={hasPendingChanges}
      loading={loading}
      onCreate={onCreate}
      onDelete={onDelete}
      onDiscard={onDiscard}
      onEdit={onEdit}
      onSave={onSave}
      saveLabel={adminContent.guests.actions.saveChanges}
      saving={saving}
      selectedItem={selectedGroup}
      showText={showText}
    />
  );
}

function UnsavedGuestChangesDialog({
  changes,
  onCancel,
  onConfirm,
  onSaveAndExit,
}) {
  return (
    <UnsavedChangesDialog
      changes={changes}
      labels={{
        eyebrow: adminContent.guests.dialogs.warningEyebrow,
        exitWithoutSaving: adminContent.guests.dialogs.exitWithoutSaving,
        keepEditing: adminContent.guests.dialogs.keepEditing,
        saveAndExit: adminContent.guests.dialogs.saveAndExit,
        text: adminContent.guests.dialogs.unsavedText,
        title: adminContent.guests.dialogs.unsavedTitle,
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onSaveAndExit={onSaveAndExit}
      titleId="unsaved-guest-changes-title"
    />
  );
}

function GuestItemsPage({ emptyState, items, onSelect, selectedGuestId }) {
  if (!items.length) {
    return (
      <AdminEmptyState
        icon={UsersRound}
        text={emptyState?.text || adminContent.guests.list.emptyText}
        title={emptyState?.title || adminContent.guests.list.emptyTitle}
      />
    );
  }

  return (
    <>
      <CardGrid
        className="hidden gap-4 md:grid lg:grid-cols-2"
        getKey={(guest) => guest.rowId}
        items={items}
        renderCard={(guest) => (
          <GuestItemCard
            guestItem={guest}
            onSelect={onSelect}
            selected={guest.rowId === selectedGuestId}
          />
        )}
      />
      <div className="grid gap-4 md:hidden">
        {items.map((guest) => (
          <GuestItemCard
            guestItem={guest}
            key={guest.rowId}
            onSelect={onSelect}
            selected={guest.rowId === selectedGuestId}
          />
        ))}
      </div>
    </>
  );
}

function GuestItemCard({ guestItem, onSelect, selected }) {
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
  onEditGuests,
  onSelect,
  selectedRowId,
}) {
  return (
    <>
      <CardGrid
        className="hidden gap-4 md:grid lg:grid-cols-2"
        getKey={(row) => row.rowId}
        items={items}
        renderCard={(row) => (
          <AdminGuestConfirmationCard
            onEditGuests={onEditGuests}
            onSelect={onSelect}
            row={row}
            selected={row.rowId === selectedRowId}
          />
        )}
      />

      <div className="grid gap-4 md:hidden">
        {items.map((row) => (
          <AdminGuestConfirmationCard
            key={row.rowId}
            onEditGuests={onEditGuests}
            onSelect={onSelect}
            row={row}
            selected={row.rowId === selectedRowId}
          />
        ))}
      </div>

      {!items.length && (
        <AdminEmptyState
          icon={UsersRound}
          text={emptyState?.text || adminContent.guests.list.emptyText}
          title={emptyState?.title || adminContent.guests.list.emptyTitle}
        />
      )}
    </>
  );
}

function AdminGuestConfirmationCard({
  onEditGuests,
  onSelect,
  row,
  selected,
  titleRef,
  titleStyle,
}) {
  const chips = getGroupSummaryChips(row);

  return (
    <div
      className={`relative h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(row)}
    >
      {onEditGuests && (
        <IconButton
          className="absolute right-4 top-4 z-10 h-10 w-10 !px-0"
          icon={<UsersRound size={16} strokeWidth={1.8} />}
          label={adminContent.guests.actions.editGuests}
          onClick={(event) => {
            event.stopPropagation();
            onEditGuests(row.group);
          }}
          tone="secondary"
          type="button"
        />
      )}
      <Card
        decorativeText={row.groupSize}
        eyebrow={`${row.groupSize} ${
          row.groupSize === 1 ? "persona" : "personas"
        }`}
        title={row.confirmationName || "Grupo sin nombre"}
        titleRef={titleRef}
        titleStyle={titleStyle}
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
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

function getGroupSummaryChips(row) {
  const guests = Guest.normalizeList(row.guests, { ensureOne: false });
  const allergyChips = COMMON_ALLERGIES.map((allergy) => {
    const count = getGuestCountBy(guests, (guest) =>
      Guest.hasAllergy(guest, allergy),
    );

    if (!count) return null;

    return {
      key: `allergy-${allergy}`,
      icon: <AlertTriangle size={13} strokeWidth={1.8} />,
      value: `${allergy}: ${count}`,
    };
  }).filter(Boolean);
  const otherAllergiesCount = getGuestCountBy(guests, Guest.hasOtherAllergies);
  const commentsCount = getGuestCountBy(guests, Guest.hasComments);

  return [
    {
      className: "col-span-2",
      href: getEmailHref(row.email),
      icon: <Mail size={13} strokeWidth={1.8} />,
      key: "email",
      tone: "secondary",
      value: row.email || "-",
    },
    {
      href: getPhoneHref(row.phone),
      icon: <Phone size={13} strokeWidth={1.8} />,
      key: "phone",
      tone: "secondary",
      value: row.phone || "-",
    },
    ...GUEST_MENU_OPTIONS.map((menu) => {
      const count = getGuestCountBy(guests, (guest) => guest.menu === menu);

      if (!count) return null;

      return {
        icon: <GroupMenuIcon menu={menu} size={13} strokeWidth={1.8} />,
        key: `menu-${menu}`,
        strong: true,
        value: `${menu}: ${count}`,
      };
    }).filter(Boolean),
    ...allergyChips,
    otherAllergiesCount
      ? {
          icon: <AlertTriangle size={13} strokeWidth={1.8} />,
          key: "other-allergies",
          value: `Otras: ${otherAllergiesCount}`,
        }
      : null,
    getGuestCountBy(
      guests,
      (guest) => guest.outboundBus && guest.outboundBus !== "No",
    )
      ? {
          icon: <BusFront size={13} strokeWidth={1.8} />,
          key: "outbound-bus",
          value: `Ida: ${getGuestCountBy(
            guests,
            (guest) => guest.outboundBus && guest.outboundBus !== "No",
          )}`,
        }
      : null,
    getGuestCountBy(
      guests,
      (guest) => guest.returnBus && guest.returnBus !== "No",
    )
      ? {
          icon: <BusFront size={13} strokeWidth={1.8} />,
          key: "return-bus",
          value: `Vuelta: ${getGuestCountBy(
            guests,
            (guest) => guest.returnBus && guest.returnBus !== "No",
          )}`,
        }
      : null,
    commentsCount
      ? {
          icon: <MessageCircle size={13} strokeWidth={1.8} />,
          key: "comments",
          value: `Notas: ${commentsCount}`,
        }
      : null,
  ].filter(Boolean);
}

function getGuestCountBy(guests, predicate) {
  return guests.filter(predicate).length;
}

function GroupMenuIcon({ menu, ...props }) {
  const normalizedMenu = String(menu || "")
    .trim()
    .toLowerCase();
  const Icon =
    normalizedMenu === "pescado"
      ? Fish
      : normalizedMenu === "carne"
        ? Beef
        : Utensils;

  return <Icon {...props} />;
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

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasUnsavedChanges || saving) return;

        event.preventDefault();
        event.returnValue = "";
      },
      [hasUnsavedChanges, saving],
    ),
  );

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
    allergyCount: guests.filter(Guest.hasAllergies).length,
    busCount: guests.filter(Guest.usesBus).length,
    groupCount: rows.length,
    guestCount: guests.length,
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
