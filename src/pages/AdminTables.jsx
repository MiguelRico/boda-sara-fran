import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { ADMIN_PASSWORD } from "../constants/admin";
import {
  AdminEntityTabs,
  AdminPageShell,
  AdminPendingChangesActions,
  AdminTableSection,
  UnsavedChangesDialog,
} from "../components/admin/common";
import {
  PendingGuestAssignmentActions,
  PendingGuestsFilters,
  PendingGuestsList,
  SeatAssignmentDialog,
  TableCardsPage,
  TableEditorDialog,
  TableTabActions,
  TableTotalsPanel,
} from "../components/admin/tables";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import DeleteDialog from "../components/ui/DeleteDialog";
import { Table } from "../models";
import {
  assignGuestToSeatLocal,
  assignPendingGuestToSeatLocal,
  buildPendingTableChanges,
  buildTables,
  buildTableStats,
  createTableFormFromTable,
  getAssignableGuests,
  getChangedConfirmations,
  getGuestsUnassignedBySeatReduction,
  getPendingGuests,
  getPendingGuestRowKey,
  persistAdminTables,
  unassignGuestFromSeatLocal,
  unassignGuestsOutsideTableSize,
  upsertManualTable,
  getTableKey,
} from "../services/tablesService";
import { validateTableForm } from "../validators/tableValidators";
import { confirmationRepository } from "../repositories/confirmationRepository";
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
import useAdminLocalChanges from "../hooks/useAdminLocalChanges";
import { createEmptyTableForm } from "../constants/tables";
import { getTableRenderKey } from "../utils/renderKeys";
import { adminContent } from "../constants/adminContent";
import { tableContent } from "../constants/tableContent";
import { isMenuModuleEnabled } from "../config/features";
import { storageKeys } from "../config/storageKeys";
import { isAdminSessionAuthenticated } from "../utils/adminSession";
import { DEFAULT_TABLE_PAGE_SIZE } from "../utils/paginationState";
import { getStableJson } from "../utils/objectSnapshot";

const ADMIN_ACTIVE_TAB_KEY = storageKeys.adminActiveTabs.tables;
const SECTION_TABS = adminContent.tables.tabs;
const emptySavedSnapshot = {
  confirmations: [],
  manualTables: [],
};
const emptyState = {
  confirmations: [],
  loading: true,
  error: "",
};
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
  const isAuthenticated = isAdminSessionAuthenticated();
  const [state, setState] = useState(emptyState);
  const [manualTables, setManualTables] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState(emptySavedSnapshot);
  const [tableForm, setTableForm] = useState(createEmptyTableForm);
  const [tableFormSnapshot, setTableFormSnapshot] = useState("");
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
  const [popup, setPopup] = useState({
    message: "",
    open: false,
    title: "",
    type: "success",
  });
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
    items: tables,
    page,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    onPageChange: setPage,
    totalPages,
  });
  const {
    effectiveSelectedId: effectiveSelectedTableKey,
  } = useEffectiveSelection({
    allItems: tables,
    currentPage,
    getId: getTableKey,
    items: pagedTables,
    onPageChange: setPage,
    pageSize,
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
        isMenuModuleEnabled &&
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
    items: filteredPendingGuests,
    page: pendingGuestsPage,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const {
    handlePageChange: handlePendingGuestsPageChange,
    pageDirection: pendingGuestsPageDirection,
  } = usePageTransition({
    currentPage: currentPendingGuestsPage,
    onPageChange: setPendingGuestsPage,
    totalPages: pendingGuestsTotalPages,
  });
  const {
    effectiveSelectedId: effectiveSelectedPendingGuestKey,
    selectedItem: selectedPendingGuest,
  } = useEffectiveSelection({
    allItems: filteredPendingGuests,
    currentPage: currentPendingGuestsPage,
    getId: getPendingGuestRowKey,
    items: pagedPendingGuests,
    onPageChange: setPendingGuestsPage,
    pageSize: pendingGuestsPageSize,
    selectedId: selectedPendingGuestKey,
  });
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
    setTableFormSnapshot("");
    setTableFormErrors({});
  };

  const handleCreateTable = () => {
    const nextForm = createEmptyTableForm();

    setEditingTable(null);
    setTableForm(nextForm);
    setTableFormSnapshot(getStableJson(nextForm));
    setTableFormErrors({});
    setShowTableForm(true);
  };

  const handleEditTable = (table) => {
    const nextForm = createTableFormFromTable(table);

    setEditingTable(table);
    setTableForm(nextForm);
    setTableFormSnapshot(getStableJson(nextForm));
    setTableFormErrors({});
    setShowTableForm(true);
  };

  const handleRequestDeleteTable = (table) => {
    setTableToDelete(table);
  };

  const handleCancelDeleteTable = () => {
    setTableToDelete(null);
  };

  const showPendingPopup = useCallback(() => {
    setPopup({
      message: adminContent.tables.dialogs.pendingMessage,
      open: true,
      title: adminContent.tables.dialogs.pendingTitle,
      type: "success",
    });
  }, []);

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

    setSelectedTableKey("");
    setPage(1);
    setTableToDelete(null);
    showPendingPopup();
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

      await persistAdminTables({
        password: ADMIN_PASSWORD,
        tables: manualTables,
      });

      for (const group of changedConfirmations) {
        await confirmationRepository.saveAdmin({
          confirmation: group,
          password: ADMIN_PASSWORD,
        });
      }

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
  }, [
    pageSize,
    savedSnapshot.confirmations,
    savedSnapshot.manualTables,
  ]);

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
        showPendingPopup();
      } catch (error) {
        console.error("Error al asignar mesa:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || adminContent.tables.errors.assignTable,
        }));
        throw error;
      }
    },
    [showPendingPopup, state.confirmations, tables],
  );

  const handlePendingGuestsFilterChange = (filterKey, value) => {
    setPendingGuestsFilters((current) => ({
      ...current,
      [filterKey]: value,
    }));
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
      showPendingPopup();
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
      showPendingPopup();
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

    if (getStableJson(tableForm) === tableFormSnapshot) return;

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
    showPendingPopup();
  };

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
        <UnsavedChangesDialog
          changes={pendingChanges}
          onCancel={cancelBlockedNavigation}
          onConfirm={discardAndContinueNavigation}
          onSaveAndExit={saveAndContinueNavigation}
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
        isVisible={tablesInView}
        rootRef={tablesRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={tablesInView}>
          <TableTotalsPanel loading={state.loading} stats={tableStats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={tablesInView}>
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.tables.actions.discardChanges}
            discardDialogText={adminContent.tables.dialogs.discardPendingText}
            discardDialogTitle={adminContent.tables.dialogs.discardPendingTitle}
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
                    loading={state.loading}
                    onCreate={handleCreateTable}
                    showText={!isMobileView}
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
                onNextPage={() => handlePageChange(currentPage + 1)}
                onPrevPage={() => handlePageChange(currentPage - 1)}
                page={state.loading ? undefined : currentPage}
                pageDirection={pageDirection}
                pageLabel={adminContent.tables.header.pageLabel}
                pageSize={state.loading ? undefined : pageSize}
                sectionRef={tablesCardRef}
                skeletonConfig={{
                  actionCount: 1,
                  content: {
                    itemClassName: "min-h-40",
                    lines: 2,
                  },
                }}
                title={adminContent.tables.header.sectionTitle}
                totalPages={state.loading ? undefined : totalPages}
                renderMeasurePage={(items) => (
                  <TableCardsPage
                    items={items}
                    onDelete={handleRequestDeleteTable}
                    onEdit={handleEditTable}
                    onSeatClick={() => {}}
                    onSelect={() => {}}
                    onUnassignSeat={() => {}}
                    selectedTableKey={effectiveSelectedTableKey}
                  />
                )}
                renderPage={(items) => (
                  <TableCardsPage
                    items={items}
                    onDelete={handleRequestDeleteTable}
                    onEdit={handleEditTable}
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
                  handlePendingGuestsPageChange(currentPendingGuestsPage + 1)
                }
                onPrevPage={() =>
                  handlePendingGuestsPageChange(currentPendingGuestsPage - 1)
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
                  actionCount: 3,
                  content: {
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
      <StatusDialog
        eyebrow={adminContent.tables.dialogs.warningEyebrow}
        message={popup.message}
        onClose={() => setPopup((current) => ({ ...current, open: false }))}
        open={popup.open}
        title={popup.title}
        type={popup.type}
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
          onSubmit={handleTableSubmit}
          submitDisabled={getStableJson(tableForm) === tableFormSnapshot}
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
