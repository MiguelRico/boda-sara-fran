import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
} from "../components/admin/AdminMetricGrid";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import { Confirmation, Guest, Table } from "../models";
import { findAllGroups } from "../services/rsvpService";
import { normalizeAdminGroups } from "../utils/rsvpGroups";

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};
const TABLE_METRIC_GRID_CLASS =
  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";

export default function AdminTables() {
  const tablesRef = useRef(null);
  const tablesInView = useInView(tablesRef, {
    once: true,
    amount: 0.2,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);

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

  const tables = useMemo(() => {
    const guests = Confirmation.getGuestsWithConfirmation(state.groups);

    return Table.fromGuests(guests);
  }, [state.groups]);
  const tableStats = useMemo(() => Table.buildStats(tables), [tables]);

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
    </CinematicPage>
  );
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
          showText
        >
          Actualizar
        </IconButton>
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
            <h3 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
              Mesa {table.name || table.id}
            </h3>
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
