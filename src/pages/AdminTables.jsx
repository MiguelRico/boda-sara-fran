import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useBeforeUnload, useBlocker } from "react-router-dom";
import {
  Check,
  CircleCheckBig,
  CircleDashed,
  Download,
  Grid2X2,
  Armchair,
  Pencil,
  Plus,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
} from "../components/admin/AdminMetricGrid";
import AdminTableSection from "../components/admin/AdminTableSection";
import CardGrid from "../components/admin/CardGrid";
import EditorDialog from "../components/admin/EditorDialog";
import TableAnimatedInfoCard from "../components/admin/TableAnimatedInfoCard";
import TableForm from "../components/admin/TableForm";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import TabNavigation from "../components/ui/TabNavigation";
import DeleteDialog from "../components/ui/DeleteDialog";
import CardListSkeleton from "../components/ui/CardListSkeleton";
import SeatAssignmentModal from "../components/ui/SeatAssignmentModal";
import PendingGuestsList, {
  PendingGuestsFilters,
} from "../components/admin/PendingGuestsList";
import { GuestDetailChips } from "../components/admin/TableGuestCard";
import { Label, selectClassName } from "../components/rsvp/FormPrimitives";
import { Guest } from "../models";
import {
  assignGuestToSeatLocal,
  assignPendingGuestToSeatLocal,
  buildTables,
  buildTableStats,
  createTableFormFromTable,
  downloadTablesCsv,
  getAssignableGuests,
  getPendingGuests,
  persistAdminTables,
  unassignGuestFromSeatLocal,
  upsertManualTable,
  validateTableForm,
  getTableKey,
} from "../services/tablesService";
import { saveAdminGroup } from "../services/rsvpService";
import {
  loadAdminDataOnce,
  setAdminGroups,
  setAdminTables,
} from "../services/adminDataStore";
import useSpinner from "../hooks/useSpinner";
import useViewportScrollLock from "../hooks/useViewportScrollLock";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import { createEmptyTableForm } from "../constants/tables";
import { getTableRenderKey } from "../utils/renderKeys";
import { adminContent } from "../constants/adminContent";
import { tableContent } from "../constants/tableContent";
import { rsvpContent } from "../constants/rsvpContent";

const ADMIN_ACTIVE_TAB_KEY = "admin-tables-active-tab";
const SECTION_TABS = adminContent.tables.tabs;
const desktopPageSize = 4;
const pendingGuestsDesktopPageSize = 8;
const mobilePageSize = 1;
const emptySavedSnapshot = {
  groups: [],
  manualTables: [],
};
const emptyState = {
  groups: [],
  loading: true,
  error: "",
};
const TABLE_METRIC_GRID_CLASS =
  "flex flex-wrap justify-between gap-2 sm:items-start sm:gap-3";
export default function AdminTables() {
  const spinner = useSpinner();
  const tablesRef = useRef(null);
  const tablesCardRef = useRef(null);
  const tablesStartRef = useRef(null);
  const manualTablesRef = useRef(null);
  const tablesInView = useInView(tablesRef, {
    once: true,
    amount: 0.1,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);
  const [manualTables, setManualTables] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState(emptySavedSnapshot);
  const [tableForm, setTableForm] = useState(createEmptyTableForm);
  const [tableFormErrors, setTableFormErrors] = useState({});
  const [editingTable, setEditingTable] = useState(null);
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [seatAssignmentTarget, setSeatAssignmentTarget] = useState(null);
  const [assigningSeat, setAssigningSeat] = useState(false);
  const [page, setPage] = useState(1);
  const [pendingGuestsPage, setPendingGuestsPage] = useState(1);
  const [pendingGuestsFilters, setPendingGuestsFilters] = useState({
    group: "",
    menu: "",
  });
  const [pendingGuestsAssigningGuest, setPendingGuestsAssigningGuest] =
    useState("");
  const [pendingGuestsError, setPendingGuestsError] = useState("");
  const [selectedPendingGuestKey, setSelectedPendingGuestKey] = useState("");
  const [selectedTableKey, setSelectedTableKey] = useState("");
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return window.localStorage.getItem(ADMIN_ACTIVE_TAB_KEY) || "tables";
    } catch {
      return "tables";
    }
  });

  const loadTables = useCallback(
    async ({ includeStoredTables = true, showLoading = true } = {}) => {
      if (showLoading) {
        setState((prev) => ({ ...prev, loading: true, error: "" }));
      }

      try {
        const snapshot = await loadAdminDataOnce({ password: ADMIN_PASSWORD });
        const groups = snapshot.groups;
        const storedTables = includeStoredTables
          ? snapshot.tables
          : manualTablesRef.current;

        if (storedTables) {
          setManualTables(storedTables);
        }

        setSavedSnapshot({
          groups,
          manualTables: storedTables || manualTablesRef.current || [],
        });
        setState({
          groups,
          loading: false,
          error: "",
        });
      } catch (error) {
        console.error(error);

        setState({
          groups: [],
          loading: false,
          error: adminContent.tables.errors.load,
        });
      }
    },
    [],
  );

  useEffect(() => {
    manualTablesRef.current = manualTables;
  }, [manualTables]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      loadTables({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadTables]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_ACTIVE_TAB_KEY, activeTab);
    } catch {
      // Storage can be unavailable in private or locked browser contexts.
    }
  }, [activeTab]);

  const tables = useMemo(() => {
    return buildTables({ groups: state.groups, manualTables });
  }, [manualTables, state.groups]);
  const tableStats = useMemo(() => buildTableStats(tables), [tables]);
  const {
    currentPage,
    isMobileList,
    pageSize,
    pagedItems: pagedTables,
    totalPages,
  } = usePagedData({
    desktopPageSize,
    items: tables,
    mobilePageSize,
    page,
  });
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    isMobileList,
    onPageChange: setPage,
    totalPages,
  });
  const effectiveSelectedTableKey = pagedTables.some(
    (table) => getTableKey(table) === selectedTableKey,
  )
    ? selectedTableKey
    : getTableKey(pagedTables[0]) || "";
  const selectedTable = useMemo(
    () =>
      pagedTables.find(
        (table) => getTableKey(table) === effectiveSelectedTableKey,
      ) || null,
    [effectiveSelectedTableKey, pagedTables],
  );
  const pendingChanges = useMemo(
    () =>
      buildPendingTableChanges({
        currentGroups: state.groups,
        currentManualTables: manualTables,
        savedGroups: savedSnapshot.groups,
        savedManualTables: savedSnapshot.manualTables,
      }),
    [manualTables, savedSnapshot, state.groups],
  );
  const hasPendingChanges = pendingChanges.length > 0;
  const changedGroups = useMemo(
    () => getChangedGroups(savedSnapshot.groups, state.groups),
    [savedSnapshot.groups, state.groups],
  );

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      hasPendingChanges && currentLocation.pathname !== nextLocation.pathname
    );
  });

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasPendingChanges) return;

        event.preventDefault();
        event.returnValue = "";
      },
      [hasPendingChanges],
    ),
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedChangesDialog(true);
    }
  }, [blocker.state]);

  const guestsPending = useMemo(
    () => getPendingGuests(state.groups),
    [state.groups],
  );
  const pendingGuestGroups = useMemo(() => {
    const groupSet = new Set(
      guestsPending.map((guest) => guest.groupName).filter(Boolean),
    );

    return Array.from(groupSet);
  }, [guestsPending]);
  const pendingGuestMenus = useMemo(() => {
    const menuSet = new Set(
      guestsPending.map((guest) => guest.menu).filter(Boolean),
    );

    return Array.from(menuSet);
  }, [guestsPending]);
  const filteredPendingGuests = useMemo(() => {
    return guestsPending.filter((guest) => {
      if (
        pendingGuestsFilters.group &&
        guest.groupName !== pendingGuestsFilters.group
      ) {
        return false;
      }

      if (
        pendingGuestsFilters.menu &&
        guest.menu !== pendingGuestsFilters.menu
      ) {
        return false;
      }

      return true;
    });
  }, [guestsPending, pendingGuestsFilters]);
  const {
    currentPage: currentPendingGuestsPage,
    pageSize: pendingGuestsPageSize,
    pagedItems: pagedPendingGuests,
    totalPages: pendingGuestsTotalPages,
  } = usePagedData({
    desktopPageSize: pendingGuestsDesktopPageSize,
    items: filteredPendingGuests,
    mobilePageSize,
    page: pendingGuestsPage,
  });
  const {
    handlePageChange: handlePendingGuestsPageChange,
    pageDirection: pendingGuestsPageDirection,
  } = usePageTransition({
    currentPage: currentPendingGuestsPage,
    onPageChange: setPendingGuestsPage,
    totalPages: pendingGuestsTotalPages,
  });
  const effectiveSelectedPendingGuestKey = pagedPendingGuests.some(
    (guest) => getPendingGuestRowKey(guest) === selectedPendingGuestKey,
  )
    ? selectedPendingGuestKey
    : pagedPendingGuests[0]
      ? getPendingGuestRowKey(pagedPendingGuests[0])
      : "";
  const assignableGuests = useMemo(
    () => getAssignableGuests(state.groups),
    [state.groups],
  );
  const tableSeatReductionWarning = useMemo(
    () =>
      editingTable
        ? getGuestsUnassignedBySeatReduction(editingTable, tableForm.seatCount)
        : [],
    [editingTable, tableForm.seatCount],
  );
  const handleTableFormChange = (field, value) => {
    setTableForm((current) => ({ ...current, [field]: value }));
    setTableFormErrors((current) => ({ ...current, [field]: "" }));
  };
  const handleCloseTableForm = () => {
    setShowTableForm(false);
    setEditingTable(null);
    setTableForm(createEmptyTableForm());
    setTableFormErrors({});
  };

  const handleCreateTable = () => {
    setEditingTable(null);
    setTableForm(createEmptyTableForm());
    setTableFormErrors({});
    setShowTableForm(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableForm(createTableFormFromTable(table));
    setTableFormErrors({});
    setShowTableForm(true);
  };

  const handleRequestDeleteTable = (table) => {
    setTableToDelete(table);
  };

  const handleCancelDeleteTable = () => {
    setTableToDelete(null);
  };

  const handleConfirmDeleteTable = async () => {
    if (!tableToDelete) return;

    const tableKey = getTableKey(tableToDelete);
    const nextManualTables = manualTables.filter(
      (table) => getTableKey(table) !== tableKey,
    );
    const updatedGroups = state.groups.map((group) => {
      let changed = false;

      const guests = group.guests.map((guest) => {
        if (guest.table !== tableKey) return guest;

        changed = true;

        return {
          ...guest,
          table: "",
          seat: "",
        };
      });

      return changed ? { ...group, guests } : group;
    });

    setManualTables(nextManualTables);
    setAdminTables(nextManualTables);
    setState((prev) => ({
      ...prev,
      groups: updatedGroups,
      loading: false,
      error: "",
    }));
    setAdminGroups(updatedGroups);

    if (editingTable && getTableKey(editingTable) === tableKey) {
      handleCloseTableForm();
    }

    const nextTables = buildTables({
      groups: updatedGroups,
      manualTables: nextManualTables,
    });
    const nextPage = Math.min(
      page,
      Math.max(Math.ceil(nextTables.length / pageSize), 1),
    );

    setPage(nextPage);
    setTableToDelete(null);
  };

  const handleSeatClick = ({ seat, table }) => {
    setSeatAssignmentTarget({ seat, table });
  };

  const handleCloseSeatAssignment = () => {
    if (assigningSeat) return;

    setSeatAssignmentTarget(null);
  };

  const handleSavePendingChanges = async () => {
    if (!hasPendingChanges) return;

    try {
      spinner.show(adminContent.tables.spinner.save);

      const persistencePromises = [
        persistAdminTables({
          password: ADMIN_PASSWORD,
          tables: manualTables,
        }),
        ...changedGroups.map((group) =>
          saveAdminGroup({
            group,
            password: ADMIN_PASSWORD,
          }),
        ),
      ];

      await Promise.all(persistencePromises);

      setAdminTables(manualTables);
      setAdminGroups(state.groups);
      setSavedSnapshot({
        groups: state.groups,
        manualTables,
      });
    } catch (error) {
      console.error("Error al guardar cambios de mesas:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || adminContent.tables.errors.save,
      }));
    } finally {
      spinner.hide();
    }
  };

  const handleDiscardPendingChanges = useCallback(() => {
    const restoredManualTables = savedSnapshot.manualTables;
    const restoredGroups = savedSnapshot.groups;

    setManualTables(restoredManualTables);
    setAdminTables(restoredManualTables);
    setAdminGroups(restoredGroups);
    setState((prev) => ({
      ...prev,
      groups: restoredGroups,
      loading: false,
      error: "",
    }));
    setTableToDelete(null);
    setSeatAssignmentTarget(null);
    handleCloseTableForm();

    const restoredTables = buildTables({
      groups: restoredGroups,
      manualTables: restoredManualTables,
    });
    const restoredTotalPages = Math.max(
      Math.ceil(restoredTables.length / pageSize),
      1,
    );

    setPage((current) => Math.min(current, restoredTotalPages));
  }, [pageSize, savedSnapshot.groups, savedSnapshot.manualTables]);

  const handleAssignGuestToTable = useCallback(
    async ({ guestId, guestGroupName, guestIndex, tableName, seatNumber }) => {
      try {
        const updatedGroups = assignPendingGuestToSeatLocal({
          groups: state.groups,
          guestGroupName,
          guestId,
          guestIndex,
          seatNumber,
          tableName,
          tables,
        });
        setState((prev) => ({
          ...prev,
          groups: updatedGroups,
          loading: false,
          error: "",
        }));
        setAdminGroups(updatedGroups);
      } catch (error) {
        console.error("Error al asignar mesa:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || adminContent.tables.errors.assignTable,
        }));
        throw error;
      }
    },
    [state.groups, tables],
  );

  const handlePendingGuestsFilterChange = (filterKey, value) => {
    setPendingGuestsFilters((current) => ({
      ...current,
      [filterKey]: value,
    }));
    setPendingGuestsPage(1);
  };

  const handleAssignPendingGuest = useCallback(
    async (guest, tableName, seatNumber) => {
      if (!tableName || !seatNumber) return;

      const rowKey = getPendingGuestRowKey(guest);

      setPendingGuestsError("");
      setPendingGuestsAssigningGuest(rowKey);

      try {
        await handleAssignGuestToTable({
          guestId: Guest.getFullName(guest),
          guestGroupName: guest.groupName,
          guestIndex: guest.guestIndex,
          tableName,
          seatNumber,
        });
      } catch (error) {
        setPendingGuestsError(
          error.message || adminContent.tables.errors.assignTable,
        );
      } finally {
        setPendingGuestsAssigningGuest("");
      }
    },
    [handleAssignGuestToTable],
  );

  const handleAssignGuestToSeat = async ({
    guestGroupName,
    guestIndex,
    guestName,
  }) => {
    if (!seatAssignmentTarget || !guestGroupName) return;

    setAssigningSeat(true);
    setState((prev) => ({ ...prev, error: "" }));

    try {
      const updatedGroups = assignGuestToSeatLocal({
        groups: state.groups,
        guestGroupName,
        guestIndex,
        guestName,
        seat: seatAssignmentTarget.seat,
        table: seatAssignmentTarget.table,
      });
      setSeatAssignmentTarget(null);
      setState((prev) => ({
        ...prev,
        groups: updatedGroups,
        loading: false,
        error: "",
      }));
      setAdminGroups(updatedGroups);
    } catch (error) {
      console.error("Error al asignar asiento:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || adminContent.tables.errors.assign,
      }));
    } finally {
      setAssigningSeat(false);
    }
  };

  const handleRemoveGuestFromSeat = async (target = seatAssignmentTarget) => {
    if (!target) return;

    setAssigningSeat(true);
    setState((prev) => ({ ...prev, error: "" }));

    try {
      const updatedGroups = unassignGuestFromSeatLocal({
        groups: state.groups,
        seat: target.seat,
        table: target.table,
      });
      if (target === seatAssignmentTarget) {
        setSeatAssignmentTarget(null);
      }
      setState((prev) => ({
        ...prev,
        groups: updatedGroups,
        loading: false,
        error: "",
      }));
      setAdminGroups(updatedGroups);
    } catch (error) {
      console.error("Error al liberar asiento:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || adminContent.tables.errors.unassign,
      }));
    } finally {
      setAssigningSeat(false);
    }
  };

  const handleTableSubmit = async (event) => {
    event.preventDefault();

    const errors = validateTableForm(tableForm, tables, editingTable);

    if (Object.keys(errors).length) {
      setTableFormErrors(errors);
      return;
    }

    const nextManualTables = upsertManualTable({
      editingTable,
      form: tableForm,
      manualTables,
    });
    const updatedGroups = editingTable
      ? unassignGuestsOutsideTableSize({
          groups: state.groups,
          seatCount: tableForm.seatCount,
          table: editingTable,
        })
      : state.groups;

    setManualTables(nextManualTables);
    setAdminTables(nextManualTables);
    setState((prev) => ({
      ...prev,
      groups: updatedGroups,
      loading: false,
      error: "",
    }));
    setAdminGroups(updatedGroups);

    if (!editingTable) {
      setPage(Math.max(Math.ceil((tables.length + 1) / pageSize), 1));
    }

    handleCloseTableForm();
  };

  const handleCancelBlockedNavigation = () => {
    setShowUnsavedChangesDialog(false);
    blocker.reset?.();
  };

  const handleConfirmBlockedNavigation = () => {
    setShowUnsavedChangesDialog(false);
    blocker.proceed?.();
  };

  const handleDiscardFromBlockedNavigation = () => {
    handleDiscardPendingChanges();
    setShowUnsavedChangesDialog(false);
    blocker.reset?.();
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      {showUnsavedChangesDialog && (
        <UnsavedChangesDialog
          changes={pendingChanges}
          onCancel={handleCancelBlockedNavigation}
          onConfirm={handleConfirmBlockedNavigation}
          onDiscard={handleDiscardFromBlockedNavigation}
        />
      )}

      <CinematicSection
        className="surface-soft"
        innerClassName="max-w-6xl py-6"
        reveal={false}
      >
        <div ref={tablesRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={tablesInView}>
            <HeaderSection
              eyebrow={adminContent.tables.header.adminEyebrow}
              title={adminContent.tables.header.title}
              titleAs="h1"
              text={adminContent.tables.header.text}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={2} isVisible={tablesInView}>
            <TablesOverview loading={state.loading} stats={tableStats} />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={tablesInView}>
            <div className="space-y-5">
              <TabNavigation
                tabs={SECTION_TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
              />

              {activeTab === "tables" ? (
                <AdminTableSection
                  actions={
                    <TableTabActions
                      hasPendingChanges={hasPendingChanges}
                      loading={state.loading}
                      onCreate={handleCreateTable}
                      onDelete={() => handleRequestDeleteTable(selectedTable)}
                      onDiscard={handleDiscardPendingChanges}
                      onEdit={() => handleEditTable(selectedTable)}
                      onExport={() => downloadTablesCsv(tables)}
                      onSave={handleSavePendingChanges}
                      saving={spinner.loading}
                      selectedTable={selectedTable}
                      tables={tables}
                    />
                  }
                  contentRef={tablesStartRef}
                  eyebrow={adminContent.tables.header.eyebrow}
                  getKey={getTableRenderKey}
                  isMobileList={isMobileList}
                  items={tables}
                  loading={state.loading}
                  lockPageHeight={false}
                  mobilePageLabel={adminContent.tables.header.mobilePageLabel}
                  onNextPage={() =>
                    handlePageChange(currentPage + 1, tablesStartRef.current)
                  }
                  onPrevPage={() =>
                    handlePageChange(currentPage - 1, tablesStartRef.current)
                  }
                  page={state.loading ? undefined : currentPage}
                  pageDirection={pageDirection}
                  pageLabel={adminContent.tables.header.pageLabel}
                  pageSize={state.loading ? undefined : pageSize}
                  sectionRef={tablesCardRef}
                  skeleton={
                    <CardListSkeleton
                      columnsClassName="lg:grid-cols-2"
                      itemClassName="min-h-40"
                      lines={2}
                    />
                  }
                  title="Asientos asignados"
                  totalPages={state.loading ? undefined : totalPages}
                  renderMeasurePage={(items) => (
                    <TableCardsPage
                      items={items}
                      onSeatClick={() => {}}
                      onSelect={() => {}}
                      onUnassignSeat={() => {}}
                      selectedTableKey={effectiveSelectedTableKey}
                    />
                  )}
                  renderPage={(items) => (
                    <TableCardsPage
                      items={items}
                      onSeatClick={handleSeatClick}
                      onSelect={(table) =>
                        setSelectedTableKey(getTableKey(table))
                      }
                      onUnassignSeat={handleRemoveGuestFromSeat}
                      selectedTableKey={effectiveSelectedTableKey}
                    />
                  )}
                />
              ) : (
                <AdminTableSection
                  contentRef={tablesStartRef}
                  count={adminContent.tables.header.pendingGuestCountLabel(
                    filteredPendingGuests.length,
                  )}
                  eyebrow={adminContent.pendingGuests.pendingEyebrow}
                  filters={
                    guestsPending.length > 0 && (
                      <PendingGuestsFilters
                        availableGroups={pendingGuestGroups}
                        availableMenus={pendingGuestMenus}
                        filters={pendingGuestsFilters}
                        onFilterChange={handlePendingGuestsFilterChange}
                      />
                    )
                  }
                  getKey={getPendingGuestRowKey}
                  isMobileList={isMobileList}
                  items={filteredPendingGuests}
                  loading={state.loading}
                  lockPageHeight={false}
                  mobilePageLabel={adminContent.pendingGuests.pendingEyebrow}
                  onNextPage={() =>
                    handlePendingGuestsPageChange(
                      currentPendingGuestsPage + 1,
                      tablesStartRef.current,
                    )
                  }
                  onPrevPage={() =>
                    handlePendingGuestsPageChange(
                      currentPendingGuestsPage - 1,
                      tablesStartRef.current,
                    )
                  }
                  page={state.loading ? undefined : currentPendingGuestsPage}
                  pageDirection={pendingGuestsPageDirection}
                  pageLabel={adminContent.pendingGuests.pendingEyebrow}
                  paginationLabel={
                    state.loading
                      ? undefined
                      : adminContent.pendingGuests.pageLabel({
                          page: currentPendingGuestsPage,
                          total: pendingGuestsTotalPages,
                        })
                  }
                  pageSize={state.loading ? undefined : pendingGuestsPageSize}
                  sectionRef={tablesCardRef}
                  skeleton={
                    <CardListSkeleton
                      columnsClassName="lg:grid-cols-2"
                      itemClassName="min-h-40"
                      lines={2}
                    />
                  }
                  title={adminContent.pendingGuests.title}
                  totalPages={
                    state.loading ? undefined : pendingGuestsTotalPages
                  }
                  renderMeasurePage={(items) => (
                    <PendingGuestsList
                      assigningGuest=""
                      emptyText={
                        guestsPending.length
                          ? adminContent.pendingGuests.noFilterResults
                          : adminContent.pendingGuests.emptyText
                      }
                      emptyTitle={adminContent.pendingGuests.emptyTitle}
                      guests={items}
                      onAssignTable={() => {}}
                      onSelect={() => {}}
                      selectedGuestKey={effectiveSelectedPendingGuestKey}
                      tables={tables}
                    />
                  )}
                  renderPage={(items) => (
                    <PendingGuestsList
                      assigningGuest={pendingGuestsAssigningGuest}
                      emptyText={
                        guestsPending.length
                          ? adminContent.pendingGuests.noFilterResults
                          : adminContent.pendingGuests.emptyText
                      }
                      emptyTitle={adminContent.pendingGuests.emptyTitle}
                      error={pendingGuestsError}
                      guests={items}
                      onAssignTable={handleAssignPendingGuest}
                      onSelect={(guest) =>
                        setSelectedPendingGuestKey(getPendingGuestRowKey(guest))
                      }
                      selectedGuestKey={effectiveSelectedPendingGuestKey}
                      tables={tables}
                    />
                  )}
                />
              )}
            </div>
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      <StatusDialog
        eyebrow={adminContent.tables.dialogs.warningEyebrow}
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title={adminContent.tables.dialogs.problemTitle}
        type="error"
      />

      {showTableForm && (
        <TableEditor
          content={editingTable ? tableContent.form : undefined}
          errors={tableFormErrors}
          form={tableForm}
          seatReductionWarning={tableSeatReductionWarning}
          title={
            editingTable
              ? adminContent.tables.dialogs.editTitle
              : adminContent.tables.dialogs.createTitle
          }
          onCancel={handleCloseTableForm}
          onChange={handleTableFormChange}
          onDelete={
            editingTable
              ? () => handleRequestDeleteTable(editingTable)
              : undefined
          }
          onSubmit={handleTableSubmit}
        />
      )}

      {tableToDelete && (
        <DeleteDialog
          title={adminContent.tables.dialogs.deleteTitle}
          message={adminContent.tables.dialogs.deleteMessage(
            tableToDelete.name,
          )}
          onCancel={handleCancelDeleteTable}
          onConfirm={handleConfirmDeleteTable}
        />
      )}

      {seatAssignmentTarget && (
        <SeatAssignmentDialog
          assigning={assigningSeat}
          guests={assignableGuests}
          onAssign={handleAssignGuestToSeat}
          onCancel={handleCloseSeatAssignment}
          onRemove={handleRemoveGuestFromSeat}
          seat={seatAssignmentTarget.seat}
          table={seatAssignmentTarget.table}
        />
      )}
    </CinematicPage>
  );
}

function TableEditor({
  content,
  errors,
  form,
  onCancel,
  onChange,
  onDelete,
  onSubmit,
  seatReductionWarning = [],
  title = "Crear mesa",
}) {
  return (
    <EditorDialog
      icon={<Armchair size={22} strokeWidth={1.8} />}
      onClose={onCancel}
      title={title}
      titleId="table-editor-title"
    >
      <TableForm
        content={content}
        errors={errors}
        form={form}
        seatReductionWarning={seatReductionWarning}
        onCancel={onCancel}
        onChange={onChange}
        onDelete={onDelete}
        onSubmit={onSubmit}
      />
    </EditorDialog>
  );
}

function SeatAssignmentDialog({
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
  const currentGuest = guests.find(
    (guest) =>
      guest.table === tableKey && String(guest.seat) === String(seat.seat),
  );
  const currentGuestName = currentGuest
    ? Guest.getFullName(currentGuest, "Invitado")
    : seat.guest
      ? Guest.getFullName(seat.guest, "Invitado")
      : "";
  const currentGuestValue = currentGuest
    ? createGuestOptionValue({
        groupName: currentGuest.groupName,
        guestIndex: currentGuest.guestIndex,
        name: currentGuestName,
      })
    : "";
  const canRemoveGuest = Boolean(currentGuest);
  const [selectedGuest, setSelectedGuest] = useState(currentGuestValue);
  const [selectedGuestDirection, setSelectedGuestDirection] = useState(1);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const selectedGuestDetails = getGuestFromOptionValue(guests, selectedGuest);
  const reduceMotion = useReducedMotion();
  const selectedGuestDetailsVariants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (direction) => ({
          opacity: 0,
          x: direction > 0 ? 72 : -72,
          filter: "blur(6px)",
        }),
        center: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: (direction) => ({
          opacity: 0,
          x: direction > 0 ? -72 : 72,
          filter: "blur(6px)",
        }),
      };

  const handleSelectedGuestChange = (nextValue) => {
    const currentIndex = getGuestOptionIndex(guests, selectedGuest);
    const nextIndex = getGuestOptionIndex(guests, nextValue);

    setSelectedGuestDirection(nextIndex >= currentIndex ? 1 : -1);
    setSelectedGuest(nextValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const [guestGroupName, guestIndex, guestName] = selectedGuest.split("|||");

    onAssign({ guestGroupName, guestIndex, guestName });
  };

  const handleConfirmRemove = () => {
    setShowRemoveConfirm(false);
    onRemove();
  };

  return (
    <>
      <SeatAssignmentModal
        blockRouteChange={!showRemoveConfirm}
        eyebrow={tableContent.card.seatAssignmentEyebrow({
          seat: seat.seat,
          table: tableLabel,
        })}
        maxWidthClassName="max-w-2xl"
        onClose={onCancel}
        title={adminContent.tables.dialogs.assignmentTitle}
      >
        <form noValidate onSubmit={handleSubmit}>
        <div className="mb-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
          <div
            className={`grid w-full gap-3 ${
              canRemoveGuest ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {canRemoveGuest && (
              <IconButton
                className="w-full"
                disabled={assigning}
                icon={<Trash2 size={16} strokeWidth={1.8} />}
                label={adminContent.tables.dialogs.remove}
                onClick={() => setShowRemoveConfirm(true)}
                tone="danger"
                type="button"
              >
                {adminContent.tables.dialogs.remove}
              </IconButton>
            )}

            <IconButton
              className="w-full"
              disabled={!selectedGuest || assigning}
              icon={<Check size={16} strokeWidth={1.8} />}
              label={
                assigning
                  ? adminContent.tables.dialogs.assigning
                  : adminContent.tables.dialogs.assign
              }
              tone="primary"
              type="submit"
            >
              {assigning
                ? adminContent.tables.dialogs.assigning
                : adminContent.tables.dialogs.assign}
            </IconButton>
          </div>
        </div>

        <Label>{adminContent.tables.dialogs.guestLabel}</Label>
        <select
          className={selectClassName}
          disabled={assigning}
          onChange={(event) => handleSelectedGuestChange(event.target.value)}
          value={selectedGuest}
        >
          <option value="">
            {adminContent.tables.dialogs.guestPlaceholder}
          </option>
          {guests.map((guest, index) => {
            const guestName = Guest.getFullName(guest, "Invitado");
            const assignmentText = Guest.getAssignmentText(guest);

            return (
              <option
                key={`${guest.groupName}-${guestName}-${index}`}
                value={createGuestOptionValue({
                  groupName: guest.groupName,
                  guestIndex: guest.guestIndex,
                  name: guestName,
                })}
              >
                {guestName} - {guest.groupName}
                {assignmentText ? ` (${assignmentText})` : ""}
              </option>
            );
          })}
        </select>

        {selectedGuestDetails && (
          <div className="relative mt-4 overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none invisible">
              <SelectedGuestDetailsCard guest={selectedGuestDetails} />
            </div>

            <AnimatePresence custom={selectedGuestDirection} initial={false}>
              <motion.div
                animate="center"
                className="absolute inset-x-0 top-0"
                custom={selectedGuestDirection}
                exit="exit"
                initial="enter"
                key={selectedGuest}
                transition={{
                  duration: reduceMotion ? 0.18 : 0.48,
                  ease: [0.22, 1, 0.36, 1],
                }}
                variants={selectedGuestDetailsVariants}
              >
                <SelectedGuestDetailsCard guest={selectedGuestDetails} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        </form>
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

function SelectedGuestDetailsCard({ guest }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <p className="section-eyebrow mb-2">{guest.groupName || "Invitado"}</p>
      <h3 className="break-words font-serif text-2xl leading-none text-[var(--color-text)]">
        {Guest.getFullName(guest, "Invitado")}
      </h3>
      <GuestDetailChips className="mt-3" guest={guest} />
    </div>
  );
}

function UnsavedChangesDialog({ changes, onCancel, onConfirm, onDiscard }) {
  useViewportScrollLock(true);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby="unsaved-table-changes-title"
        aria-modal="true"
        className="premium-card rsvp-dialog-card"
        role="alertdialog"
      >
        <p className="section-eyebrow mb-3">
          {adminContent.tables.dialogs.unsavedEyebrow}
        </p>
        <h2
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
          id="unsaved-table-changes-title"
        >
          {adminContent.tables.dialogs.unsavedTitle}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          {adminContent.tables.dialogs.unsavedText}
        </p>
        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-left text-sm text-[var(--color-muted)]">
          {changes.map((change, index) => (
            <li
              className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
              key={`${change}-${index}`}
            >
              {change}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <IconButton
            className="flex-1"
            icon={<X size={16} strokeWidth={1.8} />}
            label={adminContent.tables.dialogs.keepEditing}
            onClick={onCancel}
            showText="always"
            tone="secondary"
            type="button"
          >
            {adminContent.tables.dialogs.keepEditing}
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<Undo2 size={16} strokeWidth={1.8} />}
            label={adminContent.tables.actions.discardChanges}
            onClick={onDiscard}
            showText="always"
            tone="secondary"
            type="button"
          >
            {adminContent.tables.actions.discardChanges}
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label={adminContent.tables.dialogs.exitWithoutSaving}
            onClick={onConfirm}
            showText="always"
            tone="danger"
            type="button"
          >
            {adminContent.tables.dialogs.exitWithoutSaving}
          </IconButton>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function TablesOverview({ loading, stats }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-2">
        {adminContent.tables.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.tables.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          count={4}
          className={TABLE_METRIC_GRID_CLASS}
        />
      ) : (
        <AdminMetricGrid
          className={TABLE_METRIC_GRID_CLASS}
          items={getTableSummaryItems(stats)}
        />
      )}
    </section>
  );
}

function getTableSummaryItems(stats) {
  return [
    {
      label: adminContent.tables.overview.metrics.tableCount,
      value: stats.totalTables,
      detail: adminContent.tables.overview.metrics.tables,
      emoji: <Grid2X2 size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.seatCount,
      value: stats.totalSeats,
      detail: adminContent.tables.overview.metrics.seats,
      emoji: <Armchair size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.assignedSeats,
      value: stats.assignedSeats,
      detail: adminContent.tables.overview.metrics.assigned,
      emoji: <CircleCheckBig size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.pendingSeats,
      value: stats.pendingSeats,
      detail: adminContent.tables.overview.metrics.pending,
      emoji: <CircleDashed size={22} strokeWidth={1.8} />,
    },
  ];
}

function TablesEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
      <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
        {adminContent.tables.empty.title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {adminContent.tables.empty.text}
      </p>
    </div>
  );
}

function TableTabActions({
  hasPendingChanges,
  loading,
  onCreate,
  onDelete,
  onDiscard,
  onEdit,
  onExport,
  onSave,
  saving,
  selectedTable,
  tables,
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-3">
      <IconButton
        className="w-full"
        disabled={!tables.length}
        icon={<Download size={16} strokeWidth={1.8} />}
        label={adminContent.tables.header.exportTable}
        onClick={onExport}
        tone="terciary"
      >
        {adminContent.tables.header.exportTable}
      </IconButton>

      <IconButton
        className="w-full"
        disabled={!hasPendingChanges || loading}
        icon={<Undo2 size={16} strokeWidth={1.8} />}
        label={adminContent.tables.actions.discardChanges}
        onClick={onDiscard}
        tone="secondary"
      >
        {adminContent.tables.actions.discardChanges}
      </IconButton>

      <IconButton
        className="w-full"
        icon={<Plus size={18} strokeWidth={2.4} />}
        label={adminContent.tables.actions.addTable}
        onClick={onCreate}
        tone="primary"
      >
        {adminContent.tables.actions.addTable}
      </IconButton>

      <IconButton
        className="w-full"
        disabled={!selectedTable}
        icon={<Trash2 size={16} strokeWidth={1.8} />}
        label={adminContent.tables.actions.deleteTable}
        onClick={onDelete}
        tone="danger"
      >
        {adminContent.tables.actions.deleteTable}
      </IconButton>

      <IconButton
        className="w-full"
        disabled={!selectedTable}
        icon={<Pencil size={16} strokeWidth={1.8} />}
        label={adminContent.tables.actions.editTable}
        onClick={onEdit}
        tone="secondary"
      >
        {adminContent.tables.actions.editTable}
      </IconButton>

      <IconButton
        className="w-full"
        disabled={!hasPendingChanges || saving}
        icon={<Save size={16} strokeWidth={1.8} />}
        label={adminContent.tables.actions.saveChanges}
        onClick={onSave}
        tone="primary"
      >
        {adminContent.tables.actions.saveChanges}
      </IconButton>
    </div>
  );
}

function TableCardWithActions({
  index = 0,
  onSeatClick,
  onSelect,
  onUnassignSeat,
  reveal = true,
  selected = false,
  table,
}) {
  return (
    <div
      className={`grid gap-3 rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(table)}
    >
      <TableAnimatedInfoCard
        index={index}
        onSeatClick={onSeatClick}
        onUnassignSeat={onUnassignSeat}
        reveal={reveal}
        table={table}
      />
    </div>
  );
}

function TableCardsPage({
  items,
  onSeatClick,
  onSelect,
  onUnassignSeat,
  selectedTableKey,
}) {
  return (
    <>
      <CardGrid
        emptyState={<TablesEmptyState />}
        getKey={getTableRenderKey}
        items={items}
        renderCard={(table, index) => (
          <TableCardWithActions
            index={index}
            onSeatClick={onSeatClick}
            onSelect={onSelect}
            onUnassignSeat={onUnassignSeat}
            selected={getTableKey(table) === selectedTableKey}
            table={table}
          />
        )}
      />
      <div className="grid gap-4 md:hidden">
        {items.map((table, index) => (
          <TableCardWithActions
            key={getTableRenderKey(table, { index })}
            onSeatClick={onSeatClick}
            onSelect={onSelect}
            onUnassignSeat={onUnassignSeat}
            reveal={false}
            selected={getTableKey(table) === selectedTableKey}
            table={table}
          />
        ))}
      </div>
      {!items.length && (
        <div className="md:hidden">
          <TablesEmptyState />
        </div>
      )}
    </>
  );
}

function buildPendingTableChanges({
  currentGroups,
  currentManualTables,
  savedGroups,
  savedManualTables,
}) {
  const changes = [
    ...buildManualTableChanges(savedManualTables, currentManualTables),
    ...buildSeatAssignmentChanges(savedGroups, currentGroups),
  ];

  return changes.length ? changes : [];
}

function buildManualTableChanges(savedTables, currentTables) {
  const savedByKey = new Map(
    savedTables.map((table) => [getTableKey(table), table]),
  );
  const currentByKey = new Map(
    currentTables.map((table) => [getTableKey(table), table]),
  );
  const changes = [];

  currentByKey.forEach((table, tableKey) => {
    if (!tableKey) return;

    const savedTable = savedByKey.get(tableKey);

    if (!savedTable) {
      changes.push(adminContent.tables.changes.created(table.name));
      return;
    }

    if (getStableJson(savedTable) !== getStableJson(table)) {
      changes.push(adminContent.tables.changes.modified(table.name));
    }
  });

  savedByKey.forEach((table, tableKey) => {
    if (tableKey && !currentByKey.has(tableKey)) {
      changes.push(adminContent.tables.changes.deleted(table.name));
    }
  });

  return changes;
}

function buildSeatAssignmentChanges(savedGroups, currentGroups) {
  const savedByGroupName = new Map(
    savedGroups.map((group) => [group.groupName, group]),
  );
  const changes = [];

  currentGroups.forEach((group) => {
    const savedGroup = savedByGroupName.get(group.groupName);

    group.guests.forEach((guest, index) => {
      const savedGuest = savedGroup?.guests?.[index] || {};
      const previousAssignment = getGuestAssignmentLabel(savedGuest);
      const currentAssignment = getGuestAssignmentLabel(guest);

      if (previousAssignment === currentAssignment) return;

      changes.push(
        `${Guest.getFullName(
          guest,
          rsvpContent.guest.fallbackName(index + 1),
        )}: ${previousAssignment} -> ${currentAssignment}`,
      );
    });
  });

  return changes;
}

function getChangedGroups(savedGroups, currentGroups) {
  const savedByGroupName = new Map(
    savedGroups.map((group) => [group.groupName, getStableJson(group)]),
  );

  return currentGroups.filter(
    (group) => savedByGroupName.get(group.groupName) !== getStableJson(group),
  );
}

function getGuestAssignmentLabel(guest = {}) {
  const table = String(guest.table || "").trim();
  const seat = String(guest.seat || "").trim();

  if (!table && !seat) return adminContent.tables.changes.noSeat;

  return adminContent.tables.changes.assignmentLabel({ seat, table });
}

function getGuestsUnassignedBySeatReduction(table, seatCount) {
  const nextSeatCount = Number(seatCount) || 0;

  return table.seats
    .filter((seat) => seat.guest && Number(seat.seat) > nextSeatCount)
    .sort((left, right) => Number(left.seat) - Number(right.seat))
    .map((seat) => ({
      name: Guest.getFullName(seat.guest, "Invitado"),
      seat: seat.seat,
    }));
}

function unassignGuestsOutsideTableSize({ groups, seatCount, table }) {
  const tableKey = getTableKey(table);
  const nextSeatCount = Number(seatCount) || 0;

  if (!tableKey || !nextSeatCount) return groups;

  return groups.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest) => {
      const isRemovedSeat =
        guest.table === tableKey && Number(guest.seat) > nextSeatCount;

      if (!isRemovedSeat) return guest;

      changed = true;

      return {
        ...guest,
        table: "",
        seat: "",
      };
    });

    return changed ? { ...group, guests } : group;
  });
}

function getStableJson(value) {
  return JSON.stringify(value);
}

function createGuestOptionValue({ groupName, guestIndex = "", name }) {
  return `${groupName || ""}|||${guestIndex}|||${name || ""}`;
}

function getGuestFromOptionValue(guests, value) {
  if (!value) return null;

  const [guestGroupName, guestIndex, guestName] = value.split("|||");

  return (
    guests.find((guest) => {
      if (guest.groupName !== guestGroupName) return false;

      if (guestIndex !== "") {
        return String(guest.guestIndex) === guestIndex;
      }

      return Guest.getFullName(guest, "Invitado") === guestName;
    }) || null
  );
}

function getGuestOptionIndex(guests, value) {
  if (!value) return -1;

  const [guestGroupName, guestIndex, guestName] = value.split("|||");

  return guests.findIndex((guest) => {
    if (guest.groupName !== guestGroupName) return false;

    if (guestIndex !== "") {
      return String(guest.guestIndex) === guestIndex;
    }

    return Guest.getFullName(guest, "Invitado") === guestName;
  });
}

function getPendingGuestRowKey(guest) {
  return `${guest.groupName || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`;
}
