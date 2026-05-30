import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import AnimatedInfoCard from "../components/common/AnimatedInfoCard";
import HeaderSection from "../components/common/HeaderSection";
import {
  COMMON_ALLERGIES,
  OUTBOUND_BUS_OPTIONS,
  RETURN_BUS_OPTIONS,
} from "../constants/rsvp";
import { findAllGroups } from "../services/rsvpService";

const DONUT_COLORS = [
  "#556b52",
  "#6f8b6b",
  "#9caf88",
  "#bccdb5",
  "#dfe8d7",
  "#879d7e",
  "#c7d4bf",
  "#71816d",
];

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
      const groups = normalizeGroupsResponse(response);

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
          "No se pudieron cargar las estadisticas. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
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
              <div className="premium-card mb-5 flex items-start gap-4 border-red-200 bg-red-50/70 text-red-700">
                <AlertTriangle className="mt-1 shrink-0" size={20} />
                <p className="text-sm leading-relaxed">{state.error}</p>
              </div>
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

        <button
          className="btn-secondary w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          disabled={loading}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw
            className={loading ? "animate-spin" : ""}
            size={16}
            strokeWidth={1.8}
          />
          Actualizar
        </button>
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
  return (
    <article className="premium-card relative overflow-hidden">
      <CardHeader emoji={emoji} title={title} />

      {items.length ? (
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(168px,0.8fr)_1fr]">
          <DonutChart items={items} />
          <ChartLegend items={items} />
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
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-[var(--color-accent-dark)]">
        {title}
      </p>

      <div className="grid items-center gap-4">
        <DonutChart items={items} size="sm" />
        <ChartLegend compact items={items} />
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

function DonutChart({ items, size = "md" }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visibleItems = items.filter((item) => item.value > 0);
  const dimensions = size === "sm" ? "h-40 w-40" : "h-48 w-48";
  const segments = visibleItems.reduce(
    (acc, item, index) => {
      const percent = total ? (item.value / total) * 100 : 0;

      return {
        offset: acc.offset + percent,
        values: [
          ...acc.values,
          {
            color: DONUT_COLORS[index % DONUT_COLORS.length],
            label: item.label,
            offset: acc.offset,
            percent,
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
          aria-hidden="true"
          className="h-full w-full -rotate-90"
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
              cx="50"
              cy="50"
              fill="none"
              key={segment.label}
              pathLength="100"
              r="38"
              stroke={segment.color}
              strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
              strokeWidth="12"
            />
          ))}
        </svg>

        <span className="absolute inset-0 flex flex-col items-center justify-center rounded-full text-center">
          <span className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
            {total}
          </span>
          <span className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            total
          </span>
        </span>
      </div>
    </div>
  );
}

function ChartLegend({ compact = false, items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {items.map((item, index) => (
        <div
          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm"
          key={item.label}
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{
              backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length],
            }}
          />
          <span className="min-w-0 leading-snug text-[var(--color-muted)]">
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
      ))}
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

function normalizeGroupsResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.groups)) return response.groups;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;

  return [];
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
      OUTBOUND_BUS_OPTIONS,
      "outboundBus",
    ),
    returnBusStats: buildBusStats(guests, RETURN_BUS_OPTIONS, "returnBus"),
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
  return options.map((option) => ({
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
  return Boolean(guest.busNeeded);
}
