import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Navigate, useBeforeUnload, useBlocker } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleDashed,
  Download,
  Grid2X2,
  Armchair,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Undo2,
  X,
  Home,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import { createEmptyTableForm } from "../constants/tables";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
} from "../components/admin/AdminMetricGrid";
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

const ADMIN_ACTIVE_TAB_KEY = "admin-tables-active-tab";
const SECTION_TABS = [
  { id: "tables", label: "Mesas" },
  { id: "pending", label: "Invitados Pendientes" },
];
const desktopPageSize = 4;
const mobilePageSize = 1;
const pageDataSwapDelay = 680;
const pageRevealDelay = 160;
const mobilePageHeightLockDelay = 560;
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
const tableEditorContent = {
  eyebrow: "Mesa",
  title: "Editar mesa",
  submitText: "Guardar",
  cancelText: "Cancelar",
  fields: {
    name: {
      label: "Nombre de la mesa *",
      placeholder: "Ej: Mesa 1",
    },
    group: {
      label: "Grupo *",
    },
    shape: {
      label: "Forma *",
    },
    seatCount: {
      label: "Numero de asientos *",
    },
    notes: {
      label: "Notas",
      placeholder:
        "Ej: Cerca de la pista, mesa infantil, indicaciones del catering...",
    },
  },
};
export default function AdminTables() {
  const spinner = useSpinner();
  const tablesRef = useRef(null);
  const tablesCardRef = useRef(null);
  const tablesStartRef = useRef(null);
  const manualTablesRef = useRef(null);
  const pageLoadingTimeoutRef = useRef(null);
  const pageRevealTimeoutRef = useRef(null);
  const pageScrollStartFrameRef = useRef(null);
  const pageScrollCancelRef = useRef(null);
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
  const [pageDirection, setPageDirection] = useState(1);
  const [isMobileList, setIsMobileList] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageLoadingMinHeight, setPageLoadingMinHeight] = useState(null);
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
          error:
            "No se pudieron cargar las mesas. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
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

  useEffect(() => {
    return () => {
      if (pageLoadingTimeoutRef.current) {
        window.clearTimeout(pageLoadingTimeoutRef.current);
      }

      if (pageRevealTimeoutRef.current) {
        window.clearTimeout(pageRevealTimeoutRef.current);
      }

      if (pageScrollStartFrameRef.current) {
        window.cancelAnimationFrame(pageScrollStartFrameRef.current);
      }

      pageScrollCancelRef.current?.();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobileList = () => setIsMobileList(mediaQuery.matches);

    updateIsMobileList();
    mediaQuery.addEventListener("change", updateIsMobileList);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobileList);
    };
  }, []);

  const tables = useMemo(() => {
    return buildTables({ groups: state.groups, manualTables });
  }, [manualTables, state.groups]);
  const tableStats = useMemo(() => buildTableStats(tables), [tables]);
  const pageSize = isMobileList ? mobilePageSize : desktopPageSize;
  const totalPages = Math.max(Math.ceil(tables.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedTables = tables.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
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

  const cancelPageLoading = () => {
    if (pageLoadingTimeoutRef.current) {
      window.clearTimeout(pageLoadingTimeoutRef.current);
      pageLoadingTimeoutRef.current = null;
    }

    if (pageRevealTimeoutRef.current) {
      window.clearTimeout(pageRevealTimeoutRef.current);
      pageRevealTimeoutRef.current = null;
    }

    if (pageScrollStartFrameRef.current) {
      window.cancelAnimationFrame(pageScrollStartFrameRef.current);
      pageScrollStartFrameRef.current = null;
    }

    pageScrollCancelRef.current?.();
    pageScrollCancelRef.current = null;

    setPageLoading(false);
    setPageLoadingMinHeight(null);
  };

  const handlePageChange = (nextPage) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

    if (clampedPage === currentPage || pageLoading) return;

    const tableElement = tablesStartRef.current;
    const tableRect = tableElement?.getBoundingClientRect();
    const tableHeight = tableRect?.height || null;
    const direction = clampedPage > currentPage ? 1 : -1;

    cancelPageLoading();

    if (isMobileList) {
      setPageLoadingMinHeight(tableHeight);
      setPageDirection(direction);
      setPage(clampedPage);
      pageRevealTimeoutRef.current = window.setTimeout(() => {
        setPageLoadingMinHeight(null);
        pageRevealTimeoutRef.current = null;
      }, mobilePageHeightLockDelay);

      return;
    }

    setPageDirection(direction);
    setPageLoadingMinHeight(tableHeight);
    setPageLoading(true);
    pageLoadingTimeoutRef.current = window.setTimeout(() => {
      setPage(clampedPage);
      pageLoadingTimeoutRef.current = null;

      pageRevealTimeoutRef.current = window.setTimeout(() => {
        setPageLoading(false);
        setPageLoadingMinHeight(null);
        pageRevealTimeoutRef.current = null;
      }, pageRevealDelay);
    }, pageDataSwapDelay);
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

  const handleRefreshTables = useCallback(async () => {
    if (hasPendingChanges) {
      setState((prev) => ({
        ...prev,
        error:
          "Guarda o descarta los cambios pendientes antes de actualizar las mesas.",
      }));
      return;
    }

    try {
      spinner.show("Actualizando mesas...");
      await loadTables({ showLoading: false });
    } finally {
      spinner.hide();
    }
  }, [hasPendingChanges, loadTables, spinner]);

  const handleSavePendingChanges = async () => {
    if (!hasPendingChanges) return;

    try {
      spinner.show("Guardando cambios...");

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
        error:
          error.message ||
          "No se pudieron guardar los cambios. Intenta de nuevo.",
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
          error:
            error.message || "No se pudo asignar la mesa. Intenta de nuevo.",
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
        error:
          error.message || "No se pudo asignar el asiento. Intenta de nuevo.",
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
        error:
          error.message || "No se pudo liberar el asiento. Intenta de nuevo.",
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
              eyebrow="Panel privado"
              title="Mesas"
              titleAs="h1"
              text="Organización de mesas, asientos e invitados asignados."
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={2} isVisible={tablesInView}>
            <TablesOverview loading={state.loading} stats={tableStats} />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={tablesInView}>
            <section className="premium-card" ref={tablesCardRef}>
              <div className="mb-5">
                <div>
                  <p className="section-eyebrow mb-2">Distribución</p>
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
                      <div className="grid w-full grid-cols-3 gap-3">
                        <IconButton
                          className="w-full"
                          disabled={!tables.length}
                          icon={<Download size={16} strokeWidth={1.8} />}
                          label="Exportar tabla"
                          onClick={() => downloadTablesCsv(tables)}
                          tone="terciary"
                        >
                          Exportar tabla
                        </IconButton>

                        <IconButton
                          className="w-full"
                          icon={<Plus size={18} strokeWidth={2.4} />}
                          label="Agregar mesa"
                          onClick={handleCreateTable}
                          tone="secondary"
                        >
                          Agregar mesa
                        </IconButton>

                        <IconButton
                          className="w-full"
                          disabled={!hasPendingChanges || spinner.loading}
                          icon={<Save size={16} strokeWidth={1.8} />}
                          label="Guardar cambios"
                          onClick={handleSavePendingChanges}
                          tone="primary"
                        >
                          Guardar cambios
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
                      <TablesSkeleton />
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
                            <TablesGrid
                              onDelete={handleRequestDeleteTable}
                              onEdit={handleEditTable}
                              onSeatClick={handleSeatClick}
                              onUnassignSeat={handleRemoveGuestFromSeat}
                              tables={pagedTables}
                            />
                            <MobileTablesList
                              direction={pageDirection}
                              onDelete={handleRequestDeleteTable}
                              onEdit={handleEditTable}
                              onSeatClick={handleSeatClick}
                              onUnassignSeat={handleRemoveGuestFromSeat}
                              page={currentPage}
                              tables={pagedTables}
                              allTables={tables}
                            />
                          </div>

                          {pageLoading && (
                            <div className="absolute inset-x-0 top-0 z-10">
                              <TablesSkeleton />
                            </div>
                          )}
                        </div>

                        <Pagination
                          isMobileList={isMobileList}
                          page={currentPage}
                          totalPages={totalPages}
                          onNext={() => handlePageChange(currentPage + 1)}
                          onPrev={() => handlePageChange(currentPage - 1)}
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

          <CinematicStaggeredRevealItem index={4} isVisible={tablesInView}>
            <TablesPageActions
              hasPendingChanges={hasPendingChanges}
              loading={state.loading}
              onDiscardChanges={handleDiscardPendingChanges}
              onRefresh={handleRefreshTables}
            />
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      <StatusDialog
        eyebrow="Aviso"
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title="Ha ocurrido un problema"
        type="error"
      />

      {showTableForm && (
        <TableEditor
          content={editingTable ? tableEditorContent : undefined}
          errors={tableFormErrors}
          form={tableForm}
          seatReductionWarning={tableSeatReductionWarning}
          title={editingTable ? "Editar mesa" : "Crear mesa"}
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
          title="Eliminar mesa"
          message={`¿Estás seguro que deseas eliminar la mesa ${
            tableToDelete.name
          }? Esta acción liberará cualquier asiento asignado a esta mesa.`}
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
  useViewportScrollLock(true);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby="table-editor-title"
        aria-modal="true"
        className="premium-card max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto p-5 sm:max-h-[calc(100dvh-3rem)] sm:p-7"
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
            {/* <p className="section-eyebrow mb-2">Mesa</p> */}

            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border-strong)] bg-white/70 text-xl">
              <Armchair size={22} strokeWidth={1.8} />
            </span>
            <h2
              className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]"
              id="table-editor-title"
            >
              {title}
            </h2>
          </div>

          <IconButton label="Cerrar" onClick={onCancel}>
            <X size={17} strokeWidth={1.8} />
          </IconButton>
        </div>

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
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
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
  useViewportScrollLock(true);

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

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby="seat-assignment-title"
        aria-modal="true"
        className="premium-card max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto p-5 sm:max-h-[calc(100dvh-3rem)] sm:p-7"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">
              Mesa {tableLabel} - Asiento {seat.seat}
            </p>
            <h2
              className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]"
              id="seat-assignment-title"
            >
              Asignar invitado
            </h2>
            {currentGuestName && (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Actualmente asignado a {currentGuestName}.
              </p>
            )}
          </div>

          <IconButton disabled={assigning} label="Cerrar" onClick={onCancel}>
            <X size={17} strokeWidth={1.8} />
          </IconButton>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <Label>Invitado</Label>
          <select
            className={selectClassName}
            disabled={assigning}
            onChange={(event) => setSelectedGuest(event.target.value)}
            value={selectedGuest}
          >
            <option value="">Seleccionar invitado</option>
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
                label="Eliminar"
                onClick={onRemove}
                showText="always"
                tone="secondary"
                type="button"
              >
                Eliminar
              </IconButton>
            )}

            <IconButton
              disabled={!selectedGuest || assigning}
              icon={<Check size={16} strokeWidth={1.8} />}
              label={assigning ? "Asignando..." : "Asignar invitado"}
              showText="always"
              tone="primary"
              type="submit"
            >
              {assigning ? "Asignando..." : "Asignar invitado"}
            </IconButton>

            <IconButton
              disabled={assigning}
              icon={<X size={16} strokeWidth={1.8} />}
              label="Cancelar"
              onClick={onCancel}
              showText="always"
              tone="terciary"
              type="button"
            >
              Cancelar
            </IconButton>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
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
        <p className="section-eyebrow mb-3">Cambios sin guardar</p>
        <h2
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
          id="unsaved-table-changes-title"
        >
          Se perderan los cambios
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          Tienes cambios pendientes en mesas. Si sales ahora, no se enviaran a
          Apps Script.
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
            label="Seguir editando"
            onClick={onCancel}
            showText="always"
            tone="secondary"
            type="button"
          >
            Seguir editando
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<Undo2 size={16} strokeWidth={1.8} />}
            label="Deshacer cambios"
            onClick={onDiscard}
            showText="always"
            tone="secondary"
            type="button"
          >
            Deshacer cambios
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label="Salir sin guardar"
            onClick={onConfirm}
            showText="always"
            tone="danger"
            type="button"
          >
            Salir sin guardar
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
        Vision de mesas
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

function TablesPageActions({
  hasPendingChanges,
  loading,
  onDiscardChanges,
  onRefresh,
}) {
  return (
    <section className="premium-card mt-5">
      <p className="section-eyebrow mb-4">Acciones</p>
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <IconButton
            className="w-full"
            disabled={!hasPendingChanges || loading}
            icon={<Undo2 size={16} strokeWidth={1.8} />}
            label="Deshacer cambios"
            onClick={onDiscardChanges}
            showText="always"
            tone="secondary"
            type="button"
          >
            Deshacer cambios
          </IconButton>
          <IconButton
            className="w-full"
            disabled={loading}
            icon={
              <RefreshCw
                className={loading ? "animate-spin" : ""}
                size={16}
                strokeWidth={1.8}
              />
            }
            label="Actualizar"
            onClick={onRefresh}
            showText="always"
            type="button"
          >
            Actualizar
          </IconButton>

          <IconButton
            className="flex-1"
            icon={<Home size={16} strokeWidth={1.8} />}
            showText="always"
            to="/admin"
            tone="terciary"
          >
            Administracion
          </IconButton>
        </div>
      </div>
    </section>
  );
}

function getTableSummaryItems(stats) {
  return [
    {
      label: "Numero de mesas",
      value: stats.totalTables,
      detail: "Mesas",
      emoji: <Grid2X2 size={22} strokeWidth={1.8} />,
    },
    {
      label: "Total asientos",
      value: stats.totalSeats,
      detail: "Asientos",
      emoji: <Armchair size={22} strokeWidth={1.8} />,
    },
    {
      label: "Asientos asignados",
      value: stats.assignedSeats,
      detail: "Asignados",
      emoji: <CircleCheckBig size={22} strokeWidth={1.8} />,
    },
    {
      label: "Asientos pendientes",
      value: stats.pendingSeats,
      detail: "Pendientes",
      emoji: <CircleDashed size={22} strokeWidth={1.8} />,
    },
  ];
}

function TablesGrid({ onDelete, onEdit, onSeatClick, onUnassignSeat, tables }) {
  if (!tables.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
        <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
          Sin mesas asignadas
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          Asigna mesa y asiento desde la edicion de invitados para ver aqui la
          distribucion.
        </p>
      </div>
    );
  }

  return (
    <div className="hidden gap-4 md:grid lg:grid-cols-2">
      {tables.map((table, index) => (
        <TableCardWithActions
          index={index}
          key={getTableRenderKey(table)}
          onDelete={onDelete}
          onEdit={onEdit}
          onSeatClick={onSeatClick}
          onUnassignSeat={onUnassignSeat}
          table={table}
        />
      ))}
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
      <TableCardActions onDelete={onDelete} onEdit={onEdit} table={table} />
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

function TableCardActions({ onDelete, onEdit, table }) {
  if (!onEdit && !onDelete) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {onDelete && (
        <IconButton
          className="w-full"
          icon={<Trash2 size={16} strokeWidth={1.8} />}
          label="Eliminar mesa"
          onClick={() => onDelete(table)}
          tone="danger"
          type="button"
        >
          Eliminar mesa
        </IconButton>
      )}
      {onEdit && (
        <IconButton
          className="w-full"
          icon={<Pencil size={16} strokeWidth={1.8} />}
          label="Editar mesa"
          onClick={() => onEdit(table)}
          tone="primary"
          type="button"
        >
          Editar mesa
        </IconButton>
      )}
    </div>
  );
}

function MobileTablesList({
  direction,
  onDelete,
  onEdit,
  onSeatClick,
  onUnassignSeat,
  page,
  tables,
  allTables,
}) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef(null);
  const measureRefs = useRef([]);
  const [cardMinHeight, setCardMinHeight] = useState(null);

  useLayoutEffect(() => {
    if (!allTables?.length) return undefined;

    const updateCardHeight = () => {
      const maxHeight = allTables.reduce((max, _, index) => {
        const node = measureRefs.current[index];
        if (!node) return max;

        return Math.max(max, Math.ceil(node.getBoundingClientRect().height));
      }, 0);

      setCardMinHeight((currentHeight) => {
        if (!maxHeight) return currentHeight;
        return Math.abs((currentHeight || 0) - maxHeight) < 1
          ? currentHeight
          : maxHeight;
      });
    };

    updateCardHeight();
    window.addEventListener("resize", updateCardHeight);

    return () => window.removeEventListener("resize", updateCardHeight);
  }, [allTables]);

  const variants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (pageDirection) => ({
          opacity: 0,
          x: pageDirection > 0 ? 72 : -72,
          filter: "blur(6px)",
        }),
        center: {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
        },
        exit: (pageDirection) => ({
          opacity: 0,
          x: pageDirection > 0 ? -72 : 72,
          filter: "blur(6px)",
        }),
      };

  return (
    <div
      className="relative overflow-hidden md:hidden bg-transparent"
      style={
        cardMinHeight
          ? {
              minHeight: `${cardMinHeight}px`,
              height: `${cardMinHeight}px`,
            }
          : {
              undefined,
            }
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[-1] h-auto w-full opacity-0 bg-transparent"
        style={{ width: "100%" }}
      >
        {allTables?.map((table, index) => (
          <div
            key={`measure-${getTableRenderKey(table)}`}
            ref={(node) => {
              measureRefs.current[index] = node;
            }}
          >
            <TableCardWithActions
              onDelete={() => {}}
              onEdit={() => {}}
              onSeatClick={() => {}}
              onUnassignSeat={() => {}}
              reveal={false}
              table={table}
            />
          </div>
        ))}
      </div>

      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          animate="center"
          className="absolute inset-x-0 top-0 grid gap-4"
          custom={direction}
          exit="exit"
          initial="enter"
          key={`tables-page-${page}-${tables.map(getTableRenderKey).join("|")}`}
          ref={cardRef}
          transition={{
            duration: reduceMotion ? 0.18 : 0.48,
            ease: [0.22, 1, 0.36, 1],
          }}
          variants={variants}
        >
          {tables.map((table) => (
            <TableCardWithActions
              key={getTableRenderKey(table)}
              onDelete={onDelete}
              onEdit={onEdit}
              onSeatClick={onSeatClick}
              onUnassignSeat={onUnassignSeat}
              reveal={false}
              table={table}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function getTableRenderKey(table) {
  const seatSignature = table.seats
    .map((seat) => {
      const guestName = seat.guest ? Guest.getFullName(seat.guest) : "";

      return `${seat.seat}:${guestName}`;
    })
    .join(",");

  return `${table.name}-${seatSignature}`;
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
      changes.push(`Mesa creada: ${table.name}`);
      return;
    }

    if (getStableJson(savedTable) !== getStableJson(table)) {
      changes.push(`Mesa modificada: ${table.name}`);
    }
  });

  savedByKey.forEach((table, tableKey) => {
    if (tableKey && !currentByKey.has(tableKey)) {
      changes.push(`Mesa eliminada: ${table.name}`);
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
        `${Guest.getFullName(guest, `Invitado ${index + 1}`)}: ${previousAssignment} -> ${currentAssignment}`,
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

  if (!table && !seat) return "Sin asiento";

  return `Mesa ${table || "-"}, asiento ${seat || "-"}`;
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

function Pagination({ isMobileList, onNext, onPrev, page, totalPages }) {
  return (
    <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center">
        {isMobileList ? "Mesas" : "Pagina"} {page} de {totalPages}
      </p>

      <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex">
        <IconButton
          className="w-full sm:w-auto"
          disabled={page === 1}
          icon={<ChevronLeft size={16} strokeWidth={1.8} />}
          label="Anterior"
          onClick={onPrev}
          showText
          tone="secondary"
          type="button"
        >
          Anterior
        </IconButton>
        <IconButton
          className="w-full sm:w-auto"
          disabled={page === totalPages}
          icon={<ChevronRight size={16} strokeWidth={1.8} />}
          label="Siguiente"
          onClick={onNext}
          showText
          tone="secondary"
          type="button"
        >
          Siguiente
        </IconButton>
      </div>
    </div>
  );
}

function TablesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="min-h-40 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-5"
          key={index}
        >
          <div className="h-5 w-32 rounded-full bg-[var(--color-border)]" />
          <div className="mt-5 space-y-3">
            <div className="h-10 rounded-2xl bg-[var(--color-border)]" />
            <div className="h-10 rounded-2xl bg-[var(--color-border)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
