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
import CardActions from "../components/admin/CardActions";
import CardGrid from "../components/admin/CardGrid";
import EditorDialog from "../components/admin/EditorDialog";
import PagedList from "../components/admin/PagedList";
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
import Pagination from "../components/ui/Pagination";
import SeatAssignmentModal from "../components/ui/SeatAssignmentModal";
import PendingGuestsList from "../components/admin/PendingGuestsList";
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
  loadAdminTableGroups,
  loadAdminTables,
  persistAdminTables,
  readStoredTables,
  unassignGuestFromSeatLocal,
  upsertManualTable,
  validateTableForm,
  getTableKey,
} from "../services/tablesService";
import { saveAdminGroup } from "../services/rsvpService";
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
  "grid grid-cols-2 gap-3 sm:flex sm:items-start sm:justify-between";
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
  const reduceMotion = useReducedMotion();
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);
  const [manualTables, setManualTables] = useState(readStoredTables);
  const [savedSnapshot, setSavedSnapshot] = useState(emptySavedSnapshot);
  const [tableForm, setTableForm] = useState(createEmptyTableForm);
  const [tableFormErrors, setTableFormErrors] = useState({});
  const [editingTable, setEditingTable] = useState(null);
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [seatAssignmentTarget, setSeatAssignmentTarget] = useState(null);
  const [assigningSeat, setAssigningSeat] = useState(false);
  const [page, setPage] = useState(1);
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
        const groupsPromise = loadAdminTableGroups({
          password: ADMIN_PASSWORD,
        });
        const storedTablesPromise = includeStoredTables
          ? loadAdminTables({ password: ADMIN_PASSWORD }).catch((error) => {
              console.error("Error al cargar mesas guardadas:", error);
              return readStoredTables();
            })
          : Promise.resolve(null);
        const [groups, storedTables] = await Promise.all([
          groupsPromise,
          storedTablesPromise,
        ]);

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
  const { handlePageChange, pageDirection, pageLoading, pageLoadingMinHeight } =
    usePageTransition({
      currentPage,
      isMobileList,
      onPageChange: setPage,
      totalPages,
    });
  const pagedTableCount = pagedTables.length;
  const pagedSeatCount = pagedTables.reduce(
    (total, table) => total + table.seats.length,
    0,
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
  const tabContentVariants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: { opacity: 0, y: 16, filter: "blur(6px)" },
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -12, filter: "blur(6px)" },
      };

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
    setState((prev) => ({
      ...prev,
      groups: updatedGroups,
      loading: false,
      error: "",
    }));

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
    setState((prev) => ({
      ...prev,
      groups: updatedGroups,
      loading: false,
      error: "",
    }));

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
            <section className="premium-card" ref={tablesCardRef}>
              <div className="mb-5">
                <div>
                  <p className="section-eyebrow mb-2">
                    {adminContent.tables.header.eyebrow}
                  </p>
                  <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                    Asientos asignados
                  </h2>

                  <div className="mt-3">
                    <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                      {activeTab === "tables" ? (
                        <>
                          {pagedTableCount}{" "}
                          {pagedTableCount === 1 ? "mesa" : "mesas"} en esta
                          pagina - {pagedSeatCount}{" "}
                          {pagedSeatCount === 1 ? "asiento" : "asientos"}
                        </>
                      ) : (
                        <>
                          {guestsPending.length}{" "}
                          {guestsPending.length === 1
                            ? "invitado pendiente"
                            : "invitados pendientes"}
                        </>
                      )}
                    </p>

                    <div className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
                      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                        <IconButton
                          className="w-full"
                          disabled={!tables.length}
                          icon={<Download size={16} strokeWidth={1.8} />}
                          label={adminContent.tables.header.exportTable}
                          onClick={() => downloadTablesCsv(tables)}
                          tone="terciary"
                        >
                          {adminContent.tables.header.exportTable}
                        </IconButton>

                        <IconButton
                          className="w-full"
                          icon={<Plus size={18} strokeWidth={2.4} />}
                          label={adminContent.tables.actions.addTable}
                          onClick={handleCreateTable}
                          tone="secondary"
                        >
                          {adminContent.tables.actions.addTable}
                        </IconButton>

                        <IconButton
                          className="w-full"
                          disabled={!hasPendingChanges || state.loading}
                          icon={<Undo2 size={16} strokeWidth={1.8} />}
                          label={adminContent.tables.actions.discardChanges}
                          onClick={handleDiscardPendingChanges}
                          tone="terciary"
                          type="button"
                        >
                          {adminContent.tables.actions.discardChanges}
                        </IconButton>

                        <IconButton
                          className="w-full"
                          disabled={!hasPendingChanges || spinner.loading}
                          icon={<Save size={16} strokeWidth={1.8} />}
                          label={adminContent.tables.actions.saveChanges}
                          onClick={handleSavePendingChanges}
                          tone="primary"
                        >
                          {adminContent.tables.actions.saveChanges}
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <TabNavigation
                tabs={SECTION_TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="mb-6"
              />

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "tables" ? (
                  <motion.div
                    animate="center"
                    exit="exit"
                    initial="enter"
                    key="tables-tab"
                    ref={tablesStartRef}
                    transition={{
                      duration: reduceMotion ? 0.18 : 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    variants={tabContentVariants}
                    style={
                      pageLoadingMinHeight
                        ? { minHeight: `${pageLoadingMinHeight}px` }
                        : undefined
                    }
                  >
                    {state.loading ? (
                      <CardListSkeleton
                        columnsClassName="lg:grid-cols-2"
                        itemClassName="min-h-40"
                        lines={2}
                      />
                    ) : (
                      <>
                        <div className="relative">
                          <div
                            className={
                              pageLoading
                                ? "pointer-events-none opacity-0"
                                : "opacity-100"
                            }
                          >
                            <CardGrid
                              emptyState={<TablesEmptyState />}
                              getKey={getTableRenderKey}
                              items={pagedTables}
                              renderCard={(table, index) => (
                                <TableCardWithActions
                                  index={index}
                                  onDelete={handleRequestDeleteTable}
                                  onEdit={handleEditTable}
                                  onSeatClick={handleSeatClick}
                                  onUnassignSeat={handleRemoveGuestFromSeat}
                                  table={table}
                                />
                              )}
                            />
                            <PagedList
                              allItems={tables}
                              className="bg-transparent"
                              direction={pageDirection}
                              getKey={getTableRenderKey}
                              itemClassName="absolute inset-x-0 top-0 grid gap-4"
                              items={pagedTables}
                              page={currentPage}
                              renderItem={(table) => (
                                <TableCardWithActions
                                  onDelete={handleRequestDeleteTable}
                                  onEdit={handleEditTable}
                                  onSeatClick={handleSeatClick}
                                  onUnassignSeat={handleRemoveGuestFromSeat}
                                  reveal={false}
                                  table={table}
                                />
                              )}
                              renderMeasureItem={(table) => (
                                <TableCardWithActions
                                  onDelete={() => {}}
                                  onEdit={() => {}}
                                  onSeatClick={() => {}}
                                  onUnassignSeat={() => {}}
                                  reveal={false}
                                  table={table}
                                />
                              )}
                            />
                          </div>

                          {pageLoading && (
                            <div className="absolute inset-x-0 top-0 z-10">
                              <CardListSkeleton
                                columnsClassName="lg:grid-cols-2"
                                itemClassName="min-h-40"
                                lines={2}
                              />
                            </div>
                          )}
                        </div>

                        <Pagination
                          isMobileList={isMobileList}
                          page={currentPage}
                          totalPages={totalPages}
                          currentLabel={adminContent.tables.header.pageLabel}
                          mobileLabel={
                            adminContent.tables.header.mobilePageLabel
                          }
                          onNext={() =>
                            handlePageChange(
                              currentPage + 1,
                              tablesStartRef.current,
                            )
                          }
                          onPrev={() =>
                            handlePageChange(
                              currentPage - 1,
                              tablesStartRef.current,
                            )
                          }
                        />
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    animate="center"
                    exit="exit"
                    initial="enter"
                    key="pending-tab"
                    transition={{
                      duration: reduceMotion ? 0.18 : 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    variants={tabContentVariants}
                  >
                    <PendingGuestsList
                      guests={guestsPending}
                      tables={tables}
                      onAssignTable={handleAssignGuestToTable}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
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

  const handleSubmit = (event) => {
    event.preventDefault();

    const [guestGroupName, guestIndex, guestName] = selectedGuest.split("|||");

    onAssign({ guestGroupName, guestIndex, guestName });
  };

  return (
    <SeatAssignmentModal
      eyebrow={tableContent.card.seatAssignmentEyebrow({
        seat: seat.seat,
        table: tableLabel,
      })}
      maxWidthClassName="max-w-2xl"
      onClose={onCancel}
      title={adminContent.tables.dialogs.assignmentTitle}
    >
      {currentGuestName && (
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          {adminContent.tables.dialogs.currentGuest(currentGuestName)}
        </p>
      )}

      <form noValidate onSubmit={handleSubmit}>
        <Label>{adminContent.tables.dialogs.guestLabel}</Label>
        <select
          className={selectClassName}
          disabled={assigning}
          onChange={(event) => setSelectedGuest(event.target.value)}
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

        <div
          className={`mt-6 flex flex-col gap-4 sm:grid ${
            canRemoveGuest ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {canRemoveGuest && (
            <IconButton
              disabled={assigning}
              icon={<Trash2 size={16} strokeWidth={1.8} />}
              label={adminContent.tables.dialogs.remove}
              onClick={onRemove}
              showText="always"
              tone="secondary"
              type="button"
            >
              {adminContent.tables.dialogs.remove}
            </IconButton>
          )}

          <IconButton
            disabled={!selectedGuest || assigning}
            icon={<Check size={16} strokeWidth={1.8} />}
            label={
              assigning
                ? adminContent.tables.dialogs.assigning
                : adminContent.tables.dialogs.assign
            }
            showText="always"
            tone="primary"
            type="submit"
          >
            {assigning
              ? adminContent.tables.dialogs.assigning
              : adminContent.tables.dialogs.assign}
          </IconButton>

          <IconButton
            disabled={assigning}
            icon={<X size={16} strokeWidth={1.8} />}
            label={adminContent.tables.dialogs.cancel}
            onClick={onCancel}
            showText="always"
            tone="terciary"
            type="button"
          >
            {adminContent.tables.dialogs.cancel}
          </IconButton>
        </div>
      </form>
    </SeatAssignmentModal>
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

function TableCardWithActions({
  index = 0,
  onDelete,
  onEdit,
  onSeatClick,
  onUnassignSeat,
  reveal = true,
  table,
}) {
  return (
    <div className="grid gap-3">
      <CardActions
        className="grid grid-cols-2 gap-3"
        deleteLabel={adminContent.tables.actions.deleteTable}
        editLabel={adminContent.tables.actions.editTable}
        item={table}
        onDelete={onDelete}
        onEdit={onEdit}
        showText={false}
      />
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
