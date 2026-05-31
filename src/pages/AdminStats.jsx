import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import StatusNotice from "../components/ui/StatusNotice";
import { COMMON_ALLERGIES } from "../constants/rsvp";
import { findAllGroups } from "../services/rsvpService";
import { getGroupsFromResponse } from "../utils/rsvpGroups";

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
      const groups = getGroupsFromResponse(response);

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

  const stats = useMemo(() => buildStats(state.groups), [state.groups]);

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

          {state.error && (
            <CinematicStaggeredRevealItem index={1} isVisible={statsInView}>
              <StatusNotice tone="error">{state.error}</StatusNotice>
            </CinematicStaggeredRevealItem>
          )}

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
                  emoji="🥗"
                  items={stats.allergiesByType}
                  title="Alergias por tipo"
                />

                <TransportCard stats={stats} />
              </div>
            </CinematicStaggeredRevealItem>
          )}
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}

function StatsOverview({ loading, onRefresh, stats }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
            Vision operativa
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

      {loading ? <StatsSkeleton /> : <SummaryGrid stats={stats} />}
    </section>
  );
}

function SummaryGrid({ stats }) {
  const items = [
    {
      label: "Total confirmaciones",
      value: stats.totalGroups,
      detail: "confirmaciones registradas",
      emoji: "👥",
    },
    {
      label: "Total de personas",
      value: stats.totalGuests,
      detail: "incluidas en las respuestas",
      emoji: "+",
    },
    {
      label: "Personas con alergias",
      value: `${stats.allergyRate}%`,
      detail: `${stats.guestsWithAllergies} de ${stats.totalGuests} personas`,
      emoji: "🥗",
    },
    {
      label: "Con otras alergias",
      value: `${stats.otherAllergyRate}%`,
      detail: `${stats.guestsWithOtherAllergies} de ${stats.totalGuests} personas`,
      emoji: "!",
    },
    {
      label: "Con comentarios",
      value: `${stats.commentsRate}%`,
      detail: `${stats.guestsWithComments} de ${stats.totalGuests} personas`,
      emoji: "...",
    },
    {
      label: "Usan transporte",
      value: `${stats.busRate}%`,
      detail: `${stats.guestsUsingBus} de ${stats.totalGuests} personas`,
      emoji: "🚌",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <AnimatedInfoCard
          card={{
            className:
              "rounded-[1.5rem] border-[var(--color-border)] bg-white/45 p-4 sm:p-5",
            description: item.detail,
            emoji: item.emoji,
            inlineTitleDescription: true,
            showAction: false,
            subtitle: item.label,
            title: String(item.value),
          }}
          index={index}
          key={item.label}
        />
      ))}
    </div>
  );
}

function DonutStatsCard({ emptyText, emoji, items, title }) {
  const [hoveredLabel, setHoveredLabel] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const activeLabel = hoveredLabel || selectedLabel;

  return (
    <article className="premium-card relative overflow-hidden">
      <CardHeader emoji={emoji} title={title} />

      {items.length ? (
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(168px,0.8fr)_1fr]">
          <DonutChart
            activeLabel={activeLabel}
            items={items}
            onHoverLabel={setHoveredLabel}
            onSelectLabel={setSelectedLabel}
          />
          <ChartLegend
            activeLabel={activeLabel}
            items={items}
            onHoverLabel={setHoveredLabel}
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
      <CardHeader emoji="🚌" title="Transporte" />

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
          onSelectLabel={setSelectedLabel}
          size="sm"
        />
        <ChartLegend
          activeLabel={activeLabel}
          compact
          colors={TRANSPORT_DONUT_COLORS}
          items={items}
          onHoverLabel={setHoveredLabel}
        />
      </div>
    </div>
  );
}

function CardHeader({ emoji, title }) {
  return (
    <div className="relative mb-6 flex items-center gap-3">
      <div className="pointer-events-none absolute -right-2 -top-5 text-6xl opacity-[0.08]">
        {emoji}
      </div>

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/70 text-xl">
        {emoji}
      </span>

      <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        {title}
      </h2>
    </div>
  );
}

function DonutChart({
  activeLabel,
  colors = DONUT_COLORS,
  items,
  onHoverLabel,
  onSelectLabel,
  size = "md",
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visibleItems = items.filter((item) => item.value > 0);
  const dimensions = size === "sm" ? "h-40 w-40" : "h-48 w-48";
  const valueSize = size === "sm" ? "text-3xl" : "text-4xl";
  const activeItem = visibleItems.find((item) => item.label === activeLabel);
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
    <div className="flex justify-center">
      <div className={`relative ${dimensions}`}>
        <svg
          aria-label="Gráfica de tipo donut"
          className="h-full w-full -rotate-90"
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
              onClick={() =>
                onSelectLabel((currentLabel) =>
                  currentLabel === segment.label ? "" : segment.label,
                )
              }
              onMouseEnter={() => onHoverLabel(segment.label)}
              onMouseLeave={() => onHoverLabel("")}
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
                  onSelectLabel((currentLabel) =>
                    currentLabel === segment.label ? "" : segment.label,
                  );
                }
              }}
              style={{
                filter:
                  activeLabel === segment.label
                    ? "drop-shadow(0 3px 5px rgba(85, 107, 82, 0.28))"
                    : "none",
                opacity:
                  activeItem && activeItem.label !== segment.label ? 0.38 : 1,
              }}
            />
          ))}
        </svg>

        <span className="absolute inset-0 flex flex-col items-center justify-center rounded-full px-4 text-center transition-all duration-200">
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
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {items.map((item, index) => {
        const color = colors[index % colors.length];
        const isActive = activeLabel === item.label;

        return (
          <div
            className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition-all duration-200 ${
              isActive ? "bg-white/55 shadow-sm" : ""
            }`}
            key={item.label}
            onMouseEnter={() => onHoverLabel(item.label)}
            onMouseLeave={() => onHoverLabel("")}
          >
            <span
              className={`h-3 w-3 rounded-full transition-all duration-200 ${
                isActive ? "scale-125 shadow-sm" : ""
              }`}
              style={{
                backgroundColor: color,
                boxShadow: isActive ? `0 0 0 4px ${color}22` : undefined,
              }}
            />
            <span
              className={`min-w-0 leading-snug transition-colors duration-200 ${
                isActive
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
          </div>
        );
      })}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="min-h-48 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5"
          key={index}
        >
          <div className="h-11 w-11 rounded-full bg-[var(--color-border)]" />
          <div className="mt-8 h-4 w-24 rounded-full bg-[var(--color-border)]" />
          <div className="mt-4 h-12 w-20 rounded-full bg-[var(--color-border)]" />
        </div>
      ))}
    </div>
  );
}

function buildStats(groups) {
  const normalizedGroups = groups.map((group) => ({
    ...group,
    guests: Array.isArray(group.guests) ? group.guests : [],
  }));
  const guests = normalizedGroups.flatMap((group) =>
    group.guests.map((guest) => ({
      ...guest,
      email: group.email,
      groupName: group.groupName,
      phone: group.phone,
    })),
  );

  const totalGuests = guests.length;
  const totalGroups = normalizedGroups.length;
  const guestsWithAllergies = guests.filter(hasAllergies).length;
  const guestsWithOtherAllergies = guests.filter((guest) =>
    guest.otherAllergies?.trim(),
  ).length;
  const guestsUsingBus = guests.filter(usesBus).length;
  const guestsWithComments = guests.filter((guest) =>
    guest.comments?.trim(),
  ).length;

  return {
    allergyRate: getRate(guestsWithAllergies, totalGuests),
    allergiesByType: buildAllergyStats(guests),
    busRate: getRate(guestsUsingBus, totalGuests),
    commentsRate: getRate(guestsWithComments, totalGuests),
    guestsWithAllergies,
    guestsWithComments,
    guestsWithOtherAllergies,
    guestsUsingBus,
    otherAllergyRate: getRate(guestsWithOtherAllergies, totalGuests),
    outboundBusStats: buildBusStats(
      guests,
      ADMIN_OUTBOUND_BUS_OPTIONS,
      "outboundBus",
    ),
    returnBusStats: buildBusStats(
      guests,
      ADMIN_RETURN_BUS_OPTIONS,
      "returnBus",
    ),
    totalGroups,
    totalGuests,
  };
}

function buildAllergyStats(guests) {
  return COMMON_ALLERGIES.map((allergy) => ({
    label: allergy,
    value: guests.filter((guest) => guest.allergies?.includes(allergy)).length,
  })).filter((item) => item.value > 0);
}

function buildBusStats(guests, options, field) {
  return options
    .filter((option) => option.value !== "No")
    .map((option) => ({
      label: option.label,
      value: guests.filter((guest) => {
        const selectedValue = guest[field] || "No";

        return selectedValue === option.value;
      }).length,
    }));
}

function getRate(value, total) {
  if (!total) return 0;

  return Math.round((value / total) * 100);
}

function hasAllergies(guest) {
  return Boolean(guest.allergies?.length && guest.allergies != "No");
}

function usesBus(guest) {
  return Boolean(
    (guest.outboundBus && guest.outboundBus !== "No") ||
    (guest.returnBus && guest.returnBus !== "No"),
  );
}

