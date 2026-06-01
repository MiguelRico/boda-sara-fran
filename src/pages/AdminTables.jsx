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
  X,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import {
  ADMIN_TABLES_STORAGE_KEY,
  createEmptyTableForm,
  getTableGroupOption,
  TABLE_GROUP_OPTIONS,
} from "../constants/tables";
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
import TabNavigation from "../components/ui/TabNavigation";
import PendingGuestsList from "../components/admin/PendingGuestsList";
import { inputClassName, Label } from "../components/rsvp/FormPrimitives";
import { Confirmation, Guest, Table } from "../models";
import { findAllGroups, saveAdminGroup } from "../services/rsvpService";
import { normalizeAdminGroups } from "../utils/rsvpGroups";
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
  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";
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
      placeholder: "Ej: Cerca de la pista, mesa infantil, indicaciones del catering...",
    },
  },
};
const readStoredTables = () => {
  try {
    return Table.normalizeList(
      JSON.parse(window.localStorage.getItem(ADMIN_TABLES_STORAGE_KEY) || "[]"),
    );
  } catch {
    return [];
  }
};

export default function AdminTables() {
  const tablesRef = useRef(null);
  const tablesCardRef = useRef(null);
  const tablesStartRef = useRef(null);
  const pageLoadingTimeoutRef = useRef(null);
  const pageRevealTimeoutRef = useRef(null);
  const pageScrollStartFrameRef = useRef(null);
  const pageScrollCancelRef = useRef(null);
  const tablesInView = useInView(tablesRef, {
    once: true,
    amount: 0.2,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);
  const [manualTables, setManualTables] = useState(readStoredTables);
  const [tableForm, setTableForm] = useState(createEmptyTableForm);
  const [tableFormErrors, setTableFormErrors] = useState({});
  const [editingTable, setEditingTable] = useState(null);
  const [showTableForm, setShowTableForm] = useState(false);
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

  const loadTables = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await findAllGroups({ password: ADMIN_PASSWORD });

      setState({
        groups: normalizeAdminGroups(response),
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
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      loadTables({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadTables]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ADMIN_TABLES_STORAGE_KEY,
        JSON.stringify(manualTables),
      );
    } catch {
      // Storage can be unavailable in private or locked browser contexts.
    }
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
    const guests = Confirmation.getGuestsWithConfirmation(state.groups);
    const assignedTables = Table.fromGuests(guests);

    return Table.mergeLists(manualTables, assignedTables);
  }, [manualTables, state.groups]);
  const tableStats = useMemo(() => Table.buildStats(tables), [tables]);
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

  const guestsPending = useMemo(() => {
    const guests = Confirmation.getGuestsWithConfirmation(state.groups);
    return guests.filter((g) => !g.table || !g.seat);
  }, [state.groups]);
  const assignableGuests = useMemo(
    () => Confirmation.getGuestsWithConfirmation(state.groups),
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

    const cardElement = tablesCardRef.current;
    const cardRect = cardElement?.getBoundingClientRect();
    const tableElement = tablesStartRef.current;
    const tableRect = tableElement?.getBoundingClientRect();
    const cardTop = cardRect
      ? Math.max(0, cardRect.top + window.scrollY - pageScrollOffset)
      : window.scrollY;
    const tableHeight = tableRect?.height || null;
    const direction = clampedPage > currentPage ? 1 : -1;

    cancelPageLoading();

    if (isMobileList) {
      setPageLoadingMinHeight(tableHeight);
      setPageDirection(direction);
      setPage(clampedPage);
      pageScrollStartFrameRef.current = window.requestAnimationFrame(() => {
        pageScrollStartFrameRef.current = null;
        pageScrollCancelRef.current = scrollToY(cardTop, {
          duration: pageScrollDuration,
        });
      });
      pageRevealTimeoutRef.current = window.setTimeout(() => {
        setPageLoadingMinHeight(null);
        pageRevealTimeoutRef.current = null;
      }, mobilePageHeightLockDelay);

      return;
    }

    setPageDirection(direction);
    setPageLoadingMinHeight(tableHeight);
    setPageLoading(true);
    pageScrollStartFrameRef.current = window.requestAnimationFrame(() => {
      pageScrollStartFrameRef.current = window.requestAnimationFrame(() => {
        pageScrollStartFrameRef.current = null;
        pageScrollCancelRef.current = scrollToY(cardTop, {
          duration: pageScrollDuration,
        });

        pageLoadingTimeoutRef.current = window.setTimeout(() => {
          setPage(clampedPage);
          pageLoadingTimeoutRef.current = null;
          pageScrollCancelRef.current = null;

          pageRevealTimeoutRef.current = window.setTimeout(() => {
            setPageLoading(false);
            setPageLoadingMinHeight(null);
            pageRevealTimeoutRef.current = null;
          }, pageRevealDelay);
        }, pageDataSwapDelay);
      });
    });
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

  const handleSeatClick = ({ seat, table }) => {
    setSeatAssignmentTarget({ seat, table });
  };

  const handleCloseSeatAssignment = () => {
    if (assigningSeat) return;

    setSeatAssignmentTarget(null);
  };

  const handleAssignGuestToTable = useCallback(
    async ({ guestId, guestEmail, tableId, seatNumber }) => {
      try {
        // Encontrar el grupo que contiene al guest
        const confirmation = state.groups.find((g) => g.email === guestEmail);
        if (!confirmation) {
          throw new Error("Grupo de invitación no encontrado");
        }

        // Buscar el guest en el grupo
        const guestIndex = confirmation.guests.findIndex(
          (g) => Guest.getFullName(g) === guestId,
        );
        if (guestIndex === -1) {
          throw new Error("Invitado no encontrado en el grupo");
        }

        // Validar que la mesa existe y tiene asiento disponible
        const table = tables.find((t) => (t.id || t.name) === tableId);
        if (!table) {
          throw new Error("Mesa no encontrada");
        }

        const emptySeat = Table.getEmptySeats(table).find(
          (s) => s.seat === seatNumber,
        );
        if (!emptySeat) {
          throw new Error("El asiento no está disponible");
        }

        // Actualizar el guest
        const updatedGuest = {
          ...confirmation.guests[guestIndex],
          table: tableId,
          seat: seatNumber,
        };
        confirmation.guests[guestIndex] = updatedGuest;

        // Guardar el grupo actualizado
        await saveAdminGroup({
          group: confirmation,
          password: ADMIN_PASSWORD,
        });

        // Recargar tablas
        await loadTables({ showLoading: false });
      } catch (error) {
        console.error("Error al asignar mesa:", error);
        setState((prev) => ({
          ...prev,
          error:
            error.message || "No se pudo asignar la mesa. Intenta de nuevo.",
        }));
      }
    },
    [state.groups, tables, loadTables],
  );

  const handleAssignGuestToSeat = async ({ guestEmail, guestName }) => {
    if (!seatAssignmentTarget || !guestEmail || !guestName) return;

    const tableId = getTableKey(seatAssignmentTarget.table);
    const seatNumber = seatAssignmentTarget.seat.seat;

    setAssigningSeat(true);
    setState((prev) => ({ ...prev, error: "" }));

    try {
      const updatedGroups = state.groups.map((group) => {
        let changed = false;
        const guests = group.guests.map((guest) => {
          const isSelectedGuest =
            group.email === guestEmail && Guest.getFullName(guest) === guestName;
          const isCurrentSeatGuest =
            guest.table === tableId && guest.seat === seatNumber;

          if (!isSelectedGuest && !isCurrentSeatGuest) return guest;

          changed = true;

          if (isSelectedGuest) {
            return {
              ...guest,
              table: tableId,
              seat: seatNumber,
            };
          }

          return {
            ...guest,
            table: "",
            seat: "",
          };
        });

        return changed ? { ...group, guests } : group;
      });
      const changedGroups = updatedGroups.filter(
        (group, index) => group !== state.groups[index],
      );

      await Promise.all(
        changedGroups.map((group) =>
          saveAdminGroup({
            group,
            password: ADMIN_PASSWORD,
          }),
        ),
      );

      setSeatAssignmentTarget(null);
      await loadTables({ showLoading: false });
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

  const handleTableSubmit = (event) => {
    event.preventDefault();

    const errors = validateTableForm(tableForm, tables, editingTable);

    if (Object.keys(errors).length) {
      setTableFormErrors(errors);
      return;
    }

    const nextTable = Table.create({
      ...tableForm,
      id: editingTable ? getTableKey(editingTable) : tableForm.name,
      seatCount: tableForm.seatCount,
    });

    if (editingTable) {
      const editingTableKey = getTableKey(editingTable);

      setManualTables((current) => [
        ...current.filter((table) => getTableKey(table) !== editingTableKey),
        nextTable,
      ]);
    } else {
      setManualTables((current) => [...current, nextTable]);
      setPage(Math.max(Math.ceil((tables.length + 1) / pageSize), 1));
    }

    handleCloseTableForm();
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
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
              onRefresh={loadTables}
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
                            onEdit={handleEditTable}
                            onSeatClick={handleSeatClick}
                            tables={pagedTables}
                          />
                          <MobileTablesList
                            direction={pageDirection}
                            onEdit={handleEditTable}
                            onSeatClick={handleSeatClick}
                            page={currentPage}
                            tables={pagedTables}
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
          onSubmit={handleTableSubmit}
        />
      )}

      {seatAssignmentTarget && (
        <SeatAssignmentDialog
          assigning={assigningSeat}
          guests={assignableGuests}
          onAssign={handleAssignGuestToSeat}
          onCancel={handleCloseSeatAssignment}
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
  seat,
  table,
}) {
  useViewportScrollLock(true);

  const currentGuestName = seat.guest
    ? Guest.getFullName(seat.guest, "Invitado")
    : "";
  const currentGuestValue = seat.guest
    ? createGuestOptionValue({
        email: seat.guest.email,
        name: currentGuestName,
      })
    : "";
  const [selectedGuest, setSelectedGuest] = useState(currentGuestValue);
  const tableLabel = table.name || table.id;

  const handleSubmit = (event) => {
    event.preventDefault();

    const [guestEmail, guestName] = selectedGuest.split("|||");

    onAssign({ guestEmail, guestName });
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
                    name: guestName,
                  })}
                >
                  {guestName} - {guest.groupName || guest.email}
                  {assignmentText ? ` (${assignmentText})` : ""}
                </option>
              );
            })}
          </select>

          <div className="mt-6 flex flex-col gap-4 sm:grid sm:grid-cols-2">
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

function TablesGrid({ onEdit, onSeatClick, tables }) {
  if (!tables.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
        <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
          Sin mesas asignadas
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          Asigna mesa y asiento desde la edición de invitados para ver aquí la
          distribución.
        </p>
      </div>
    );
  }

  if (tables.length) {
    return (
      <div className="hidden gap-4 md:grid lg:grid-cols-2">
        {tables.map((table, index) => (
          <TableAnimatedInfoCard
          index={index}
          key={table.id || table.name}
          onEdit={onEdit}
          onSeatClick={onSeatClick}
          table={table}
        />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden gap-4 md:grid lg:grid-cols-2">
      {tables.map((table) => (
        <article
          className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5"
          key={table.id || table.name}
        >
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
                Mesa {table.name || table.id}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {[
                  getTableGroupOption(table.group)?.label,
                  Table.getShapeLabel(table),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {table.notes && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {table.notes}
                </p>
              )}
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              {Table.getAssignedGuests(table).length} invitados
            </p>
          </div>

          <div className="grid gap-3">
            {table.seats.map((seat) => (
              <SeatRow key={seat.seat} seat={seat} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function MobileTablesList({ direction, onEdit, onSeatClick, page, tables }) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef(null);
  const [cardMinHeight, setCardMinHeight] = useState(null);

  useLayoutEffect(() => {
    const node = cardRef.current;

    if (!node) return undefined;

    const updateCardHeight = () => {
      setCardMinHeight((currentHeight) => {
        const nextHeight = Math.ceil(node.getBoundingClientRect().height);
        const stableHeight = Math.max(currentHeight || 0, nextHeight);

        return Math.abs((currentHeight || 0) - stableHeight) < 1
          ? currentHeight
          : stableHeight;
      });
    };

    updateCardHeight();

    if (!window.ResizeObserver) {
      window.addEventListener("resize", updateCardHeight);

      return () => window.removeEventListener("resize", updateCardHeight);
    }

    const resizeObserver = new ResizeObserver(updateCardHeight);

    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [page, tables]);

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
      className="relative overflow-hidden md:hidden"
      style={cardMinHeight ? { height: `${cardMinHeight}px` } : undefined}
    >
      <AnimatePresence custom={direction} initial={false}>
        {tables.map((table) => (
          <motion.div
            animate="center"
            className="absolute inset-x-0 top-0"
            custom={direction}
            exit="exit"
            initial="enter"
            key={`${table.id || table.name}-${page}`}
            ref={cardRef}
            transition={{
              duration: reduceMotion ? 0.18 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            variants={variants}
          >
            <TableAnimatedInfoCard
              onEdit={onEdit}
              onSeatClick={onSeatClick}
              reveal={false}
              table={table}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function createTableFormFromTable(table) {
  const normalizedTable = Table.normalize(table);

  return {
    group: normalizedTable.group,
    name: normalizedTable.name || normalizedTable.id,
    notes: normalizedTable.notes,
    seatCount: normalizedTable.seats.length,
    shape: normalizedTable.shape,
  };
}

function getTableKey(table) {
  return (table.id || table.name || "").trim();
}

function createGuestOptionValue({ email, name }) {
  return `${email || ""}|||${name || ""}`;
}

function validateTableForm(form, tables, editingTable = null) {
  const errors = {};
  const tableName = form.name.trim();
  const editingTableKey = editingTable ? getTableKey(editingTable) : "";
  const repeatedTable = tables.some(
    (table) =>
      getTableKey(table).toLowerCase() !== editingTableKey.toLowerCase() &&
      getTableKey(table).toLowerCase() === tableName.toLowerCase(),
  );

  if (!tableName) {
    errors.name = "Introduce el nombre de la mesa.";
  } else if (repeatedTable) {
    errors.name = "Ya existe una mesa con este nombre.";
  }

  if (!form.shape) {
    errors.shape = "Selecciona la forma de la mesa.";
  }

  if (!TABLE_GROUP_OPTIONS.some((option) => option.value === form.group)) {
    errors.group = "Selecciona un grupo de mesa.";
  }

  if (!Table.isSeatCountAllowed(form.shape, form.seatCount)) {
    const range = Table.getSeatRange(form.shape);

    errors.seatCount = `Selecciona entre ${range.min} y ${range.max} asientos.`;
  }

  return errors;
}

function SeatRow({ seat }) {
  const guestName = seat.guest ? Guest.getFullName(seat.guest, "Invitado") : "";

  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white/50 p-3 text-sm">
      <span className="font-medium text-[var(--color-accent-dark)]">
        Asiento {seat.seat}
      </span>
      <span className="min-w-0 truncate text-[var(--color-muted)]">
        {guestName || "Sin asignar"}
      </span>
      {seat.guest?.menu && (
        <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-accent-dark)]">
          {seat.guest.menu}
        </span>
      )}
    </div>
  );
}

function Pagination({ isMobileList, onNext, onPrev, page, totalPages }) {
  return (
    <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center">
        {isMobileList ? "Mesa" : "Pagina"} {page} de {totalPages}
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

function downloadTablesCsv(tables) {
  const headers = [
    "mesa",
    "grupo",
    "forma",
    "notas",
    "asiento",
    "invitado",
    "menu",
  ];
  const lines = tables.flatMap((table) =>
    table.seats.map((seat) =>
      [
        table.name || table.id,
        getTableGroupOption(table.group)?.label || "",
        Table.getShapeLabel(table),
        table.notes,
        seat.seat,
        seat.guest ? Guest.getFullName(seat.guest, "Invitado") : "",
        seat.guest?.menu || "",
      ]
        .map(escapeCsvValue)
        .join(","),
    ),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "mesas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
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
