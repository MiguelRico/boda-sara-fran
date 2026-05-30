import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bus,
  RefreshCw,
  Salad,
  UsersRound,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import {
  COMMON_ALLERGIES,
  OUTBOUND_BUS_OPTIONS,
  RETURN_BUS_OPTIONS,
} from "../constants/rsvp";
import { findAllGroups } from "../services/rsvpService";

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};

export default function AdminStats() {
  const navigate = useNavigate();
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
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-accent-dark)] transition hover:text-[var(--color-text)]"
                  onClick={() => navigate("/admin")}
                  type="button"
                >
                  <ArrowLeft size={17} strokeWidth={1.8} />
                  Volver al panel
                </button>

                <p className="section-eyebrow mb-2">Panel privado</p>
                <h1 className="section-title">Estadisticas</h1>
                <p className="section-text mx-0 max-w-3xl text-left">
                  Resumen de confirmaciones, alergias y transporte para preparar la
                  organizacion de la boda.
                </p>
              </div>

              <button
                className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={state.loading}
                onClick={loadStats}
                type="button"
              >
                <RefreshCw
                  className={state.loading ? "animate-spin" : ""}
                  size={16}
                  strokeWidth={1.8}
                />
                Actualizar
              </button>
            </div>
          </CinematicStaggeredRevealItem>

          {state.error && (
            <CinematicStaggeredRevealItem index={1} isVisible={statsInView}>
              <div className="premium-card mb-5 flex items-start gap-4 border-red-200 bg-red-50/70 text-red-700">
                <AlertTriangle className="mt-1 shrink-0" size={20} />
                <p className="text-sm leading-relaxed">{state.error}</p>
              </div>
            </CinematicStaggeredRevealItem>
          )}

          {state.loading ? (
            <CinematicStaggeredRevealItem index={2} isVisible={statsInView}>
              <StatsSkeleton />
            </CinematicStaggeredRevealItem>
          ) : (
            <div className="space-y-5">
              <CinematicStaggeredRevealItem index={2} isVisible={statsInView}>
                <SummaryGrid stats={stats} />
              </CinematicStaggeredRevealItem>

              <CinematicStaggeredRevealItem index={3} isVisible={statsInView}>
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <AttendanceCard stats={stats} />
                  <ReviewCard stats={stats} />
                </div>
              </CinematicStaggeredRevealItem>

              <CinematicStaggeredRevealItem index={4} isVisible={statsInView}>
                <div className="grid gap-5 lg:grid-cols-2">
                  <BarListCard
                    emptyText="Sin alergias registradas"
                    icon={Salad}
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

function SummaryGrid({ stats }) {
  const items = [
    {
      label: "Invitados",
      value: stats.totalGuests,
      detail: `${stats.totalGroups} confirmaciones`,
      icon: UsersRound,
    },
    {
      label: "Con alergias",
      value: stats.guestsWithAllergies,
      detail: `${stats.allergyRate}% del total`,
      icon: Salad,
    },
    {
      label: "Usan transporte",
      value: stats.guestsUsingBus,
      detail: `${stats.busRate}% del total`,
      icon: Bus,
    },
    {
      label: "Revision",
      value: stats.reviewItems.length,
      detail: "comentarios y casos a revisar",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article className="premium-card" key={item.label}>
          <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
            <item.icon size={19} strokeWidth={1.7} />
          </div>

          <p className="text-sm text-[var(--color-muted)]">{item.label}</p>
          <p className="mt-2 font-serif text-5xl leading-none text-[var(--color-accent-dark)]">
            {item.value}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {item.detail}
          </p>
        </article>
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
        <MiniMetric label="Grupos" value={stats.totalGroups} />
        <MiniMetric label="Invitados" value={stats.totalGuests} />
        <MiniMetric label="Media grupo" value={stats.averageGroupSize} />
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

function BarListCard({ emptyText, icon: Icon, items, title }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="premium-card">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
          <Icon size={18} strokeWidth={1.7} />
        </div>
        <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
          {title}
        </h2>
      </div>

      {items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <BarRow item={item} key={item.label} max={max} />
          ))}
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
    <article className="premium-card">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
          <Bus size={18} strokeWidth={1.7} />
        </div>
        <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
          Transporte
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TransportGroup items={stats.outboundBusStats} title="Ida" />
        <TransportGroup items={stats.returnBusStats} title="Vuelta" />
      </div>
    </article>
  );
}

function TransportGroup({ items, title }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-[var(--color-accent-dark)]">
        {title}
      </p>

      <div className="space-y-4">
        {items.map((item) => (
          <BarRow item={item} key={item.label} max={max} />
        ))}
      </div>
    </div>
  );
}

function BarRow({ item, max }) {
  const width = Math.round((item.value / max) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-[var(--color-muted)]">{item.label}</span>
        <span className="font-medium text-[var(--color-accent-dark)]">
          {item.value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent-dark)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white/45 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        {value}
      </p>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="premium-card min-h-48 animate-pulse" key={index}>
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
