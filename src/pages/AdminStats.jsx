import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

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
              title="Estadisticas"
              titleAs="h1"
              text="Resumen de confirmaciones, alergias y transporte para preparar la organizacion de la boda."
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
            <div className="space-y-5">
              <CinematicStaggeredRevealItem index={3} isVisible={statsInView}>
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <AttendanceCard stats={stats} />
                  <ReviewCard stats={stats} />
                </div>
              </CinematicStaggeredRevealItem>

              <CinematicStaggeredRevealItem index={4} isVisible={statsInView}>
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
            </div>
          )}
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}

function StatsOverview({ loading, onRefresh, stats }) {
  return (
    <section className="premium-card mb-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow mb-2">Resumen</p>
          <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
            Vision general
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
            {stats.totalGuests} invitados en {stats.totalGroups} confirmaciones
          </p>
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
      label: "Invitados",
      value: stats.totalGuests,
      detail: `${stats.totalGroups} confirmaciones`,
      emoji: "👥",
    },
    {
      label: "Con alergias",
      value: stats.guestsWithAllergies,
      detail: `${stats.allergyRate}% del total`,
      emoji: "🥗",
    },
    {
      label: "Usan transporte",
      value: stats.guestsUsingBus,
      detail: `${stats.busRate}% del total`,
      emoji: "🚌",
    },
    {
      label: "Revision",
      value: stats.reviewItems.length,
      detail: "comentarios y casos a revisar",
      emoji: "!",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <AnimatedInfoCard
          card={{
            className:
              "rounded-[1.5rem] border-[var(--color-border)] bg-white/45 p-4 sm:p-5",
            description: item.detail,
            emoji: item.emoji,
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

function AttendanceCard({ stats }) {
  return (
    <article className="premium-card">
      <p className="section-eyebrow mb-3">Asistencia</p>
      <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        Confirmaciones recibidas
      </h2>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <MiniMetric
          detail="confirmaciones recibidas"
          emoji="✉"
          index={0}
          label="Grupos"
          value={stats.totalGroups}
        />
        <MiniMetric
          detail="personas confirmadas"
          emoji="👥"
          index={1}
          label="Invitados"
          value={stats.totalGuests}
        />
        <MiniMetric
          detail="invitados por grupo"
          emoji="#"
          index={2}
          label="Media grupo"
          value={stats.averageGroupSize}
        />
      </div>

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between text-sm text-[var(--color-muted)]">
          <span>Invitados con datos completos</span>
          <span>{stats.completeGuestRate}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent-dark)]"
            style={{ width: `${stats.completeGuestRate}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function ReviewCard({ stats }) {
  return (
    <article className="premium-card">
      <p className="section-eyebrow mb-3">Necesita revision</p>
      <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        Puntos sensibles
      </h2>

      <div className="mt-6 space-y-3">
        {stats.reviewItems.length ? (
          stats.reviewItems.slice(0, 6).map((item) => (
            <div
              className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4"
              key={`${item.name}-${item.reason}`}
            >
              <p className="text-sm font-medium text-[var(--color-accent-dark)]">
                {item.name}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {item.reason}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4 text-sm text-[var(--color-muted)]">
            No hay comentarios, alergias abiertas ni transporte incompleto.
          </p>
        )}
      </div>
    </article>
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

function MiniMetric({ detail, emoji, index, label, value }) {
  return (
    <AnimatedInfoCard
      card={{
        className:
          "rounded-[1.5rem] border-[var(--color-border)] bg-white/45 p-4 sm:p-5",
        description: detail,
        emoji,
        showAction: false,
        subtitle: label,
        title: String(value),
      }}
      index={index}
    />
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
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
  const guestsUsingBus = guests.filter(usesBus).length;
  const completeGuests = guests.filter(
    (guest) => guest.name?.trim() && guest.lastname?.trim(),
  ).length;
  const reviewItems = buildReviewItems(guests);

  return {
    allergyRate: getRate(guestsWithAllergies, totalGuests),
    allergiesByType: buildAllergyStats(guests),
    averageGroupSize: totalGroups
      ? Number((totalGuests / totalGroups).toFixed(1))
      : 0,
    busRate: getRate(guestsUsingBus, totalGuests),
    completeGuestRate: getRate(completeGuests, totalGuests),
    guestsUsingBus,
    guestsWithAllergies,
    outboundBusStats: buildBusStats(guests, OUTBOUND_BUS_OPTIONS, "outboundBus"),
    returnBusStats: buildBusStats(guests, RETURN_BUS_OPTIONS, "returnBus"),
    reviewItems,
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

function buildReviewItems(guests) {
  return guests
    .flatMap((guest) => {
      const name = `${guest.name || "Invitado"} ${guest.lastname || ""}`.trim();
      const items = [];

      if (guest.otherAllergies?.trim()) {
        items.push({
          name,
          reason: `Otras alergias: ${guest.otherAllergies}`,
        });
      }

      if (guest.comments?.trim()) {
        items.push({
          name,
          reason: `Comentario: ${guest.comments}`,
        });
      }

      if (guest.busNeeded && (!guest.outboundBus || !guest.returnBus)) {
        items.push({
          name,
          reason: "Ha marcado transporte, pero falta algun horario.",
        });
      }

      return items;
    })
    .slice(0, 20);
}

function getRate(value, total) {
  if (!total) return 0;

  return Math.round((value / total) * 100);
}

function hasAllergies(guest) {
  return Boolean(guest.allergies?.length || guest.otherAllergies?.trim());
}

function usesBus(guest) {
  return Boolean(
    guest.busNeeded ||
      (guest.outboundBus && guest.outboundBus !== "No") ||
      (guest.returnBus && guest.returnBus !== "No"),
  );
}
