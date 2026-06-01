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
import { Navigate } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  X,
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
import { inputClassName, Label } from "../components/rsvp/FormPrimitives";
import { Guest } from "../models";
import {
  assignGuestToSeat,
  assignPendingGuestToSeat,
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
  saveStoredTables,
  unassignGuestFromSeat,
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
const pageScrollDuration = 680;
const pageScrollOffset = 12;
const mobilePageHeightLockDelay = 560;
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
  submitText: "Guardar mesa",
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
  const pageLoadingTimeoutRef = useRef(null);
  const pageRevealTimeoutRef = useRef(null);
  const pageScrollStartFrameRef = useRef(null);
  const pageScrollCancelRef = useRef(null);
  const tablesInView = useInView(tablesRef, {
    once: true,
    amount: 0.1,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);
  const [manualTables, setManualTables] = useState(readStoredTables);
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
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      loadTables({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadTables]);

  useEffect(() => {
    saveStoredTables(manualTables);
  }, [manualTables]);

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

  const guestsPending = useMemo(
    () => getPendingGuests(state.groups),
    [state.groups],
  );
  const assignableGuests = useMemo(
    () => getAssignableGuests(state.groups),
    [state.groups],
  );

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

    try {
      spinner.show("Eliminando mesa...");

      const persistencePromises = [
        persistAdminTables({
          password: ADMIN_PASSWORD,
          tables: nextManualTables,
        }),
      ];

      const changedGroups = updatedGroups.filter(
        (group, index) => group !== state.groups[index],
      );

      if (changedGroups.length) {
        persistencePromises.push(
          ...changedGroups.map((group) =>
            saveAdminGroup({
              group,
              password: ADMIN_PASSWORD,
            }),
          ),
        );
      }

      await Promise.all(persistencePromises);

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
    } catch (error) {
      console.error("Error al eliminar mesa:", error);
      setState((prev) => ({
        ...prev,
        error:
          error.message || "No se pudo eliminar la mesa. Intenta de nuevo.",
      }));
    } finally {
      spinner.hide();
      setTableToDelete(null);
    }
  };

  const handleSeatClick = ({ seat, table }) => {
    setSeatAssignmentTarget({ seat, table });
  };

  const handleCloseSeatAssignment = () => {
    if (assigningSeat) return;

    setSeatAssignmentTarget(null);
  };

  const handleRefreshTables = useCallback(async () => {
    try {
      spinner.show("Actualizando mesas...");
      await loadTables({ showLoading: false });
    } finally {
      spinner.hide();
    }
  }, [loadTables, spinner]);

  const handleAssignGuestToTable = useCallback(
    async ({ guestId, guestEmail, guestIndex, tableId, seatNumber }) => {
      try {
        spinner.show("Asignando invitado...");
        const updatedGroups = await assignPendingGuestToSeat({
          groups: state.groups,
          guestEmail,
          guestId,
          guestIndex,
          password: ADMIN_PASSWORD,
          seatNumber,
          tableId,
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
      } finally {
        spinner.hide();
      }
    },
    [spinner, state.groups, tables],
  );

  const handleAssignGuestToSeat = async ({
    guestEmail,
    guestIndex,
    guestName,
  }) => {
    if (!seatAssignmentTarget || !guestEmail) return;

    setAssigningSeat(true);
    setState((prev) => ({ ...prev, error: "" }));

    try {
      spinner.show("Guardando asiento...");
      const updatedGroups = await assignGuestToSeat({
        groups: state.groups,
        guestEmail,
        guestIndex,
        guestName,
        password: ADMIN_PASSWORD,
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
      spinner.hide();
    }
  };

  const handleRemoveGuestFromSeat = async () => {
    if (!seatAssignmentTarget) return;

    setAssigningSeat(true);
    setState((prev) => ({ ...prev, error: "" }));

    try {
      spinner.show("Liberando asiento...");
      const updatedGroups = await unassignGuestFromSeat({
        groups: state.groups,
        password: ADMIN_PASSWORD,
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
      console.error("Error al liberar asiento:", error);
      setState((prev) => ({
        ...prev,
        error:
          error.message || "No se pudo liberar el asiento. Intenta de nuevo.",
      }));
    } finally {
      setAssigningSeat(false);
      spinner.hide();
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

    try {
      spinner.show(editingTable ? "Guardando mesa..." : "Creando mesa...");
      await persistAdminTables({
        password: ADMIN_PASSWORD,
        tables: nextManualTables,
      });
      setManualTables(nextManualTables);

      if (!editingTable) {
        setPage(Math.max(Math.ceil((tables.length + 1) / pageSize), 1));
      }

      handleCloseTableForm();
    } catch (error) {
      console.error("Error al guardar mesas:", error);
      setState((prev) => ({
        ...prev,
        error:
          error.message ||
          "No se pudieron guardar las mesas. Intenta de nuevo.",
      }));
    } finally {
      spinner.hide();
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

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
            <TablesOverview
              loading={state.loading}
              onRefresh={handleRefreshTables}
              stats={tableStats}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={tablesInView}>
            <section className="premium-card" ref={tablesCardRef}>
              <div className="mb-5">
                <div>
                  <p className="section-eyebrow mb-2">Distribución</p>
                  <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                    Asientos asignados
                  </h2>

                  {activeTab === "tables" && (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                        {pagedTableCount}{" "}
                        {pagedTableCount === 1 ? "mesa" : "mesas"} en esta
                        pagina - {pagedSeatCount}{" "}
                        {pagedSeatCount === 1 ? "asiento" : "asientos"}
                      </p>

                      <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex sm:justify-end">
                        <IconButton
                          className="!w-full sm:!w-10 [var(--color-accent)]"
                          disabled={!tables.length}
                          label="Exportar"
                          onClick={() => downloadTablesCsv(tables)}
                        >
                          <Download size={16} strokeWidth={1.8} />
                        </IconButton>

                        <IconButton
                          className="!w-full border-[var(--color-accent-dark)] bg-[var(--color-accent-dark)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] sm:!w-10"
                          label="Crear mesa"
                          onClick={handleCreateTable}
                        >
                          <Plus size={18} strokeWidth={2.4} />
                        </IconButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <TabNavigation
                tabs={SECTION_TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="mb-6"
              />

              {activeTab === "tables" ? (
                <div
                  ref={tablesStartRef}
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
                            tables={pagedTables}
                          />
                          <MobileTablesList
                            direction={pageDirection}
                            onDelete={handleRequestDeleteTable}
                            onEdit={handleEditTable}
                            onSeatClick={handleSeatClick}
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
                </div>
              ) : (
                <PendingGuestsList
                  guests={guestsPending}
                  tables={tables}
                  onAssignTable={handleAssignGuestToTable}
                />
              )}
            </section>
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
            tableToDelete.name || tableToDelete.id
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Mesa</p>
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

  const tableKey = table.id || table.name;
  const tableLabel = table.name || table.id;
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
        email: currentGuest.email,
        guestIndex: currentGuest.guestIndex,
        name: currentGuestName,
      })
    : "";
  const canRemoveGuest = Boolean(currentGuest);
  const [selectedGuest, setSelectedGuest] = useState(currentGuestValue);

  const handleSubmit = (event) => {
    event.preventDefault();

    const [guestEmail, guestIndex, guestName] = selectedGuest.split("|||");

    onAssign({ guestEmail, guestIndex, guestName });
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
            className={`${inputClassName} bg-white`}
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
                  key={`${guest.email}-${guestName}-${index}`}
                  value={createGuestOptionValue({
                    email: guest.email,
                    guestIndex: guest.guestIndex,
                    name: guestName,
                  })}
                >
                  {guestName} - {guest.groupName || guest.email}
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
              disabled={assigning}
              icon={<X size={16} strokeWidth={1.8} />}
              label="Cancelar"
              onClick={onCancel}
              showText="always"
              tone="secondary"
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

function TablesOverview({ loading, onRefresh, stats }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
            Vision de mesas
          </h2>
        </div>

        <div className="grid gap-3 sm:flex sm:items-center">
          <IconButton
            className="w-full sm:w-auto"
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
          >
            Actualizar
          </IconButton>
        </div>
      </div>

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
      label: "Numero de mesas",
      value: stats.totalTables,
      detail: "Mesas",
      emoji: "#",
    },
    {
      label: "Total asientos",
      value: stats.totalSeats,
      detail: "Asientos",
      emoji: "+",
    },
    {
      label: "Asientos asignados",
      value: stats.assignedSeats,
      detail: "Asignados",
      emoji: "OK",
    },
    {
      label: "Asientos pendientes",
      value: stats.pendingSeats,
      detail: "Pendientes",
      emoji: "...",
    },
  ];
}

function TablesGrid({ onDelete, onEdit, onSeatClick, tables }) {
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
        <TableAnimatedInfoCard
          index={index}
          key={getTableRenderKey(table)}
          onDelete={onDelete}
          onEdit={onEdit}
          onSeatClick={onSeatClick}
          table={table}
        />
      ))}
    </div>
  );
}
function MobileTablesList({
  direction,
  onDelete,
  onEdit,
  onSeatClick,
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

  measureRefs.current = [];

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
            <TableAnimatedInfoCard
              onDelete={() => {}}
              onEdit={() => {}}
              onSeatClick={() => {}}
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
            <TableAnimatedInfoCard
              key={getTableRenderKey(table)}
              onDelete={onDelete}
              onEdit={onEdit}
              onSeatClick={onSeatClick}
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

  return `${table.id || table.name}-${seatSignature}`;
}

function createGuestOptionValue({ email, guestIndex = "", name }) {
  return `${email || ""}|||${guestIndex}|||${name || ""}`;
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

function scrollToY(targetY, { duration }) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const startY = window.scrollY;
  const nextY = Math.max(0, targetY);
  const distance = nextY - startY;

  if (distance >= -4) return null;

  if (reduceMotion) {
    window.scrollTo(0, nextY);
    return null;
  }

  const startTime = window.performance.now();
  let frameId = null;
  let canceled = false;

  const step = (currentTime) => {
    if (canceled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    window.scrollTo(0, startY + distance * easedProgress);

    if (progress < 1) {
      frameId = window.requestAnimationFrame(step);
    }
  };

  frameId = window.requestAnimationFrame(step);

  return () => {
    canceled = true;

    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
  };
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
