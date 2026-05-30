import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/common/HeaderSection";
import {
  COMMON_ALLERGIES,
  createEmptyGuest,
  MAX_GUESTS,
  OUTBOUND_BUS_OPTIONS,
  RETURN_BUS_OPTIONS,
} from "../constants/rsvp";
import {
  deleteAdminGroup,
  findAllGroups,
  saveAdminGroup,
} from "../services/rsvpService";
import {
  FieldError,
  inputClassName,
  Label,
} from "../components/rsvp/FormPrimitives";

const pageSize = 8;
const filters = [
  { value: "all", label: "Todos" },
  { value: "allergies", label: "Con alergias" },
  { value: "bus", label: "Con bus" },
  { value: "review", label: "Revision" },
];

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};

export default function AdminGuests() {
  const guestsRef = useRef(null);
  const guestsInView = useInView(guestsRef, {
    once: true,
    amount: 0.18,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadGuests = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await findAllGroups({ password: ADMIN_PASSWORD });

      setState({
        groups: normalizeGroupsResponse(response),
        loading: false,
        error: "",
      });
    } catch (error) {
      console.error(error);

      setState({
        groups: [],
        loading: false,
        error:
          "No se pudieron cargar los invitados. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
      });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      loadGuests({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadGuests]);

  const rows = useMemo(() => buildGuestRows(state.groups), [state.groups]);
  const visibleRows = useMemo(
    () => filterRows(rows, query, filter),
    [filter, query, rows],
  );
  const totalPages = Math.max(Math.ceil(visibleRows.length / pageSize), 1);
  const pagedRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);

  const handleSaveGroup = async (group) => {
    setFeedback("");

    try {
      await saveAdminGroup({
        group,
        password: ADMIN_PASSWORD,
      });

      setEditingGroup(null);
      setFeedback("Confirmacion guardada correctamente.");
      await loadGuests();
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo guardar la confirmacion.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;

    setFeedback("");

    try {
      await deleteAdminGroup({
        groupId: deleteTarget.groupId,
        password: ADMIN_PASSWORD,
      });

      setDeleteTarget(null);
      setFeedback("Confirmacion eliminada correctamente.");
      await loadGuests();
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo eliminar la confirmacion.");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      <CinematicSection
        className="surface-soft"
        innerClassName="max-w-7xl py-6"
        reveal={false}
      >
        <div ref={guestsRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={guestsInView}>
            <HeaderSection
              eyebrow="Gestiona tus confirmaciones"
              title="Lista de invitados"
              titleAs="h1"
              text="Gestion de confirmaciones, datos de contacto, alergias y
                  transporte"
            />
          </CinematicStaggeredRevealItem>

          {state.error && (
            <CinematicStaggeredRevealItem index={1} isVisible={guestsInView}>
              <Notice tone="error">{state.error}</Notice>
            </CinematicStaggeredRevealItem>
          )}

          {feedback && (
            <CinematicStaggeredRevealItem index={1} isVisible={guestsInView}>
              <Notice>{feedback}</Notice>
            </CinematicStaggeredRevealItem>
          )}

          <CinematicStaggeredRevealItem index={2} isVisible={guestsInView}>
            <FiltersCard
              filter={filter}
              onFilterChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
              onQueryChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              query={query}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
            <section className="premium-card">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="section-eyebrow mb-2">Invitados</p>
                  <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                    Confirmaciones
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                    {visibleRows.length} de {rows.length} invitados visibles
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!rows.length}
                    onClick={() => downloadCsv(rows)}
                    type="button"
                  >
                    <Download size={16} strokeWidth={1.8} />
                    Exportar
                  </button>

                  <button
                    className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={state.loading}
                    onClick={loadGuests}
                    type="button"
                  >
                    <RefreshCw
                      className={state.loading ? "animate-spin" : ""}
                      size={16}
                      strokeWidth={1.8}
                    />
                    Actualizar
                  </button>

                  <button
                    className="btn-primary gap-2"
                    onClick={() => setEditingGroup(createDraftGroup())}
                    type="button"
                  >
                    <Plus size={16} strokeWidth={1.8} />
                    Crear
                  </button>
                </div>
              </div>

              {state.loading ? (
                <GuestsSkeleton />
              ) : (
                <>
                  <DesktopTable
                    onDelete={setDeleteTarget}
                    onEdit={(group) => setEditingGroup(createDraftGroup(group))}
                    rows={pagedRows}
                  />

                  <MobileList
                    onDelete={setDeleteTarget}
                    onEdit={(group) => setEditingGroup(createDraftGroup(group))}
                    rows={pagedRows}
                  />

                  {!visibleRows.length && (
                    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
                      <UsersRound
                        className="mx-auto text-[var(--color-accent-dark)]"
                        size={28}
                        strokeWidth={1.7}
                      />
                      <p className="mt-4 font-serif text-3xl text-[var(--color-accent-dark)]">
                        Sin resultados
                      </p>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
                        Prueba con otra busqueda o cambia el filtro
                        seleccionado.
                      </p>
                    </div>
                  )}

                  <Pagination
                    page={page}
                    total={visibleRows.length}
                    totalPages={totalPages}
                    onNext={() =>
                      setPage((current) => Math.min(current + 1, totalPages))
                    }
                    onPrev={() =>
                      setPage((current) => Math.max(current - 1, 1))
                    }
                  />
                </>
              )}
            </section>
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      {editingGroup && (
        <GroupEditor
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          group={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteGroup}
        />
      )}
    </CinematicPage>
  );
}

function FiltersCard({ filter, onFilterChange, onQueryChange, query }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-4">Filtros</p>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <Label>Busqueda</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Email, telefono, nombre o apellidos"
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>Mostrar</Label>
          <div className="relative">
            <select
              className={`${inputClassName} appearance-none bg-white pr-11`}
              onChange={(event) => onFilterChange(event.target.value)}
              value={filter}
            >
              {filters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopTable({ onDelete, onEdit, rows }) {
  return (
    <div className="hidden overflow-x-auto rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 md:block">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <th className="px-5 py-4 font-medium">Invitado</th>
            <th className="px-5 py-4 font-medium">Contacto</th>
            <th className="px-5 py-4 font-medium">Alergias</th>
            <th className="px-5 py-4 font-medium">Transporte</th>
            <th className="px-5 py-4 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className="border-b border-[var(--color-border)] last:border-b-0"
              key={row.rowId}
            >
              <td className="px-5 py-4">
                <p className="font-medium text-[var(--color-accent-dark)]">
                  {row.fullName}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Grupo de {row.groupSize}
                </p>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                <p>{row.email || "-"}</p>
                <p className="mt-1">{row.phone || "-"}</p>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                {row.allergyText}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                <p>Ida: {row.outboundBus || "No"}</p>
                <p className="mt-1">Vuelta: {row.returnBus || "No"}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <IconButton label="Editar" onClick={() => onEdit(row.group)}>
                    <Pencil size={16} strokeWidth={1.8} />
                  </IconButton>
                  <IconButton
                    label="Eliminar"
                    onClick={() => onDelete(row.group)}
                    tone="danger"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileList({ onDelete, onEdit, rows }) {
  return (
    <div className="space-y-4 md:hidden">
      {rows.map((row) => (
        <article
          className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4"
          key={row.rowId}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
                {row.fullName}
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {row.email || "-"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {row.phone || "-"}
              </p>
            </div>

            <div className="flex gap-2">
              <IconButton label="Editar" onClick={() => onEdit(row.group)}>
                <Pencil size={16} strokeWidth={1.8} />
              </IconButton>
              <IconButton
                label="Eliminar"
                onClick={() => onDelete(row.group)}
                tone="danger"
              >
                <Trash2 size={16} strokeWidth={1.8} />
              </IconButton>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-[var(--color-muted)]">
            <InfoLine label="Alergias" value={row.allergyText} />
            <InfoLine label="Ida" value={row.outboundBus || "No"} />
            <InfoLine label="Vuelta" value={row.returnBus || "No"} />
          </div>
        </article>
      ))}
    </div>
  );
}

function GroupEditor({ group, onClose, onSave }) {
  const [draft, setDraft] = useState(group);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateContact = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      groupId: field === "email" ? value : current.groupId,
    }));
  };

  const updateGuest = (index, field, value) => {
    setDraft((current) => {
      const guests = [...current.guests];

      if (field === "allergies") {
        const allergies = guests[index].allergies || [];
        const exists = allergies.includes(value);

        guests[index] = {
          ...guests[index],
          allergies: exists
            ? allergies.filter((item) => item !== value)
            : [...allergies, value],
        };
      } else {
        guests[index] = {
          ...guests[index],
          [field]: value,
        };
      }

      return {
        ...current,
        guests,
      };
    });
  };

  const addGuest = () => {
    setDraft((current) => {
      if (current.guests.length >= MAX_GUESTS) return current;

      return {
        ...current,
        guests: [...current.guests, createEmptyGuest()],
      };
    });
  };

  const removeGuest = (index) => {
    setDraft((current) => {
      if (current.guests.length === 1) return current;

      return {
        ...current,
        guests: current.guests.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateGroup(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(45,51,44,0.28)] px-4 py-4 backdrop-blur-sm sm:items-center">
      <form
        className="premium-card max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto p-5 sm:p-7"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Confirmacion</p>
            <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
              Editar grupo
            </h2>
          </div>

          <IconButton label="Cerrar" onClick={onClose}>
            <X size={17} strokeWidth={1.8} />
          </IconButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Email</Label>
            <input
              className={inputClassName}
              onChange={(event) => updateContact("email", event.target.value)}
              type="email"
              value={draft.email}
            />
          </div>

          <div>
            <Label>Telefono</Label>
            <input
              className={inputClassName}
              onChange={(event) => updateContact("phone", event.target.value)}
              type="tel"
              value={draft.phone}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {draft.guests.map((guest, index) => (
            <div
              className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4"
              key={index}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="font-serif text-3xl text-[var(--color-accent-dark)]">
                  Invitado {index + 1}
                </p>

                {draft.guests.length > 1 && (
                  <IconButton
                    label="Quitar invitado"
                    onClick={() => removeGuest(index)}
                    tone="danger"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </IconButton>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nombre</Label>
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateGuest(index, "name", event.target.value)
                    }
                    value={guest.name}
                  />
                </div>

                <div>
                  <Label>Apellidos</Label>
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateGuest(index, "lastname", event.target.value)
                    }
                    value={guest.lastname}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Alergias</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const checked = guest.allergies?.includes(allergy);

                    return (
                      <label
                        className={`flex cursor-pointer items-center justify-center rounded-2xl border px-3 py-3 text-sm transition ${
                          checked
                            ? "border-[var(--color-accent-dark)] bg-[var(--color-accent-dark)] text-white"
                            : "border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 text-[var(--color-muted)]"
                        }`}
                        key={allergy}
                      >
                        <input
                          checked={checked}
                          className="hidden"
                          onChange={() =>
                            updateGuest(index, "allergies", allergy)
                          }
                          type="checkbox"
                        />
                        {allergy}
                      </label>
                    );
                  })}
                </div>

                <textarea
                  className={`${inputClassName} mt-3 resize-none`}
                  onChange={(event) =>
                    updateGuest(index, "otherAllergies", event.target.value)
                  }
                  placeholder="Otras alergias"
                  rows={2}
                  value={guest.otherAllergies}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Bus ida</Label>
                  <select
                    className={`${inputClassName} bg-white`}
                    onChange={(event) =>
                      updateGuest(index, "outboundBus", event.target.value)
                    }
                    value={guest.outboundBus || "No"}
                  >
                    {OUTBOUND_BUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Bus vuelta</Label>
                  <select
                    className={`${inputClassName} bg-white`}
                    onChange={(event) =>
                      updateGuest(index, "returnBus", event.target.value)
                    }
                    value={guest.returnBus || "No"}
                  >
                    {RETURN_BUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <Label>Comentarios</Label>
                <textarea
                  className={`${inputClassName} resize-none`}
                  onChange={(event) =>
                    updateGuest(index, "comments", event.target.value)
                  }
                  rows={3}
                  value={guest.comments}
                />
              </div>
            </div>
          ))}
        </div>

        <FieldError>{error}</FieldError>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={draft.guests.length >= MAX_GUESTS || saving}
            onClick={addGuest}
            type="button"
          >
            <Plus size={16} strokeWidth={1.8} />
            Invitado
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="btn-secondary"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function DeleteDialog({ group, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(45,51,44,0.28)] px-4 py-4 backdrop-blur-sm">
      <div className="premium-card w-full max-w-md text-center">
        <AlertTriangle
          className="mx-auto text-red-500"
          size={30}
          strokeWidth={1.7}
        />
        <h2 className="mt-4 font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
          Eliminar confirmacion
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          Se eliminara el grupo asociado a {group.email || group.groupId}. Esta
          accion no se puede deshacer desde el panel.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="btn-secondary flex-1"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="btn-primary flex-1 bg-red-500"
            onClick={onConfirm}
            type="button"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ onNext, onPrev, page, total, totalPages }) {
  return (
    <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
      <p>
        {total} resultados · pagina {page} de {totalPages}
      </p>

      <div className="flex gap-3">
        <button
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page === 1}
          onClick={onPrev}
          type="button"
        >
          Anterior
        </button>
        <button
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page === totalPages}
          onClick={onNext}
          type="button"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function IconButton({ children, label, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
      : "border-[var(--color-border-strong)] bg-white/55 text-[var(--color-accent-dark)] hover:bg-white";

  return (
    <button
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${toneClass}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white/40 p-3">
      <span className="text-[var(--color-accent)]">{label}</span>
      <span className="text-right text-[var(--color-accent-dark)]">
        {value}
      </span>
    </div>
  );
}

function Notice({ children, tone = "success" }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50/70 text-red-700"
      : "border-[var(--color-border)] bg-white/55 text-[var(--color-accent-dark)]";

  return (
    <div className={`premium-card mb-5 text-sm leading-relaxed ${toneClass}`}>
      {children}
    </div>
  );
}

function GuestsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="min-h-24 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5"
          key={index}
        >
          <div className="h-4 w-40 rounded-full bg-[var(--color-border)]" />
          <div className="mt-4 h-3 w-64 max-w-full rounded-full bg-[var(--color-border)]" />
        </div>
      ))}
    </div>
  );
}

function normalizeGroupsResponse(response) {
  const groups = Array.isArray(response)
    ? response
    : response?.groups || response?.data || response?.items || [];

  return groups.map((group) => ({
    groupId: group.groupId || group.email || "",
    email: group.email || group.groupId || "",
    phone: group.phone || "",
    guests: Array.isArray(group.guests) ? group.guests : [],
  }));
}

function buildGuestRows(groups) {
  return groups.flatMap((group) =>
    group.guests.map((guest, guestIndex) => {
      const allergyText = buildAllergyText(guest);

      return {
        allergyText,
        email: group.email,
        fullName: `${guest.name || "Invitado"} ${guest.lastname || ""}`.trim(),
        group,
        groupId: group.groupId || group.email,
        groupSize: group.guests.length,
        guest,
        guestIndex,
        hasAllergies: allergyText !== "No",
        needsReview: hasReview(guest),
        outboundBus: guest.outboundBus,
        phone: group.phone,
        returnBus: guest.returnBus,
        rowId: `${group.groupId || group.email}-${guestIndex}`,
        usesBus: hasBus(guest),
      };
    }),
  );
}

function filterRows(rows, query, filter) {
  const normalizedQuery = normalizeText(query);

  return rows.filter((row) => {
    const matchesQuery =
      !normalizedQuery ||
      normalizeText(
        `${row.email} ${row.phone} ${row.guest.name} ${row.guest.lastname}`,
      ).includes(normalizedQuery);
    const matchesFilter =
      filter === "all" ||
      (filter === "allergies" && row.hasAllergies) ||
      (filter === "bus" && row.usesBus) ||
      (filter === "review" && row.needsReview);

    return matchesQuery && matchesFilter;
  });
}

function createDraftGroup(group) {
  if (!group) {
    return {
      groupId: "",
      email: "",
      phone: "",
      guests: [createEmptyGuest()],
    };
  }

  return {
    groupId: group.groupId || group.email || "",
    email: group.email || "",
    phone: group.phone || "",
    guests: group.guests.map((guest) => ({
      ...createEmptyGuest(),
      ...guest,
      allergies: Array.isArray(guest.allergies) ? guest.allergies : [],
      busNeeded: hasBus(guest),
    })),
  };
}

function validateGroup(group) {
  if (!group.email.trim()) return "El email es obligatorio.";
  if (!group.phone.trim()) return "El telefono es obligatorio.";
  if (!group.guests.length) return "Debe haber al menos un invitado.";

  const invalidGuest = group.guests.find(
    (guest) => !guest.name.trim() || !guest.lastname.trim(),
  );

  if (invalidGuest) return "Todos los invitados necesitan nombre y apellidos.";

  return "";
}

function buildAllergyText(guest) {
  const values = [...(guest.allergies || [])];

  if (guest.otherAllergies?.trim()) {
    values.push(guest.otherAllergies.trim());
  }

  return values.length ? values.join(", ") : "No";
}

function hasBus(guest) {
  return Boolean(
    guest.busNeeded ||
    (guest.outboundBus && guest.outboundBus !== "No") ||
    (guest.returnBus && guest.returnBus !== "No"),
  );
}

function hasReview(guest) {
  return Boolean(
    guest.otherAllergies?.trim() ||
    guest.comments?.trim() ||
    (hasBus(guest) && (!guest.outboundBus || !guest.returnBus)),
  );
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function downloadCsv(rows) {
  const headers = [
    "email",
    "telefono",
    "nombre",
    "apellidos",
    "alergias",
    "bus_ida",
    "bus_vuelta",
    "comentarios",
  ];
  const lines = rows.map((row) =>
    [
      row.email,
      row.phone,
      row.guest.name,
      row.guest.lastname,
      row.allergyText,
      row.outboundBus || "No",
      row.returnBus || "No",
      row.guest.comments || "",
    ]
      .map(escapeCsvValue)
      .join(","),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "invitados.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
