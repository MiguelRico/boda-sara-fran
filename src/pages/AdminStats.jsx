import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { isAdminSessionAuthenticated } from "../utils/adminSession";
import {
  GuestOverviewMetricGrid,
  GuestOverviewMetricGridSkeleton,
} from "../components/admin/guests";
import { SkeletonBlock } from "../components/ui/TableSectionSkeleton";
import { TableTotalsPanel } from "../components/admin/tables";
import { VerticalBarChart } from "../components/admin/common";
import { ProviderTotalsPanel } from "../components/admin/providers";
import { NotificationTotalsPanel } from "../components/admin/notifications";
import { TaskTotalsPanel } from "../components/admin/tasks";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import StatusDialog from "../components/ui/StatusDialog";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import { adminContent } from "../constants/adminContent";
import { COMMON_ALLERGIES } from "../constants/rsvp";
import { isMenuModuleEnabled } from "../config/features";
import { Confirmation, Guest } from "../models";
import { loadAdminDataOnce } from "../services/adminDataStore";
import { buildTables, buildTableStats } from "../services/tablesService";
import { buildProviderStats } from "../services/providersService";
import { buildNotificationStats } from "../services/notificationsService";
import { buildTaskStats } from "../services/tasksService";

const ADMIN_OUTBOUND_BUS_OPTIONS = [
  { value: "No", label: "No" },
  { value: "18:00", label: "18:00" },
  { value: "18:20", label: "18:20" },
];

const ADMIN_RETURN_BUS_OPTIONS = [
  { value: "No", label: "No" },
  { value: "3:00", label: "3:00" },
  { value: "6:00", label: "6:00" },
];

const BAR_COLORS = [
  "#344531",
  "#556b52",
  "#6f8b6b",
  "#879d7e",
  "#bccdb5",
  "#c7d4bf",
  "#9caf88",
  "#71816d",
  "#dfe8d7",
];

const TRANSPORT_BAR_COLORS = ["#344531", "#6f8b6b", "#bccdb5"];

const emptyState = {
  confirmations: [],
  loading: true,
  notifications: [],
  providers: [],
  tables: [],
  tasks: [],
  error: "",
};

export default function AdminStats() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, {
    once: true,
    amount: 0.2,
  });
  const isAuthenticated = isAdminSessionAuthenticated();
  const [state, setState] = useState(emptyState);

  const loadStats = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await loadAdminDataOnce();

      setState({
        confirmations: response.confirmations,
        loading: false,
        notifications: response.notifications,
        providers: response.providers,
        tables: response.tables,
        tasks: response.tasks,
        error: "",
      });
    } catch (error) {
      console.error(error);

      setState({
        confirmations: [],
        loading: false,
        notifications: [],
        providers: [],
        tables: [],
        tasks: [],
        error: adminContent.stats.dialogs.loadError,
      });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      loadStats({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadStats]);

  const stats = useMemo(
    () =>
      Confirmation.buildStats(state.confirmations, {
        allergies: COMMON_ALLERGIES,
        outboundBusOptions: ADMIN_OUTBOUND_BUS_OPTIONS,
        returnBusOptions: ADMIN_RETURN_BUS_OPTIONS,
      }),
    [state.confirmations],
  );
  const guestStats = useMemo(() => {
    const rows = Confirmation.toAdminRows(state.confirmations);
    const guests = getGuestItems(state.confirmations);

    return buildGuestStats(rows, guests);
  }, [state.confirmations]);
  const tableStats = useMemo(() => {
    const tables = buildTables({
      confirmations: state.confirmations,
      manualTables: state.tables,
    });

    return buildTableStats(tables);
  }, [state.confirmations, state.tables]);
  const providerStats = useMemo(
    () => buildProviderStats(state.providers),
    [state.providers],
  );
  const notificationStats = useMemo(
    () => buildNotificationStats(state.notifications),
    [state.notifications],
  );
  const taskStats = useMemo(() => buildTaskStats(state.tasks), [state.tasks]);

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      <CinematicSection
        className="surface-soft admin-section"
        innerClassName="max-w-6xl py-6"
        reveal={false}
      >
        <div ref={statsRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={statsInView}>
            <HeaderSection
              eyebrow={adminContent.stats.header.eyebrow}
              title={adminContent.stats.header.title}
              titleAs="h1"
              text={adminContent.stats.header.text}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={2} isVisible={statsInView}>
            <div className="grid gap-5">
              <TaskTotalsPanel loading={state.loading} stats={taskStats} />
              <NotificationTotalsPanel
                loading={state.loading}
                stats={notificationStats}
              />
              <StatsGuestTotalsPanel
                chartStats={stats}
                loading={state.loading}
                stats={guestStats}
              />
              <TableTotalsPanel loading={state.loading} stats={tableStats} />
              <ProviderTotalsPanel
                loading={state.loading}
                stats={providerStats}
              />
            </div>
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      <StatusDialog
        eyebrow={adminContent.stats.dialogs.warningEyebrow}
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title={adminContent.stats.dialogs.problemTitle}
        type="error"
      />
    </CinematicPage>
  );
}

function StatsGuestTotalsPanel({ chartStats, loading, stats }) {
  const metrics = adminContent.guests.overview.metrics;
  const content = adminContent.stats.confirmations;

  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">{content.eyebrow}</p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {content.title}
      </h2>
      {loading ? (
        <>
          <GuestOverviewMetricGridSkeleton />
          <StatsChartsSkeleton />
        </>
      ) : (
        <>
          <GuestOverviewMetricGrid metrics={metrics} stats={stats} />

          <div className="mt-3 grid gap-2">
            <CollapsiblePanel
              className="border-[var(--color-border)] bg-white/35"
              compact
              title={content.charts.allergies}
            >
              <BarStatsCard
                emptyText={adminContent.guests.overview.emptyAllergies}
                items={chartStats.allergiesByType}
              />
            </CollapsiblePanel>

            <CollapsiblePanel
              className="border-[var(--color-border)] bg-white/35"
              compact
              title={content.charts.transport}
            >
              <TransportCard stats={chartStats} />
            </CollapsiblePanel>
          </div>
        </>
      )}
    </section>
  );
}

function StatsChartsSkeleton() {
  return (
    <div className="mt-3 grid gap-2">
      {Array.from({ length: 2 }).map((_, panelIndex) => (
        <div
          className="rounded-[1rem] border border-[var(--color-border)] bg-white/35 p-2.5"
          key={panelIndex}
        >
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock
              className={`h-5 rounded-full ${
                panelIndex === 0 ? "w-28" : "w-24"
              }`}
            />
            <SkeletonBlock className="h-[1.125rem] w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarStatsCard({ emptyText, items }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-[var(--color-border)] bg-white/45 p-3 text-xs text-[var(--color-muted)]">
        {emptyText}
      </p>
    );
  }

  return <VerticalBarChart items={items} />;
}

function TransportCard({ stats }) {
  const content = adminContent.stats.confirmations.charts;

  return (
    <div className="grid grid-cols-2 gap-2">
      <TransportGroup items={stats.outboundBusStats} title={content.outbound} />
      <TransportGroup items={stats.returnBusStats} title={content.return} />
    </div>
  );
}

function TransportGroup({ items, title }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-white/35 p-2">
      <p className="mb-2 truncate text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--color-accent-dark)]">
        {title}
      </p>
      <BarChart colors={TRANSPORT_BAR_COLORS} compact items={items} />
    </div>
  );
}

function getGuestItems(confirmations) {
  return Confirmation.normalizeList(confirmations).flatMap((group) =>
    Guest.normalizeList(group.guests, { ensureOne: false }).map((guest) => ({
      ...guest,
      email: group.email,
      confirmationName: group.confirmationName,
      phone: group.phone,
    })),
  );
}

function buildGuestStats(rows, guests) {
  const menuGuests = isMenuModuleEnabled ? guests : [];

  return {
    allergyCount: guests.filter(
      (guest) => Guest.normalize(guest).allergies.length > 0,
    ).length,
    commentsCount: guests.filter(Guest.hasComments).length,
    fishCount: menuGuests.filter((guest) => guest.menu === "Pescado").length,
    groupCount: rows.length,
    guestCount: guests.length,
    meatCount: menuGuests.filter((guest) => guest.menu === "Carne").length,
    otherAllergyCount: guests.filter(Guest.hasOtherAllergies).length,
    outboundBusCount: guests.filter(
      (guest) => guest.outboundBus && guest.outboundBus !== "No",
    ).length,
    returnBusCount: guests.filter(
      (guest) => guest.returnBus && guest.returnBus !== "No",
    ).length,
  };
}

function BarChart({ colors = BAR_COLORS, compact = false, items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`grid ${compact ? "gap-1.5" : "gap-2"}`}>
      {items.map((item, index) => {
        const color = colors[index % colors.length];
        const width = total ? Math.max((item.value / total) * 100, 3) : 0;

        return (
          <div
            className={`rounded-lg bg-white/45 ${
              compact ? "p-1.5" : "border border-[var(--color-border)] p-2"
            }`}
            key={item.label}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-[0.68rem] leading-tight">
              <span className="min-w-0 truncate text-[var(--color-muted)]">
                {item.label}
              </span>
              <span className="shrink-0 font-medium text-[var(--color-accent-dark)]">
                {item.value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
              <span
                className="block h-full rounded-full"
                style={{ backgroundColor: color, width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
