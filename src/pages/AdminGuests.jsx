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
  useState,
} from "react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  Beef,
  BusFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Fish,
  MessageCircle,
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
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import TableGuestCard from "../components/admin/TableGuestCard";
import RsvpForm from "../forms/RsvpForm";
import { MAX_GUESTS } from "../constants/rsvp";
import { Confirmation } from "../models";
import {
  deleteAdminGroup,
  findAllGroups,
  saveAdminGroup,
} from "../services/rsvpService";
import { inputClassName, Label } from "../components/rsvp/FormPrimitives";
import useSpinner from "../hooks/useSpinner";
import useViewportScrollLock from "../hooks/useViewportScrollLock";
import { normalizeAdminGroups } from "../utils/rsvpGroups";
import { validateRsvpForm } from "../utils/rsvpValidation";

const desktopPageSize = 8;
const mobilePageSize = 1;
const pageDataSwapDelay = 680;
const pageRevealDelay = 160;
const mobilePageHeightLockDelay = 560;
const mobileGroupNameBaseFontSize = 30;
const mobileGroupNameMinFontSize = 10;
const ADMIN_DEFAULT_EMAIL = "admin@admin.com";
const ADMIN_DEFAULT_PHONE = "666666666";
const filters = [
  { value: "all", label: "Todos" },
  { value: "allergies", label: "Con alergias" },
  { value: "bus", label: "Con bus" },
  { value: "comments", label: "Con notas" },
];

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};

const createInitialPopup = () => ({
  closeText: "Cerrar",
  closeTo: null,
  eyebrow: "",
  message: "",
  open: false,
  title: "",
  type: "success",
});

const createAdminPopup = ({ message, title, type = "success" }) => ({
  closeText: "Cerrar",
  closeTo: null,
  eyebrow: type === "success" ? "Confirmación" : "Aviso",
  message,
  open: true,
  title,
  type,
});

export default function AdminGuests() {
  const spinner = useSpinner();
  const guestsRef = useRef(null);
  const tableCardRef = useRef(null);
  const tableStartRef = useRef(null);
  const pageLoadingTimeoutRef = useRef(null);
  const pageRevealTimeoutRef = useRef(null);
  const pageScrollStartFrameRef = useRef(null);
  const pageScrollCancelRef = useRef(null);
  const initialLoadStartedRef = useRef(false);
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
  const [pageDirection, setPageDirection] = useState(1);
  const [isMobileList, setIsMobileList] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageLoadingMinHeight, setPageLoadingMinHeight] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popup, setPopup] = useState(createInitialPopup);

  const loadGuests = useCallback(async ({ showLoading = true } = {}) => {
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
          "No se pudieron cargar los invitados. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
      });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (initialLoadStartedRef.current) return;

    initialLoadStartedRef.current = true;

    const timeoutId = window.setTimeout(() => {
      loadGuests({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadGuests]);

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

  const rows = useMemo(
    () => Confirmation.toAdminRows(state.groups),
    [state.groups],
  );
  const visibleRows = useMemo(
    () => Confirmation.filterAdminRows(rows, query, filter),
    [filter, query, rows],
  );
  const pageSize = isMobileList ? mobilePageSize : desktopPageSize;
  const totalPages = Math.max(Math.ceil(visibleRows.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const pagedGroupCount = pagedRows.length;
  const pagedGuestCount = pagedRows.reduce(
    (total, row) => total + row.groupSize,
    0,
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

    const tableElement = tableStartRef.current;
    const tableRect = tableElement?.getBoundingClientRect();
    const tableHeight = tableRect?.height || null;
    const direction = clampedPage > currentPage ? 1 : -1;

    cancelPageLoading();

    if (isMobileList) {
      setPageLoadingMinHeight(tableHeight);
      setPageDirection(direction);
      setPage(clampedPage);
      pageRevealTimeoutRef.current = window.setTimeout(() => {
        setPageLoadingMinHeight(null);
        pageRevealTimeoutRef.current = null;
      }, mobilePageHeightLockDelay);

      return;
    }

    setPageDirection(direction);
    setPageLoadingMinHeight(tableHeight);
    setPageLoading(true);

    pageLoadingTimeoutRef.current = window.setTimeout(() => {
      setPage(clampedPage);
      pageLoadingTimeoutRef.current = null;

      pageRevealTimeoutRef.current = window.setTimeout(() => {
        setPageLoading(false);
        setPageLoadingMinHeight(null);
        pageRevealTimeoutRef.current = null;
      }, pageRevealDelay);
    }, pageDataSwapDelay);
  };

  const closePopup = () => {
    setPopup((current) => ({
      ...current,
      open: false,
    }));
  };

  const handleSaveGroup = async (group) => {
    const isCreation = !editingGroup?.groupName;

    try {
      spinner.show(
        isCreation ? "Creando confirmación..." : "Guardando confirmación...",
      );

      await saveAdminGroup({
        group: normalizeAdminGroupBeforeSave(group, { isCreation }),
        method: isCreation ? "POST" : "PUT",
        password: ADMIN_PASSWORD,
      });

      setEditingGroup(null);
      await loadGuests({ showLoading: false });
      setPopup(
        createAdminPopup({
          message: isCreation
            ? "La confirmación se ha creado correctamente."
            : "La confirmación se ha actualizado correctamente.",
          title: isCreation ? "Confirmación creada" : "Cambios guardados",
        }),
      );
    } catch (error) {
      console.error(error);
      setPopup(
        createAdminPopup({
          message:
            "No se ha podido guardar la confirmación. Revisa los datos e inténtalo de nuevo.",
          title: "Ha ocurrido un problema",
          type: "error",
        }),
      );
    } finally {
      spinner.hide();
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;

    try {
      spinner.show("Eliminando confirmación...");

      await deleteAdminGroup({
        groupName: deleteTarget.groupName,
        password: ADMIN_PASSWORD,
      });

      setDeleteTarget(null);
      await loadGuests({ showLoading: false });
      setPopup(
        createAdminPopup({
          message: "La confirmación se ha eliminado correctamente.",
          title: "Confirmación eliminada",
        }),
      );
    } catch (error) {
      console.error(error);
      setPopup(
        createAdminPopup({
          message:
            "No se ha podido eliminar la confirmación. Inténtalo de nuevo en unos minutos.",
          title: "Ha ocurrido un problema",
          type: "error",
        }),
      );
    } finally {
      spinner.hide();
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <CinematicSection
        className="surface-soft"
        innerClassName="max-w-7xl py-6"
        reveal={false}
      >
        <div ref={guestsRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={guestsInView}>
            <HeaderSection
              eyebrow="Panel privado"
              title="Lista de invitados"
              titleAs="h1"
              text="Gestión de confirmaciones, datos de contacto, alergias y
                  transporte"
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={2} isVisible={guestsInView}>
            <FiltersCard
              filter={filter}
              onFilterChange={(value) => {
                cancelPageLoading();
                setFilter(value);
                setPage(1);
              }}
              onQueryChange={(value) => {
                cancelPageLoading();
                setQuery(value);
                setPage(1);
              }}
              query={query}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
            <section className="premium-card" ref={tableCardRef}>
              <div className="mb-5">
                <div>
                  <p className="section-eyebrow mb-2">Invitados</p>
                  <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                    Confirmaciones
                  </h2>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                      {pagedGroupCount}{" "}
                      {pagedGroupCount === 1 ? "grupo" : "grupos"} en esta
                      página · {pagedGuestCount}{" "}
                      {pagedGuestCount === 1 ? "persona" : "personas"}
                    </p>

                    <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex sm:justify-end">
                      <IconButton
                        className="w-full"
                        disabled={!rows.length}
                        label="Exportar"
                        tone="terciary"
                        onClick={() => downloadCsv(rows)}
                      >
                        <Download size={16} strokeWidth={1.8} />
                      </IconButton>

                      <IconButton
                        className="w-full"
                        disabled={state.loading}
                        label="Actualizar"
                        tone="secondary"
                        onClick={loadGuests}
                      >
                        <RefreshCw
                          className={state.loading ? "animate-spin" : ""}
                          size={16}
                          strokeWidth={1.8}
                        />
                      </IconButton>

                      <IconButton
                        className="w-full"
                        label="Crear"
                        tone="primary"
                        onClick={() => setEditingGroup(createDraftGroup())}
                      >
                        <Plus size={18} strokeWidth={2.4} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={tableStartRef}
                style={
                  pageLoadingMinHeight
                    ? { minHeight: `${pageLoadingMinHeight}px` }
                    : undefined
                }
              >
                {state.loading ? (
                  <GuestsSkeleton />
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
                        <DesktopTable
                          onDelete={setDeleteTarget}
                          onEdit={(group) =>
                            setEditingGroup(createDraftGroup(group))
                          }
                          rows={pagedRows}
                        />

                        <MobileList
                          direction={pageDirection}
                          onDelete={setDeleteTarget}
                          onEdit={(group) =>
                            setEditingGroup(createDraftGroup(group))
                          }
                          page={currentPage}
                          rows={pagedRows}
                          allRows={visibleRows}
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
                              Prueba con otra búsqueda o cambia el filtro
                              seleccionado.
                            </p>
                          </div>
                        )}
                      </div>

                      {pageLoading && (
                        <div className="absolute inset-x-0 top-0 z-10">
                          <GuestsSkeleton />
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
            </section>
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      {editingGroup && (
        <GroupEditor
          group={editingGroup}
          isCreation={!editingGroup.groupName}
          onClose={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          message={
            <>
              Se eliminará el grupo asociado a{" "}
              {deleteTarget.groupName || deleteTarget.email}. Esta acción no se
              puede deshacer desde el panel.
            </>
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteGroup}
          title="Eliminar confirmación"
        />
      )}

      <StatusDialog
        closeText={popup.closeText}
        closeTo={popup.closeTo}
        eyebrow={popup.eyebrow}
        message={popup.message}
        onClose={closePopup}
        open={popup.open}
        title={popup.title}
        type={popup.type}
      />

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
              placeholder="Email, teléfono, grupo, nombre o apellidos"
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
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <th className="px-5 py-4 font-medium">Grupo</th>
            <th className="px-5 py-4 font-medium">Contacto</th>
            <th className="px-5 py-4 font-medium">Menú</th>
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
                  {row.groupName || "Grupo sin nombre"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {row.groupSize} {row.groupSize === 1 ? "persona" : "personas"}
                </p>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                <p>{row.email || "-"}</p>
                <p className="mt-1">{row.phone || "-"}</p>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                <div>Pescado: {row.fishText}</div>
                <div className="mt-1">Carne: {row.meatText}</div>
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                {row.allergyText}
              </td>
              <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                {row.transportText}
              </td>
              <td className="px-5 py-4">
                <div className="flex min-w-10 flex-wrap justify-end gap-2">
                  <IconButton
                    label="Eliminar"
                    onClick={() => onDelete(row.group)}
                    tone="danger"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </IconButton>
                  <IconButton
                    label="Editar"
                    onClick={() => onEdit(row.group)}
                    tone="primary"
                  >
                    <Pencil size={16} strokeWidth={1.8} />
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

function MobileList({ direction, onDelete, onEdit, page, rows, allRows }) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef(null);
  const groupNameRefs = useRef([]);
  const measureRefs = useRef([]);
  const [cardMinHeight, setCardMinHeight] = useState(null);
  const [groupNameFontSize, setGroupNameFontSize] = useState(
    mobileGroupNameBaseFontSize,
  );

  useLayoutEffect(() => {
    const updateGroupNameFontSize = () => {
      const nodes = groupNameRefs.current.filter(Boolean);

      if (!nodes.length) return;

      let nextFontSize = mobileGroupNameBaseFontSize;

      nodes.forEach((node) => {
        node.style.fontSize = `${mobileGroupNameBaseFontSize}px`;
      });

      nodes.forEach((node) => {
        const availableWidth = node.clientWidth;
        const neededWidth = node.scrollWidth;

        if (!availableWidth || neededWidth <= availableWidth) return;

        nextFontSize = Math.min(
          nextFontSize,
          (availableWidth / neededWidth) * mobileGroupNameBaseFontSize,
        );
      });

      nodes.forEach((node) => {
        node.style.fontSize = "";
      });

      const clampedFontSize = Math.max(
        mobileGroupNameMinFontSize,
        Math.min(mobileGroupNameBaseFontSize, nextFontSize),
      );

      setGroupNameFontSize((current) =>
        Math.abs(current - clampedFontSize) < 0.1 ? current : clampedFontSize,
      );
    };

    groupNameRefs.current.length = rows.length;
    updateGroupNameFontSize();
    window.addEventListener("resize", updateGroupNameFontSize);
    document.fonts?.ready?.then(updateGroupNameFontSize);

    return () => {
      window.removeEventListener("resize", updateGroupNameFontSize);
    };
  }, [rows]);

  useLayoutEffect(() => {
    if (!allRows?.length) return undefined;

    const updateCardHeight = () => {
      const maxHeight = allRows.reduce((max, _, index) => {
        const node = measureRefs.current[index];
        if (!node) return max;

        return Math.max(max, Math.ceil(node.getBoundingClientRect().height));
      }, 0);

      setCardMinHeight((currentHeight) => {
        if (!maxHeight) return currentHeight;
        return Math.abs((currentHeight || 0) - maxHeight) < 1
          ? currentHeight
          : maxHeight;
      });
    };

    updateCardHeight();
    window.addEventListener("resize", updateCardHeight);

    return () => window.removeEventListener("resize", updateCardHeight);
  }, [allRows]);

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
      style={
        cardMinHeight
          ? { minHeight: `${cardMinHeight}px`, height: `${cardMinHeight}px` }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[-1] h-auto w-full opacity-0"
      >
        {allRows?.map((row, index) => (
          <div
            key={`measure-${row.rowId || index}`}
            ref={(node) => {
              measureRefs.current[index] = node;
            }}
          >
            <AdminGuestConfirmationCard
              onDelete={() => {}}
              onEdit={() => {}}
              row={row}
              titleStyle={{ fontSize: `${groupNameFontSize}px` }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence custom={direction} initial={false}>
        {rows.map((row, index) => (
          <motion.div
            animate="center"
            className="absolute inset-x-0 top-0"
            custom={direction}
            exit="exit"
            initial="enter"
            key={`${row.rowId}-${page}`}
            ref={cardRef}
            transition={{
              duration: reduceMotion ? 0.18 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            variants={variants}
          >
            <AdminGuestConfirmationCard
              onDelete={onDelete}
              onEdit={onEdit}
              row={row}
              titleRef={(node) => {
                groupNameRefs.current[index] = node;
              }}
              titleStyle={{ fontSize: `${groupNameFontSize}px` }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function MobileRowActions({ onDelete, onEdit }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-2">
      {onDelete && (
        <IconButton
          className="w-full min-w-0 basis-0 !shrink !gap-1.5 !px-3"
          icon={<Trash2 size={16} strokeWidth={1.8} />}
          label="Eliminar"
          onClick={onDelete}
          tone="danger"
        >
          Eliminar
        </IconButton>
      )}
      {onEdit && (
        <IconButton
          className="w-full min-w-0 basis-0 !shrink !gap-1.5 !px-3"
          icon={<Pencil size={16} strokeWidth={1.8} />}
          label="Editar"
          onClick={onEdit}
          tone="primary"
        >
          Editar
        </IconButton>
      )}
    </div>
  );
}

function AdminGuestConfirmationCard({
  onDelete,
  onEdit,
  row,
  titleRef,
  titleStyle,
}) {
  return (
    <div className="grid gap-3">
      {(onDelete || onEdit) && (
        <MobileRowActions
          onDelete={onDelete ? () => onDelete(row.group) : undefined}
          onEdit={onEdit ? () => onEdit(row.group) : undefined}
        />
      )}

      <TableGuestCard
        decorativeText={row.groupSize}
        eyebrow={`${row.groupSize} ${row.groupSize === 1 ? "persona" : "personas"}`}
        guest={{
          email: row.email,
          phone: row.phone,
        }}
        title={row.groupName || "Grupo sin nombre"}
        titleRef={titleRef}
        titleStyle={titleStyle}
      >
        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
          <div className="grid gap-3 text-sm text-[var(--color-muted)]">
            <InfoLine
              icon={<Fish size={15} strokeWidth={1.8} />}
              label="Pescado"
              value={row.fishText}
            />
            <InfoLine
              icon={<Beef size={15} strokeWidth={1.8} />}
              label="Carne"
              value={row.meatText}
            />
            <InfoLine
              icon={<AlertTriangle size={15} strokeWidth={1.8} />}
              label="Alergias"
              value={row.allergyText}
            />
            <InfoLine
              icon={<BusFront size={15} strokeWidth={1.8} />}
              label="Transporte"
              value={row.transportText}
            />
            <InfoLine
              icon={<MessageCircle size={15} strokeWidth={1.8} />}
              label="Notas"
              value={row.commentsCountText}
            />
          </div>
        </div>
      </TableGuestCard>
    </div>
  );
}

function GroupEditor({ group, isCreation, onClose, onSave }) {
  const [draft, setDraft] = useState(group);
  const [errors, setErrors] = useState({});
  const [validationPopupOpen, setValidationPopupOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const renderFormItem = (index, children) => (
    <CinematicStaggeredRevealItem index={index} isVisible key={index}>
      {children}
    </CinematicStaggeredRevealItem>
  );

  useViewportScrollLock(true);

  const updateContact = (field, value) => {
    setDraft((current) =>
      Confirmation.withUpdatedContact(current, field, value),
    );
  };

  const updateGuest = (index, field, value) => {
    setDraft((current) =>
      Confirmation.withUpdatedGuest(current, index, field, value),
    );
  };

  const addGuest = () => {
    setDraft((current) =>
      Confirmation.withAddedGuest(current, { maxGuests: MAX_GUESTS }),
    );
  };

  const removeGuest = (index) => {
    setDraft((current) => Confirmation.withRemovedGuest(current, index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const groupToSave = normalizeAdminGroupBeforeSave(draft, { isCreation });
    const validationErrors = validateRsvpForm({
      contact: groupToSave,
      guests: groupToSave.guests,
    });

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setValidationPopupOpen(true);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await onSave(groupToSave);
    } finally {
      setSaving(false);
    }
  };

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby="group-editor-title"
        aria-modal="true"
        className="premium-card max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto p-5 sm:max-h-[calc(100dvh-3rem)] sm:p-7"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Confirmación</p>
            <h2
              className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]"
              id="group-editor-title"
            >
              Editar grupo
            </h2>
          </div>

          <IconButton label="Cerrar" onClick={onClose}>
            <X size={17} strokeWidth={1.8} />
          </IconButton>
        </div>

        <RsvpForm
          addText="Invitado"
          cancelText="Cancelar"
          contact={draft}
          deleteContextText="editor"
          disableContactFields={{ groupName: !isCreation }}
          errors={errors}
          guests={draft.guests}
          loading={saving}
          onAddGuest={addGuest}
          onCancel={onClose}
          onContactChange={updateContact}
          onGuestChange={updateGuest}
          onRemoveGuest={removeGuest}
          onSubmit={handleSubmit}
          renderItem={renderFormItem}
          submitText="Guardar"
          variant="admin"
        />

        <StatusDialog
          closeText="Cerrar"
          eyebrow="Aviso"
          message="Hay campos obligatorios o con formato incorrecto. Corrígelos antes de guardar la confirmación."
          onClose={() => setValidationPopupOpen(false)}
          open={validationPopupOpen}
          title="Revisa la confirmación"
          type="error"
        />
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function Pagination({ isMobileList, onNext, onPrev, page, totalPages }) {
  return (
    <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center">
        {isMobileList ? "Confirmación" : "Página"} {page} de {totalPages}
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

function InfoLine({ icon, label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white/40 p-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-[var(--color-accent)]">
        {icon && (
          <span className="shrink-0 text-[var(--color-accent-dark)]">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </span>
      <span className="text-right text-[var(--color-accent-dark)]">
        {value}
      </span>
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

function createDraftGroup(group) {
  if (!group) {
    return Confirmation.createEmpty();
  }

  return Confirmation.normalize(group);
}

function normalizeAdminGroupBeforeSave(group, { isCreation }) {
  const confirmation = Confirmation.normalize(group);

  if (!isCreation) return confirmation;

  return Confirmation.normalize({
    ...confirmation,
    email: confirmation.email.trim() || ADMIN_DEFAULT_EMAIL,
    phone: confirmation.phone.trim() || ADMIN_DEFAULT_PHONE,
  });
}

function downloadCsv(rows) {
  const headers = [
    "email",
    "teléfono",
    "nombre_grupo",
    "total_invitados",
    "mesa_menu_asiento",
    "alergias",
    "transporte",
    "notas",
  ];
  const lines = rows.map((row) =>
    [
      row.email,
      row.phone,
      row.groupName,
      row.groupSize,
      row.assignmentText,
      row.allergyText,
      row.transportText,
      row.commentsText,
    ]
      .map(escapeCsvValue)
      .join(","),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "grupos-invitados.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
