import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate } from "react-router-dom";
import { Plus, RefreshCw, X } from "lucide-react";

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
import TableForm from "../components/admin/TableForm";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import { Confirmation, Guest, Table } from "../models";
import { findAllGroups } from "../services/rsvpService";
import { normalizeAdminGroups } from "../utils/rsvpGroups";
import useViewportScrollLock from "../hooks/useViewportScrollLock";

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};
const TABLE_METRIC_GRID_CLASS =
  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";
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
  const [showTableForm, setShowTableForm] = useState(false);

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

  const tables = useMemo(() => {
    const guests = Confirmation.getGuestsWithConfirmation(state.groups);
    const assignedTables = Table.fromGuests(guests);

    return Table.mergeLists(manualTables, assignedTables);
  }, [manualTables, state.groups]);
  const tableStats = useMemo(() => Table.buildStats(tables), [tables]);
  const handleTableFormChange = (field, value) => {
    setTableForm((current) => ({ ...current, [field]: value }));
    setTableFormErrors((current) => ({ ...current, [field]: "" }));
  };
  const handleCloseTableForm = () => {
    setShowTableForm(false);
    setTableForm(createEmptyTableForm());
    setTableFormErrors({});
  };
  const handleTableSubmit = (event) => {
    event.preventDefault();

    const errors = validateTableForm(tableForm, tables);

    if (Object.keys(errors).length) {
      setTableFormErrors(errors);
      return;
    }

    setManualTables((current) => [
      ...current,
      Table.create({
        ...tableForm,
        id: tableForm.name,
        seatCount: tableForm.seatCount,
      }),
    ]);
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
            <section className="premium-card">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="section-eyebrow mb-2">Distribución</p>
                  <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                    Asientos asignados
                  </h2>
                </div>

                <IconButton
                  className="w-full sm:w-auto"
                  icon={<Plus size={16} strokeWidth={1.8} />}
                  label="Crear mesa"
                  onClick={() => setShowTableForm(true)}
                  showText="always"
                  tone="primary"
                >
                  Crear mesa
                </IconButton>
              </div>

              {state.loading ? (
                <TablesSkeleton />
              ) : (
                <TablesGrid tables={tables} />
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
          errors={tableFormErrors}
          form={tableForm}
          onCancel={handleCloseTableForm}
          onChange={handleTableFormChange}
          onSubmit={handleTableSubmit}
        />
      )}
    </CinematicPage>
  );
}

function TableEditor({ errors, form, onCancel, onChange, onSubmit }) {
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
              Crear mesa
            </h2>
          </div>

          <IconButton label="Cerrar" onClick={onCancel}>
            <X size={17} strokeWidth={1.8} />
          </IconButton>
        </div>

        <TableForm
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

function TablesGrid({ tables }) {
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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
            {[getTableGroupOption(table.group)?.label, Table.getShapeLabel(table)]
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

function validateTableForm(form, tables) {
  const errors = {};
  const tableName = form.name.trim();
  const repeatedTable = tables.some(
    (table) =>
      (table.id || table.name).trim().toLowerCase() === tableName.toLowerCase(),
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
