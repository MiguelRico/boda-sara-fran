import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  BusFront,
  ClipboardCheck,
  MessageCircle,
  RefreshCw,
  Salad,
  UsersRound,
} from "lucide-react";

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
import { COMMON_ALLERGIES } from "../constants/rsvp";
import { Confirmation } from "../models";
import { findAllGroups } from "../services/rsvpService";
import { normalizeAdminGroups } from "../utils/rsvpGroups";

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

const DONUT_COLORS = [
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

const TRANSPORT_DONUT_COLORS = ["#344531", "#6f8b6b", "#bccdb5"];

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};
const CONFIRMATIONS_METRIC_GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-start sm:justify-center sm:gap-4";
const CONFIRMATIONS_METRIC_CARD_CLASS =
  "rounded-[1.5rem] border-[var(--color-border)] bg-white/45 p-3 sm:p-5";

export default function AdminStats() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, {
    once: true,
    amount: 0.2,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);

  const loadStats = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await findAllGroups({ password: ADMIN_PASSWORD });
      const groups = normalizeAdminGroups(response);

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
          "No se pudieron cargar las estadísticas. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
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
      Confirmation.buildStats(state.groups, {
        allergies: COMMON_ALLERGIES,
        outboundBusOptions: ADMIN_OUTBOUND_BUS_OPTIONS,
        returnBusOptions: ADMIN_RETURN_BUS_OPTIONS,
      }),
    [state.groups],
  );

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
        <div ref={statsRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={statsInView}>
            <HeaderSection
              eyebrow="Panel privado"
              title="Resumen"
              titleAs="h1"
              text="Seguimiento de respuestas recibidas y datos operativos"
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={2} isVisible={statsInView}>
            <StatsOverview
              loading={state.loading}
              onRefresh={loadStats}
              stats={stats}
            />
          </CinematicStaggeredRevealItem>

          {!state.loading && (
            <CinematicStaggeredRevealItem index={3} isVisible={statsInView}>
              <div className="grid gap-5 lg:grid-cols-2">
                <DonutStatsCard
                  emptyText="Sin alergias registradas"
                  backgroundIcon={<Salad size={74} strokeWidth={1.5} />}
                  icon={<Salad size={22} strokeWidth={1.8} />}
                  items={stats.allergiesByType}
                  title="Alergias"
                />

                <TransportCard stats={stats} />
              </div>
            </CinematicStaggeredRevealItem>
          )}
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

function StatsOverview({ loading, onRefresh, stats }) {
  return (
    <div className="mt-4 mb-5">
      <div className="mb-4 flex justify-end">
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

      <section className="premium-card">
        <CardHeader
          backgroundIcon={<ClipboardCheck size={74} strokeWidth={1.5} />}
          icon={<ClipboardCheck size={22} strokeWidth={1.8} />}
          title="Confirmaciones"
        />

        {loading ? (
          <AdminMetricGridSkeleton />
        ) : (
          <AdminMetricGrid
            cardClassName={CONFIRMATIONS_METRIC_CARD_CLASS}
            className={CONFIRMATIONS_METRIC_GRID_CLASS}
            compactSummary
            items={getSummaryItems(stats)}
          />
        )}
      </section>
    </div>
  );
}

function getSummaryItems(stats) {
  return [
    {
      label: "Total confirmaciones",
      value: stats.totalGroups,
      detail: "Recibidas",
      emoji: <ClipboardCheck size={22} strokeWidth={1.8} />,
    },
    {
      label: "Total de personas",
      value: stats.totalGuests,
      detail: "Personas",
      emoji: <UsersRound size={22} strokeWidth={1.8} />,
    },
    {
      label: "Personas con alergias",
      value: stats.guestsWithAllergies,
      detail: "Alergias",
      emoji: <Salad size={22} strokeWidth={1.8} />,
    },
    {
      label: "Con otras alergias",
      value: stats.guestsWithOtherAllergies,
      detail: "Otras...",
      emoji: <AlertTriangle size={22} strokeWidth={1.8} />,
    },
    {
      label: "Con notas",
      value: `${stats.guestsWithComments}`,
      detail: "Notas",
      emoji: <MessageCircle size={22} strokeWidth={1.8} />,
    },
    {
      label: "Usan transporte",
      value: `${stats.guestsUsingBus}`,
      detail: "Autobús",
      emoji: <BusFront size={22} strokeWidth={1.8} />,
    },
  ];
}

function DonutStatsCard({ backgroundIcon, emptyText, icon, items, title }) {
  const [hoveredLabel, setHoveredLabel] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const activeLabel = hoveredLabel || selectedLabel;
  const handleSelectLabel = useCallback((label) => {
    setHoveredLabel("");
    setSelectedLabel((currentLabel) => (currentLabel === label ? "" : label));
  }, []);

  return (
    <article className="premium-card relative overflow-hidden">
      <CardHeader backgroundIcon={backgroundIcon} icon={icon} title={title} />

      {items.length ? (
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(168px,0.8fr)_1fr]">
          <DonutChart
            activeLabel={activeLabel}
            items={items}
            onHoverLabel={setHoveredLabel}
            onSelectLabel={handleSelectLabel}
            selectedLabel={selectedLabel}
          />
          <ChartLegend
            activeLabel={activeLabel}
            items={items}
            onHoverLabel={setHoveredLabel}
            onSelectLabel={handleSelectLabel}
            selectedLabel={selectedLabel}
          />
        </div>
      ) : (
        <p className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4 text-sm text-[var(--color-muted)]">
          {emptyText}
        </p>
      )}
    </article>
  );
}

function TransportCard({ stats }) {
  return (
    <article className="premium-card relative overflow-hidden">
      <CardHeader
        backgroundIcon={<BusFront size={74} strokeWidth={1.5} />}
        icon={<BusFront size={22} strokeWidth={1.8} />}
        title="Autobús"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TransportGroup items={stats.outboundBusStats} title="Ida" />
        <TransportGroup items={stats.returnBusStats} title="Vuelta" />
      </div>
    </article>
  );
}

function TransportGroup({ items, title }) {
  const [hoveredLabel, setHoveredLabel] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const activeLabel = hoveredLabel || selectedLabel;
  const handleSelectLabel = useCallback((label) => {
    setHoveredLabel("");
    setSelectedLabel((currentLabel) => (currentLabel === label ? "" : label));
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-accent-dark)]">
        {title}
      </p>

      <div className="grid items-center gap-4">
        <DonutChart
          activeLabel={activeLabel}
          colors={TRANSPORT_DONUT_COLORS}
          items={items}
          onHoverLabel={setHoveredLabel}
          onSelectLabel={handleSelectLabel}
          selectedLabel={selectedLabel}
          size="sm"
        />
        <ChartLegend
          activeLabel={activeLabel}
          compact
          colors={TRANSPORT_DONUT_COLORS}
          items={items}
          onHoverLabel={setHoveredLabel}
          onSelectLabel={handleSelectLabel}
          selectedLabel={selectedLabel}
        />
      </div>
    </div>
  );
}

function CardHeader({ backgroundIcon, icon, title }) {
  return (
    <div className="relative mb-6 flex items-center gap-3">
      <div className="pointer-events-none absolute -right-2 -top-5 text-[var(--color-accent-dark)] opacity-[0.08]">
        {backgroundIcon || icon}
      </div>

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/70 text-[var(--color-accent-dark)]">
        {icon}
      </span>

      <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        {title}
      </h2>
    </div>
  );
}

function supportsHoverPointer() {
  return Boolean(
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches,
  );
}

function DonutChart({
  activeLabel,
  colors = DONUT_COLORS,
  items,
  onHoverLabel,
  onSelectLabel,
  selectedLabel,
  size = "md",
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visibleItems = items.filter((item) => item.value > 0);
  const dimensions = size === "sm" ? "h-40 w-40" : "h-48 w-48";
  const valueSize = size === "sm" ? "text-3xl" : "text-4xl";
  const activeItem = visibleItems.find((item) => item.label === activeLabel);
  const handleHoverLabel = (label) => {
    if (supportsHoverPointer()) {
      onHoverLabel(label);
    }
  };
  const handleSelectLabel = (label) => {
    if (supportsHoverPointer()) {
      onSelectLabel(label);
    }
  };
  const segments = visibleItems.reduce(
    (acc, item, index) => {
      const percent = total ? (item.value / total) * 100 : 0;

      return {
        offset: acc.offset + percent,
        values: [
          ...acc.values,
          {
            color: colors[index % colors.length],
            label: item.label,
            offset: acc.offset,
            percent,
            value: item.value,
          },
        ],
      };
    },
    { offset: 0, values: [] },
  ).values;

  return (
    <div className="flex select-none justify-center">
      <div className={`relative ${dimensions}`}>
        <svg
          aria-label="Gráfica de tipo donut"
          className="h-full w-full -rotate-90 select-none"
          role="img"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            fill="none"
            r="38"
            stroke="var(--color-border)"
            strokeWidth="12"
          />

          {segments.map((segment) => (
            <circle
              aria-label={`${segment.label}: ${segment.value}`}
              className="cursor-pointer transition-all duration-200 focus:outline-none"
              cx="50"
              cy="50"
              fill="none"
              key={segment.label}
              onClick={() => handleSelectLabel(segment.label)}
              onMouseEnter={() => handleHoverLabel(segment.label)}
              onMouseLeave={() => handleHoverLabel("")}
              onMouseDown={(event) => event.preventDefault()}
              pathLength="100"
              r="38"
              role="button"
              stroke={segment.color}
              strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
              strokeWidth="12"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectLabel(segment.label);
                }
              }}
              style={{
                filter:
                  activeLabel === segment.label
                    ? "drop-shadow(0 3px 5px rgba(85, 107, 82, 0.34))"
                    : "none",
                opacity:
                  activeItem && activeItem.label !== segment.label ? 0.38 : 1,
                strokeWidth: selectedLabel === segment.label ? 14 : 12,
              }}
            />
          ))}
        </svg>

        <span className="absolute inset-0 flex select-none flex-col items-center justify-center rounded-full px-4 text-center transition-all duration-200">
          <span
            className={`max-w-full truncate font-serif ${valueSize} leading-none text-[var(--color-accent-dark)]`}
          >
            {activeItem ? activeItem.value : total}
          </span>
          <span className="mt-1 max-w-full truncate text-[0.62rem] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {activeItem ? activeItem.label : "total"}
          </span>
          {activeItem && total > 0 && (
            <span className="mt-1 text-xs font-medium text-[var(--color-accent-dark)]">
              {Math.round((activeItem.value / total) * 100)}%
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function ChartLegend({
  activeLabel,
  colors = DONUT_COLORS,
  compact = false,
  items,
  onHoverLabel,
  onSelectLabel,
  selectedLabel,
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const handleHoverLabel = (label) => {
    if (supportsHoverPointer()) {
      onHoverLabel(label);
    }
  };

  return (
    <div className={`select-none ${compact ? "space-y-2" : "space-y-3"}`}>
      {items.map((item, index) => {
        const color = colors[index % colors.length];
        const isActive = activeLabel === item.label;
        const isSelected = selectedLabel === item.label;

        return (
          <button
            className={`grid w-full cursor-pointer select-none grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-dark)]/35 ${
              isSelected
                ? "bg-white/75 shadow-md ring-1 ring-[var(--color-border-strong)]"
                : isActive
                  ? "bg-white/55 shadow-sm"
                  : ""
            }`}
            key={item.label}
            onClick={() => onSelectLabel(item.label)}
            onMouseEnter={() => handleHoverLabel(item.label)}
            onMouseLeave={() => handleHoverLabel("")}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            <span
              className={`h-3 w-3 rounded-full transition-all duration-200 ${
                isSelected
                  ? "scale-150 shadow-md"
                  : isActive
                    ? "scale-125 shadow-sm"
                    : ""
              }`}
              style={{
                backgroundColor: color,
                boxShadow: isSelected
                  ? `0 0 0 5px ${color}33`
                  : isActive
                    ? `0 0 0 4px ${color}22`
                    : undefined,
              }}
            />
            <span
              className={`min-w-0 leading-snug transition-colors duration-200 ${
                isSelected
                  ? "font-semibold text-[var(--color-accent-dark)]"
                  : isActive
                    ? "font-medium text-[var(--color-accent-dark)]"
                    : "text-[var(--color-muted)]"
              }`}
            >
              {item.label}
            </span>
            <span className="font-medium text-[var(--color-accent-dark)]">
              {item.value}
              {total > 0 && (
                <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">
                  {Math.round((item.value / total) * 100)}%
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
