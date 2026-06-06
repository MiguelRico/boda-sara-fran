import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Check,
  CircleCheckBig,
  CircleDashed,
  Grid2X2,
  Armchair,
  Trash2,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
} from "../components/admin/AdminMetricGrid";
import AdminTableSection from "../components/admin/AdminTableSection";
import CardGrid from "../components/admin/CardGrid";
import AdminEntityActions from "../components/admin/AdminEntityActions";
import AdminEntityTabs from "../components/admin/AdminEntityTabs";
import AdminEmptyState from "../components/admin/AdminEmptyState";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import AdminPageShell from "../components/admin/AdminPageShell";
import TableAnimatedInfoCard from "../components/admin/TableAnimatedInfoCard";
import TableEditorDialog from "../components/admin/tables/TableEditorDialog";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import DeleteDialog from "../components/ui/DeleteDialog";
import SeatAssignmentModal from "../components/ui/SeatAssignmentModal";
import PendingGuestsList, {
  PendingGuestsFilters,
} from "../components/admin/PendingGuestsList";
import { Label, selectClassName } from "../components/rsvp/FormPrimitives";
import { Guest, Table } from "../models";
import {
  assignGuestToSeatLocal,
  assignPendingGuestToSeatLocal,
  buildTables,
  buildTableStats,
  createTableFormFromTable,
  getAssignableGuests,
  getPendingGuests,
  persistAdminTables,
  unassignGuestFromSeatLocal,
  upsertManualTable,
  getTableKey,
} from "../services/tablesService";
import { validateTableForm } from "../validators/tableValidators";
import { saveAdminConfirmation } from "../api/confirmationsApi";
import {
  loadAdminDataOnce,
  markAdminDataSaved,
  setAdminConfirmations,
  setAdminTables,
} from "../services/adminDataStore";
import useSpinner from "../hooks/useSpinner";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useEffectiveSelection from "../hooks/useEffectiveSelection";
import useAdminActiveTab from "../hooks/useAdminActiveTab";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";
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
  confirmations: [],
  manualTables: [],
};
const emptyState = {
  confirmations: [],
  loading: true,
  error: "",
};
const TABLE_METRIC_GRID_CLASS =
  "grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4";
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
  const [pendingGuestsSelectedTable, setPendingGuestsSelectedTable] =
    useState("");
  const [pendingGuestsSelectedSeat, setPendingGuestsSelectedSeat] =
    useState("");
  const [pendingGuestsAssigningGuest, setPendingGuestsAssigningGuest] =
    useState("");
  const [pendingGuestsError, setPendingGuestsError] = useState("");
  const [selectedPendingGuestKey, setSelectedPendingGuestKey] = useState("");
  const [selectedTableKey, setSelectedTableKey] = useState("");
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const [activeTab, setActiveTab] = useAdminActiveTab(
    ADMIN_ACTIVE_TAB_KEY,
    "tables",
  );

  const loadTables = useCallback(
    async ({ includeStoredTables = true, showLoading = true } = {}) => {
      if (showLoading) {
        setState((prev) => ({ ...prev, loading: true, error: "" }));
      }

      try {
        const snapshot = await loadAdminDataOnce({ password: ADMIN_PASSWORD });
        const confirmations = snapshot.confirmations;
        const storedTables = includeStoredTables
          ? snapshot.tables
          : manualTablesRef.current;

        if (storedTables) {
          setManualTables(storedTables);
        }

        setSavedSnapshot({
          confirmations,
          manualTables: storedTables || manualTablesRef.current || [],
        });
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

  const tables = useMemo(() => {
    return buildTables({ confirmations: state.confirmations, manualTables });
  }, [manualTables, state.confirmations]);
  const assignableGuests = useMemo(
    () => getAssignableGuests(state.confirmations),
    [state.confirmations],
  );
  const guestsPending = useMemo(
    () => getPendingGuests(state.confirmations),
    [state.confirmations],
  );
  const guestsAssigned = useMemo(
    () => assignableGuests.filter((guest) => guest.table && guest.seat),
    [assignableGuests],
  );
  const tableStats = useMemo(
    () => ({
      ...buildTableStats(tables),
      assignedSeats: guestsAssigned.length,
      pendingSeats: guestsPending.length,
    }),
    [guestsAssigned.length, guestsPending.length, tables],
  );
  const {
    currentPage,
    isMobileView,
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
    onPageChange: setPage,
    totalPages,
  });
  const {
    effectiveSelectedId: effectiveSelectedTableKey,
    selectedItem: selectedTable,
  } = useEffectiveSelection({
    getId: getTableKey,
    items: pagedTables,
    selectedId: selectedTableKey,
  });
  const pendingChanges = useMemo(
    () =>
      buildPendingTableChanges({
        currentConfirmations: state.confirmations,
        currentManualTables: manualTables,
        savedConfirmations: savedSnapshot.confirmations,
        savedManualTables: savedSnapshot.manualTables,
      }),
    [manualTables, savedSnapshot, state.confirmations],
  );
  const hasPendingChanges = pendingChanges.length > 0;
  const changedConfirmations = useMemo(
    () =>
      getChangedConfirmations(savedSnapshot.confirmations, state.confirmations),
    [savedSnapshot.confirmations, state.confirmations],
  );

  const blocker = useUnsavedChangesNavigation(hasPendingChanges);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedChangesDialog(true);
    }
  }, [blocker.state]);

  const pendingGuestConfirmations = useMemo(() => {
    const groupSet = new Set(
      guestsPending.map((guest) => guest.confirmationName).filter(Boolean),
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
        guest.confirmationName !== pendingGuestsFilters.group
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
  const selectedPendingGuest = useMemo(
    () =>
      pagedPendingGuests.find(
        (guest) =>
          getPendingGuestRowKey(guest) === effectiveSelectedPendingGuestKey,
      ) || null,
    [effectiveSelectedPendingGuestKey, pagedPendingGuests],
  );
  const pendingGuestTablesWithSeats = useMemo(
    () => tables.filter((table) => Table.getEmptySeats(table).length > 0),
    [tables],
  );
  const pendingGuestsSelectedTableObj = useMemo(
    () =>
      pendingGuestTablesWithSeats.find(
        (table) => table.name === pendingGuestsSelectedTable,
      ) || null,
    [pendingGuestTablesWithSeats, pendingGuestsSelectedTable],
  );
  const pendingGuestsAvailableSeats = useMemo(() => {
    if (!pendingGuestsSelectedTableObj) return [];

    return Table.getEmptySeats(pendingGuestsSelectedTableObj).map(
      (seat) => seat.seat,
    );
  }, [pendingGuestsSelectedTableObj]);
  const pendingGuestsEmptyState = getPendingGuestsEmptyState({
    pendingCount: guestsPending.length,
    tableCount: tables.length,
  });
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
    const updatedConfirmations = state.confirmations.map((group) => {
      let changed = false;

      const guests = group.guests.map((guest) => {
        if (getTableKey({ name: guest.table }) !== tableKey) return guest;

        changed = true;

        return {
          ...guest,
          table: "",
          tableId: "",
          seat: "",
        };
      });

      return changed ? { ...group, guests } : group;
    });

    setManualTables(nextManualTables);
    setAdminTables(nextManualTables);
    setState((prev) => ({
      ...prev,
      confirmations: updatedConfirmations,
      loading: false,
      error: "",
    }));
    setAdminConfirmations(updatedConfirmations);

    if (editingTable && getTableKey(editingTable) === tableKey) {
      handleCloseTableForm();
    }

    const nextTables = buildTables({
      confirmations: updatedConfirmations,
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
    if (!hasPendingChanges) return true;

    try {
      spinner.show(adminContent.tables.spinner.save);

      const persistencePromises = [
        persistAdminTables({
          password: ADMIN_PASSWORD,
          tables: manualTables,
        }),
        ...changedConfirmations.map((group) =>
          saveAdminConfirmation({
            confirmation: group,
            password: ADMIN_PASSWORD,
          }),
        ),
      ];

      await Promise.all(persistencePromises);

      setAdminTables(manualTables);
      setAdminConfirmations(state.confirmations);
      markAdminDataSaved({
        confirmations: state.confirmations,
        tables: manualTables,
      });
      setSavedSnapshot({
        confirmations: state.confirmations,
        manualTables,
      });
      return true;
    } catch (error) {
      console.error("Error al guardar cambios de mesas:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || adminContent.tables.errors.save,
      }));
      return false;
    } finally {
      spinner.hide();
    }
  };

  const handleDiscardPendingChanges = useCallback(() => {
    const restoredManualTables = savedSnapshot.manualTables;
    const restoredConfirmations = savedSnapshot.confirmations;

    setManualTables(restoredManualTables);
    setAdminTables(restoredManualTables);
    setAdminConfirmations(restoredConfirmations);
    setState((prev) => ({
      ...prev,
      confirmations: restoredConfirmations,
      loading: false,
      error: "",
    }));
    setTableToDelete(null);
    setSeatAssignmentTarget(null);
    handleCloseTableForm();

    const restoredTables = buildTables({
      confirmations: restoredConfirmations,
      manualTables: restoredManualTables,
    });
    const restoredTotalPages = Math.max(
      Math.ceil(restoredTables.length / pageSize),
      1,
    );

    setPage((current) => Math.min(current, restoredTotalPages));
  }, [pageSize, savedSnapshot.confirmations, savedSnapshot.manualTables]);

  const handleAssignGuestToTable = useCallback(
    async ({
      confirmationId,
      guestId,
      guestconfirmationName,
      guestIndex,
      tableName,
      seatNumber,
    }) => {
      try {
        const updatedConfirmations = assignPendingGuestToSeatLocal({
          confirmations: state.confirmations,
          confirmationId,
          guestconfirmationName,
          guestId,
          guestIndex,
          seatNumber,
          tableName,
          tables,
        });
        setState((prev) => ({
          ...prev,
          confirmations: updatedConfirmations,
          loading: false,
          error: "",
        }));
        setAdminConfirmations(updatedConfirmations);
      } catch (error) {
        console.error("Error al asignar mesa:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || adminContent.tables.errors.assignTable,
        }));
        throw error;
      }
    },
    [state.confirmations, tables],
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
          confirmationId: guest.confirmationId,
          guestId: guest.guestId || guest.id,
          guestconfirmationName: guest.confirmationName,
          guestIndex: guest.guestIndex,
          tableName,
          seatNumber,
        });
        setPendingGuestsSelectedTable("");
        setPendingGuestsSelectedSeat("");
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
    confirmationId,
    guestId,
    guestconfirmationName,
    guestIndex,
    guestName,
  }) => {
    if (!seatAssignmentTarget || (!confirmationId && !guestconfirmationName))
      return;

    setAssigningSeat(true);
    setState((prev) => ({ ...prev, error: "" }));

    try {
      const updatedConfirmations = assignGuestToSeatLocal({
        confirmationId,
        confirmations: state.confirmations,
        guestId,
        guestconfirmationName,
        guestIndex,
        guestName,
        seat: seatAssignmentTarget.seat,
        table: seatAssignmentTarget.table,
      });
      setSeatAssignmentTarget(null);
      setState((prev) => ({
        ...prev,
        confirmations: updatedConfirmations,
        loading: false,
        error: "",
      }));
      setAdminConfirmations(updatedConfirmations);
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
      const updatedConfirmations = unassignGuestFromSeatLocal({
        confirmations: state.confirmations,
        seat: target.seat,
        table: target.table,
      });
      if (target === seatAssignmentTarget) {
        setSeatAssignmentTarget(null);
      }
      setState((prev) => ({
        ...prev,
        confirmations: updatedConfirmations,
        loading: false,
        error: "",
      }));
      setAdminConfirmations(updatedConfirmations);
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
    const updatedConfirmations = editingTable
      ? unassignGuestsOutsideTableSize({
          confirmations: state.confirmations,
          seatCount: tableForm.seatCount,
          table: editingTable,
        })
      : state.confirmations;

    setManualTables(nextManualTables);
    setAdminTables(nextManualTables);
    setState((prev) => ({
      ...prev,
      confirmations: updatedConfirmations,
      loading: false,
      error: "",
    }));
    setAdminConfirmations(updatedConfirmations);

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

  const handleSaveAndExitBlockedNavigation = async () => {
    const saved = await handleSavePendingChanges();

    setShowUnsavedChangesDialog(false);

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

      {showUnsavedChangesDialog && (
        <UnsavedChangesDialog
          changes={pendingChanges}
          onCancel={handleCancelBlockedNavigation}
          onConfirm={handleConfirmBlockedNavigation}
          onSaveAndExit={handleSaveAndExitBlockedNavigation}
          labels={{
            eyebrow: adminContent.tables.dialogs.unsavedEyebrow,
            exitWithoutSaving: adminContent.tables.dialogs.exitWithoutSaving,
            keepEditing: adminContent.tables.dialogs.keepEditing,
            saveAndExit: adminContent.tables.dialogs.saveAndExit,
            text: adminContent.tables.dialogs.unsavedText,
            title: adminContent.tables.dialogs.unsavedTitle,
          }}
          titleId="unsaved-table-changes-title"
        />
      )}

      <AdminPageShell
        header={{
          eyebrow: adminContent.tables.header.adminEyebrow,
          text: adminContent.tables.header.text,
          title: adminContent.tables.header.title,
        }}
        isMobileView={isMobileView}
        isVisible={tablesInView}
        rootRef={tablesRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={tablesInView}>
          <TablesOverview loading={state.loading} stats={tableStats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={tablesInView}>
          <AdminPendingChangesActions
            discardLabel={adminContent.tables.actions.discardChanges}
            hasPendingChanges={hasPendingChanges}
            loading={state.loading}
            onDiscard={handleDiscardPendingChanges}
            onSave={handleSavePendingChanges}
            saveLabel={adminContent.tables.actions.saveChanges}
            saving={spinner.loading}
            showText={!isMobileView}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={tablesInView}>
          <AdminEntityTabs
            tabs={SECTION_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          >
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
                    onSave={handleSavePendingChanges}
                    saving={spinner.loading}
                    selectedTable={selectedTable}
                    showText={!isMobileView}
                    tables={tables}
                  />
                }
                contentRef={tablesStartRef}
                eyebrow={adminContent.tables.header.eyebrow}
                getKey={getTableRenderKey}
                isMobileView={isMobileView}
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
                skeletonConfig={{
                  content: {
                    columnsClassName: "lg:grid-cols-2",
                    itemClassName: "min-h-40",
                    lines: 2,
                  },
                }}
                title={adminContent.tables.header.sectionTitle}
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
                actions={
                  tables.length > 0 && filteredPendingGuests.length > 0 ? (
                    <PendingGuestAssignmentActions
                      assigning={
                        pendingGuestsAssigningGuest ===
                        effectiveSelectedPendingGuestKey
                      }
                      availableSeats={pendingGuestsAvailableSeats}
                      disabled={!selectedPendingGuest}
                      onAssign={() =>
                        selectedPendingGuest &&
                        handleAssignPendingGuest(
                          selectedPendingGuest,
                          pendingGuestsSelectedTable,
                          pendingGuestsSelectedSeat,
                        )
                      }
                      onSeatChange={setPendingGuestsSelectedSeat}
                      onTableChange={(value) => {
                        setPendingGuestsSelectedTable(value);
                        setPendingGuestsSelectedSeat("");
                      }}
                      selectedSeat={pendingGuestsSelectedSeat}
                      selectedTable={pendingGuestsSelectedTable}
                      tables={pendingGuestTablesWithSeats}
                    />
                  ) : null
                }
                contentRef={tablesStartRef}
                eyebrow={adminContent.pendingGuests.pendingEyebrow}
                filters={
                  tables.length > 0 &&
                  guestsPending.length > 0 && (
                    <PendingGuestsFilters
                      availableConfirmations={pendingGuestConfirmations}
                      availableMenus={pendingGuestMenus}
                      filters={pendingGuestsFilters}
                      onFilterChange={handlePendingGuestsFilterChange}
                    />
                  )
                }
                getKey={getPendingGuestRowKey}
                isMobileView={isMobileView}
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
                skeletonConfig={{
                  content: {
                    columnsClassName: "lg:grid-cols-2",
                    itemClassName: "min-h-40",
                    lines: 2,
                  },
                  filters: true,
                }}
                sourceItemsCount={tables.length > 0 ? guestsPending.length : 0}
                title={adminContent.pendingGuests.title}
                totalPages={state.loading ? undefined : pendingGuestsTotalPages}
                renderMeasurePage={(items) => (
                  <PendingGuestsList
                    emptyText={pendingGuestsEmptyState.text}
                    emptyTitle={pendingGuestsEmptyState.title}
                    guests={items}
                    onSelect={() => {}}
                    selectedGuestKey={effectiveSelectedPendingGuestKey}
                  />
                )}
                renderPage={(items) => (
                  <PendingGuestsList
                    emptyText={pendingGuestsEmptyState.text}
                    emptyTitle={pendingGuestsEmptyState.title}
                    error={pendingGuestsError}
                    guests={items}
                    onSelect={(guest) =>
                      setSelectedPendingGuestKey(getPendingGuestRowKey(guest))
                    }
                    selectedGuestKey={effectiveSelectedPendingGuestKey}
                  />
                )}
              />
            )}
          </AdminEntityTabs>
        </CinematicStaggeredRevealItem>
      </AdminPageShell>

      <StatusDialog
        eyebrow={adminContent.tables.dialogs.warningEyebrow}
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title={adminContent.tables.dialogs.problemTitle}
        type="error"
      />

      {showTableForm && (
        <TableEditorDialog
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
    ? Guest.getFullName(currentGuest, "Invitado")
    : seat.guest
      ? Guest.getFullName(seat.guest, "Invitado")
      : "";
  const canRemoveGuest = Boolean(currentGuest);
  const [selectedGuestKey, setSelectedGuestKey] = useState(
    currentGuest ? getPendingGuestRowKey(currentGuest) : "",
  );
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const assignableGuests = guests.filter((guest) => {
    if (!guest.table || !guest.seat) return true;

    return (
      currentGuest &&
      getPendingGuestRowKey(guest) === getPendingGuestRowKey(currentGuest)
    );
  });
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

    if (filters.menu && guest.menu !== filters.menu) {
      return false;
    }

    return true;
  });
  const { currentPage, isMobileView, pageSize, pagedItems, totalPages } =
    usePagedData({
      desktopPageSize: 4,
      items: filteredGuests,
      mobilePageSize: 1,
      page,
    });
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    onPageChange: setPage,
    totalPages,
  });
  const effectiveSelectedGuestKey = filteredGuests.some(
    (guest) => getPendingGuestRowKey(guest) === selectedGuestKey,
  )
    ? selectedGuestKey
    : pagedItems[0]
      ? getPendingGuestRowKey(pagedItems[0])
      : "";
  const selectedGuest =
    filteredGuests.find(
      (guest) => getPendingGuestRowKey(guest) === effectiveSelectedGuestKey,
    ) || null;

  const handleAssign = () => {
    if (!selectedGuest) return;

    onAssign({
      confirmationId: selectedGuest.confirmationId,
      guestId: selectedGuest.guestId || selectedGuest.id,
      guestconfirmationName: selectedGuest.confirmationName,
      guestIndex: selectedGuest.guestIndex,
      guestName: Guest.getFullName(selectedGuest, "Invitado"),
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
    setPage(1);
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
        <AdminTableSection
          actions={
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
                onClick={handleAssign}
                tone="primary"
                type="button"
              >
                {assigning
                  ? adminContent.tables.dialogs.assigning
                  : adminContent.tables.dialogs.assign}
              </IconButton>
            </div>
          }
          className="p-4 shadow-none hover:translate-y-0 sm:p-5"
          contentRef={contentRef}
          count={`${filteredGuests.length} ${
            filteredGuests.length === 1 ? "invitado" : "invitados"
          }`}
          eyebrow={adminContent.tables.dialogs.guestLabel}
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
              emptyText={getSeatAssignmentEmptyState(guests.length).text}
              emptyTitle={getSeatAssignmentEmptyState(guests.length).title}
              guests={items}
              onSelect={() => {}}
              selectedGuestKey={effectiveSelectedGuestKey}
            />
          )}
          renderPage={(items) => (
            <PendingGuestsList
              emptyText={getSeatAssignmentEmptyState(guests.length).text}
              emptyTitle={getSeatAssignmentEmptyState(guests.length).title}
              guests={items}
              onSelect={(guest) =>
                setSelectedGuestKey(getPendingGuestRowKey(guest))
              }
              selectedGuestKey={effectiveSelectedGuestKey}
            />
          )}
          sourceItemsCount={guests.length}
          title={adminContent.tables.dialogs.guestPlaceholder}
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

function TablesOverview({ loading, stats }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-2">
        {adminContent.tables.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
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
      emoji: <Grid2X2 size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.seatCount,
      value: stats.totalSeats,
      emoji: <Armchair size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.assignedSeats,
      value: stats.assignedSeats,
      emoji: <CircleCheckBig size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.pendingSeats,
      value: stats.pendingSeats,
      emoji: <CircleDashed size={22} strokeWidth={1.8} />,
    },
  ];
}

function TablesEmptyState() {
  return (
    <AdminEmptyState
      text={adminContent.tables.empty.text}
      title={adminContent.tables.empty.title}
    />
  );
}

function TableTabActions({
  hasPendingChanges,
  loading,
  onCreate,
  onDelete,
  onDiscard,
  onEdit,
  onSave,
  saving,
  selectedTable,
  showText = true,
  tables,
}) {
  return (
    <AdminEntityActions
      addLabel={adminContent.tables.actions.addTable}
      deleteLabel={adminContent.tables.actions.deleteTable}
      discardLabel={adminContent.tables.actions.discardChanges}
      editLabel={adminContent.tables.actions.editTable}
      hasItems={tables.length > 0}
      hasPendingChanges={hasPendingChanges}
      loading={loading}
      onCreate={onCreate}
      onDelete={onDelete}
      onDiscard={onDiscard}
      onEdit={onEdit}
      onSave={onSave}
      saveLabel={adminContent.tables.actions.saveChanges}
      saving={saving}
      selectedItem={selectedTable}
      showText={showText}
    />
  );
}

function PendingGuestAssignmentActions({
  assigning,
  availableSeats,
  disabled,
  onAssign,
  onSeatChange,
  onTableChange,
  selectedSeat,
  selectedTable,
  tables,
}) {
  const canAssign = Boolean(!disabled && selectedTable && selectedSeat);

  return (
    <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <div>
        <Label>{adminContent.pendingGuests.tableLabel}</Label>
        <select
          className={`${selectClassName} text-sm`}
          disabled={disabled || assigning}
          onChange={(event) => onTableChange(event.target.value)}
          value={selectedTable}
        >
          <option value="">
            {adminContent.pendingGuests.tablePlaceholder}
          </option>
          {tables.map((table) => {
            const emptySeats = Table.getEmptySeats(table);
            const label = `${table.name} (${adminContent.pendingGuests.emptySeatsLabel(emptySeats.length)})`;

            return (
              <option key={table.name} value={table.name}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <Label>{adminContent.pendingGuests.seatLabel}</Label>
        <select
          className={`${selectClassName} text-sm`}
          disabled={!selectedTable || disabled || assigning}
          onChange={(event) => onSeatChange(event.target.value)}
          value={selectedSeat}
        >
          <option value="">
            {selectedTable
              ? adminContent.pendingGuests.tablePlaceholder
              : adminContent.pendingGuests.selectTableFirst}
          </option>
          {availableSeats.map((seatNum) => (
            <option key={seatNum} value={seatNum}>
              {adminContent.pendingGuests.seatOption(seatNum)}
            </option>
          ))}
        </select>
      </div>

      <IconButton
        className="w-full self-end"
        disabled={!canAssign || assigning}
        icon={
          assigning ? (
            <span className="inline-block animate-spin">...</span>
          ) : (
            <Check size={16} strokeWidth={2} />
          )
        }
        label={
          assigning
            ? adminContent.pendingGuests.assigning
            : adminContent.pendingGuests.assign
        }
        onClick={onAssign}
        showText="always"
        tone={canAssign ? "primary" : "default"}
      >
        {assigning
          ? adminContent.pendingGuests.assigning
          : adminContent.pendingGuests.assign}
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
  if (!items.length) return <TablesEmptyState />;

  return (
    <>
      <CardGrid
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
    </>
  );
}

function getPendingGuestsEmptyState({ pendingCount, tableCount }) {
  if (tableCount === 0) {
    return {
      text: adminContent.pendingGuests.noTablesText,
      title: adminContent.pendingGuests.noTablesTitle,
    };
  }

  if (pendingCount > 0) {
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

function buildPendingTableChanges({
  currentConfirmations,
  currentManualTables,
  savedConfirmations,
  savedManualTables,
}) {
  const changes = [
    ...buildManualTableChanges(savedManualTables, currentManualTables),
    ...buildSeatAssignmentChanges(savedConfirmations, currentConfirmations),
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

function buildSeatAssignmentChanges(savedConfirmations, currentConfirmations) {
  const savedByConfirmationId = new Map(
    savedConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const changes = [];

  currentConfirmations.forEach((group) => {
    const savedGroup = savedByConfirmationId.get(getConfirmationKey(group));

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

function getChangedConfirmations(savedConfirmations, currentConfirmations) {
  const savedByConfirmationId = new Map(
    savedConfirmations.map((group) => [
      getConfirmationKey(group),
      getStableJson(group),
    ]),
  );

  return currentConfirmations.filter(
    (group) =>
      savedByConfirmationId.get(getConfirmationKey(group)) !==
      getStableJson(group),
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

function unassignGuestsOutsideTableSize({ confirmations, seatCount, table }) {
  const tableKey = getTableKey(table);
  const nextSeatCount = Number(seatCount) || 0;

  if (!tableKey || !nextSeatCount) return confirmations;

  return confirmations.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest) => {
      const isRemovedSeat =
        getTableKey({ name: guest.table }) === tableKey &&
        Number(guest.seat) > nextSeatCount;

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

function getPendingGuestRowKey(guest) {
  return (
    guest.guestId ||
    guest.id ||
    `${guest.confirmationId || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`
  );
}

function getConfirmationKey(group) {
  return group.confirmationId || group.id;
}
