import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useBeforeUnload, useBlocker } from "react-router-dom";
import {
  AlertTriangle,
  Beef,
  BusFront,
  ChevronDown,
  Download,
  Fish,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  Undo2,
  X,
  Utensils,
  UsersRound,
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
import Card from "../components/admin/Card";
import CardActions from "../components/admin/CardActions";
import CardGrid from "../components/admin/CardGrid";
import EditorDialog from "../components/admin/EditorDialog";
import AdminTableSection from "../components/admin/AdminTableSection";
import CardListSkeleton from "../components/ui/CardListSkeleton";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import Chip from "../components/ui/Chip";
import RsvpForm from "../forms/RsvpForm";
import {
  COMMON_ALLERGIES,
  GUEST_MENU_OPTIONS,
  MAX_GUESTS,
} from "../constants/rsvp";
import { Confirmation, Guest } from "../models";
import { deleteAdminGroup, saveAdminGroup } from "../services/rsvpService";
import {
  loadAdminDataOnce,
  setAdminGroups,
} from "../services/adminDataStore";
import { inputClassName, Label } from "../components/rsvp/FormPrimitives";
import useSpinner from "../hooks/useSpinner";
import useViewportScrollLock from "../hooks/useViewportScrollLock";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import { downloadCsv as downloadGenericCsv } from "../utils/csvExport";
import {
  createDraftGroup,
  normalizeAdminGroupBeforeSave,
} from "../utils/drafts";
import { getEmailHref, getPhoneHref } from "../utils/contactLinks";
import { adminContent } from "../constants/adminContent";
import { normalizeAdminGroups } from "../utils/rsvpGroups";
import { validateRsvpForm } from "../utils/rsvpValidation";

const desktopPageSize = 8;
const mobilePageSize = 1;
const filters = adminContent.guests.filters.options;

const emptyState = {
  groups: [],
  loading: true,
  error: "",
};

const createInitialPopup = () => ({
  closeText: adminContent.guests.dialogs.close,
  closeTo: null,
  eyebrow: "",
  message: "",
  open: false,
  title: "",
  type: "success",
});

const createAdminPopup = ({ message, title, type = "success" }) => ({
  closeText: adminContent.guests.dialogs.close,
  closeTo: null,
  eyebrow:
    type === "success"
      ? adminContent.guests.dialogs.successEyebrow
      : adminContent.guests.dialogs.warningEyebrow,
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
  const initialLoadStartedRef = useRef(false);
  const guestsInView = useInView(guestsRef, {
    once: true,
    amount: 0.18,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [state, setState] = useState(emptyState);
  const [savedGroups, setSavedGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingMode, setEditingMode] = useState("full");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popup, setPopup] = useState(createInitialPopup);

  const loadGuests = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await loadAdminDataOnce({ password: ADMIN_PASSWORD });

      const groups = normalizeAdminGroups(response.groups);

      setSavedGroups(groups);
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
        error: adminContent.guests.dialogs.loadError,
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

  const rows = useMemo(
    () => Confirmation.toAdminRows(state.groups),
    [state.groups],
  );
  const visibleRows = useMemo(
    () => Confirmation.filterAdminRows(rows, query, filter),
    [filter, query, rows],
  );
  const {
    currentPage,
    isMobileList,
    pagedItems: pagedRows,
    totalPages,
  } = usePagedData({
    desktopPageSize,
    items: visibleRows,
    mobilePageSize,
    page,
  });
  const { cancelPageLoading, handlePageChange, pageDirection } =
    usePageTransition({
      currentPage,
      isMobileList,
      onPageChange: setPage,
      totalPages,
    });
  const effectiveSelectedRowId = pagedRows.some(
    (row) => row.rowId === selectedRowId,
  )
    ? selectedRowId
    : pagedRows[0]?.rowId || "";
  const selectedRow = useMemo(
    () => pagedRows.find((row) => row.rowId === effectiveSelectedRowId) || null,
    [effectiveSelectedRowId, pagedRows],
  );
  const pendingChanges = useMemo(
    () => buildPendingGuestChanges(savedGroups, state.groups),
    [savedGroups, state.groups],
  );
  const hasPendingChanges = pendingChanges.length > 0;

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      hasPendingChanges && currentLocation.pathname !== nextLocation.pathname
    );
  });

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasPendingChanges) return;

        event.preventDefault();
        event.returnValue = "";
      },
      [hasPendingChanges],
    ),
  );

  const closePopup = () => {
    setPopup((current) => ({
      ...current,
      open: false,
    }));
  };

  const applyGroups = useCallback((groups) => {
    const normalizedGroups = setAdminGroups(groups);

    setState({
      groups: normalizedGroups,
      loading: false,
      error: "",
    });

    return normalizedGroups;
  }, []);

  const openGroupEditor = (group, mode = "full") => {
    setEditingMode(mode);
    setEditingGroup(createDraftGroup(group));
  };

  const handleSaveGroup = async (group) => {
    const isCreation = !editingGroup?.groupName;
    const groupToSave = normalizeAdminGroupBeforeSave(group, { isCreation });

    applyGroups(upsertGroupInList(state.groups, groupToSave));
    setEditingGroup(null);
    setPopup(
      createAdminPopup({
        message: adminContent.guests.dialogs.pendingMessage,
        title: adminContent.guests.dialogs.pendingTitle,
      }),
    );
  };

  const handleDeleteGroup = () => {
    if (!deleteTarget) return;

    applyGroups(removeGroupFromList(state.groups, deleteTarget.groupName));
    setDeleteTarget(null);
    setPopup(
      createAdminPopup({
        message: adminContent.guests.dialogs.pendingMessage,
        title: adminContent.guests.dialogs.pendingTitle,
      }),
    );
  };

  const handleSavePendingChanges = async () => {
    if (!hasPendingChanges) return true;

    try {
      spinner.show(adminContent.guests.spinner.saveChanges);

      await persistGuestChanges({
        currentGroups: state.groups,
        savedGroups,
      });

      const normalizedGroups = setAdminGroups(state.groups);
      setSavedGroups(normalizedGroups);
      setState({
        groups: normalizedGroups,
        loading: false,
        error: "",
      });
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.updatedMessage,
          title: adminContent.guests.dialogs.updatedTitle,
        }),
      );
      return true;
    } catch (error) {
      console.error(error);
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.saveError,
          title: adminContent.guests.dialogs.problemTitle,
          type: "error",
        }),
      );
      return false;
    } finally {
      spinner.hide();
    }
  };

  const handleDiscardPendingChanges = useCallback(() => {
    const restoredGroups = setAdminGroups(savedGroups);

    setState({
      groups: restoredGroups,
      loading: false,
      error: "",
    });
    setEditingGroup(null);
    setDeleteTarget(null);

    const restoredRows = Confirmation.toAdminRows(restoredGroups);
    const restoredVisibleRows = Confirmation.filterAdminRows(
      restoredRows,
      query,
      filter,
    );
    const restoredTotalPages = Math.max(
      Math.ceil(
        restoredVisibleRows.length /
          (isMobileList ? mobilePageSize : desktopPageSize),
      ),
      1,
    );

    setPage((current) => Math.min(current, restoredTotalPages));
  }, [filter, isMobileList, query, savedGroups]);

  const handleCancelBlockedNavigation = () => {
    blocker.reset?.();
  };

  const handleConfirmBlockedNavigation = () => {
    handleDiscardPendingChanges();
    blocker.proceed?.();
  };

  const handleSaveAndExitBlockedNavigation = async () => {
    const saved = await handleSavePendingChanges();

    if (saved) {
      blocker.proceed?.();
      return;
    }

    blocker.reset?.();
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      {blocker.state === "blocked" && (
        <UnsavedGuestChangesDialog
          changes={pendingChanges}
          onCancel={handleCancelBlockedNavigation}
          onConfirm={handleConfirmBlockedNavigation}
          onSaveAndExit={handleSaveAndExitBlockedNavigation}
        />
      )}

      <CinematicSection
        className="surface-soft"
        innerClassName="max-w-7xl py-6"
        reveal={false}
      >
        <div ref={guestsRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={guestsInView}>
            <HeaderSection
              eyebrow={adminContent.guests.header.eyebrow}
              title={adminContent.guests.header.title}
              titleAs="h1"
              text={adminContent.guests.header.text}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
            <AdminTableSection
              actions={
                <GuestTableActions
                  hasPendingChanges={hasPendingChanges}
                  loading={state.loading}
                  onCreate={() => openGroupEditor(undefined, "full")}
                  onDelete={() => setDeleteTarget(selectedRow.group)}
                  onDiscard={handleDiscardPendingChanges}
                  onEdit={() => openGroupEditor(selectedRow.group, "group")}
                  onExport={() => downloadGuestsCsv(rows)}
                  onSave={handleSavePendingChanges}
                  rows={rows}
                  saving={spinner.loading}
                  selectedGroup={selectedRow?.group}
                  showText={!isMobileList}
                />
              }
              contentRef={tableStartRef}
              eyebrow={adminContent.guests.list.eyebrow}
              filters={
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
              }
              getKey={(row) => row.rowId}
              isMobileList={isMobileList}
              items={visibleRows}
              loading={state.loading}
              mobilePageLabel={adminContent.guests.list.mobilePageLabel}
              onNextPage={() =>
                handlePageChange(currentPage + 1, tableStartRef.current)
              }
              onPrevPage={() =>
                handlePageChange(currentPage - 1, tableStartRef.current)
              }
              page={currentPage}
              pageDirection={pageDirection}
              pageLabel={adminContent.guests.list.pageLabel}
              pageSize={isMobileList ? mobilePageSize : desktopPageSize}
              renderMeasurePage={(items) => (
                <AdminGuestPage
                  items={items}
                  onEditGuests={() => {}}
                  onSelect={() => {}}
                  selectedRowId={effectiveSelectedRowId}
                />
              )}
              renderPage={(items) => (
                <AdminGuestPage
                  items={items}
                  onEditGuests={(group) => openGroupEditor(group, "guests")}
                  onSelect={(row) => setSelectedRowId(row.rowId)}
                  selectedRowId={effectiveSelectedRowId}
                />
              )}
              sectionRef={tableCardRef}
              skeleton={<CardListSkeleton />}
              title={adminContent.guests.list.title}
              totalPages={totalPages}
            />
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      {editingGroup && (
        <GroupEditor
          group={editingGroup}
          isCreation={!editingGroup.groupName}
          mode={editingMode}
          onClose={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          message={adminContent.guests.dialogs.deleteMessage(
            deleteTarget.groupName || deleteTarget.email,
          )}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteGroup}
          title={adminContent.guests.dialogs.deleteTitle}
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
        eyebrow={adminContent.guests.dialogs.warningEyebrow}
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title={adminContent.guests.dialogs.problemTitle}
        type="error"
      />
    </CinematicPage>
  );
}

function FiltersCard({ filter, onFilterChange, onQueryChange, query }) {
  const selectedFilter = filters.find((item) => item.value === filter);
  const activeFilters = [
    query.trim()
      ? {
          key: "query",
          label: query.trim(),
          onRemove: () => onQueryChange(""),
        }
      : null,
    filter !== "all" && selectedFilter
      ? {
          key: "filter",
          label: selectedFilter.label,
          onRemove: () => onFilterChange("all"),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      className="mb-5"
      title={adminContent.guests.filters.eyebrow}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <Label>{adminContent.guests.filters.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={adminContent.guests.filters.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>{adminContent.guests.filters.showLabel}</Label>
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
    </CollapsiblePanel>
  );
}

function GuestTableActions({
  hasPendingChanges,
  loading,
  onCreate,
  onDelete,
  onDiscard,
  onEdit,
  onExport,
  onSave,
  rows,
  saving,
  selectedGroup,
  showText = true,
}) {
  return (
    <div className="grid w-full gap-3">
      <div className="grid w-full grid-cols-2 gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-3">
        <IconButton
          className="w-full"
          disabled={!hasPendingChanges || loading}
          icon={<Undo2 size={16} strokeWidth={1.8} />}
          label={adminContent.guests.actions.discardChanges}
          onClick={onDiscard}
          showText={showText ? "always" : undefined}
          tone="secondary"
          type="button"
        >
          {showText ? adminContent.guests.actions.discardChanges : undefined}
        </IconButton>

        <IconButton
          className="w-full"
          disabled={!hasPendingChanges || saving}
          icon={<Save size={16} strokeWidth={1.8} />}
          label={adminContent.guests.actions.saveChanges}
          onClick={onSave}
          showText={showText ? "always" : undefined}
          tone="primary"
          type="button"
        >
          {showText ? adminContent.guests.actions.saveChanges : undefined}
        </IconButton>
      </div>

      <div className="grid w-full grid-cols-4 gap-3 sm:w-auto sm:grid-cols-4">
        <IconButton
          className="w-full"
          disabled={!rows.length}
          icon={<Download size={16} strokeWidth={1.8} />}
          label={adminContent.guests.actions.export}
          onClick={onExport}
          tone="terciary"
          type="button"
        >
          {showText ? adminContent.guests.actions.export : undefined}
        </IconButton>

        <CardActions
          className="contents"
          deleteLabel={adminContent.guests.actions.delete}
          editLabel={adminContent.guests.actions.edit}
          item={selectedGroup}
          onDelete={selectedGroup ? onDelete : null}
          onEdit={selectedGroup ? onEdit : null}
          showText={showText}
        />

        <IconButton
          className="w-full"
          icon={<Plus size={18} strokeWidth={2.4} />}
          label={adminContent.guests.actions.create}
          onClick={onCreate}
          tone="primary"
          type="button"
        >
          {showText ? adminContent.guests.actions.create : undefined}
        </IconButton>
      </div>
    </div>
  );
}

function UnsavedGuestChangesDialog({
  changes,
  onCancel,
  onConfirm,
  onSaveAndExit,
}) {
  useViewportScrollLock(true);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby="unsaved-guest-changes-title"
        aria-modal="true"
        className="premium-card rsvp-dialog-card"
        role="alertdialog"
      >
        <p className="section-eyebrow mb-3">
          {adminContent.guests.dialogs.warningEyebrow}
        </p>
        <h2
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
          id="unsaved-guest-changes-title"
        >
          {adminContent.guests.dialogs.unsavedTitle}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          {adminContent.guests.dialogs.unsavedText}
        </p>
        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-left text-sm text-[var(--color-muted)]">
          {changes.map((change, index) => (
            <li
              className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
              key={`${change}-${index}`}
            >
              {change}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <IconButton
            className="flex-1"
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label={adminContent.guests.dialogs.exitWithoutSaving}
            onClick={onConfirm}
            showText="always"
            tone="danger"
            type="button"
          >
            {adminContent.guests.dialogs.exitWithoutSaving}
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<Save size={16} strokeWidth={1.8} />}
            label={adminContent.guests.dialogs.saveAndExit}
            onClick={onSaveAndExit}
            showText="always"
            tone="primary"
            type="button"
          >
            {adminContent.guests.dialogs.saveAndExit}
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<X size={16} strokeWidth={1.8} />}
            label={adminContent.guests.dialogs.keepEditing}
            onClick={onCancel}
            showText="always"
            tone="terciary"
            type="button"
          >
            {adminContent.guests.dialogs.keepEditing}
          </IconButton>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function AdminGuestPage({ items, onEditGuests, onSelect, selectedRowId }) {
  return (
    <>
      <CardGrid
        className="hidden gap-4 md:grid lg:grid-cols-2"
        getKey={(row) => row.rowId}
        items={items}
        renderCard={(row) => (
          <AdminGuestConfirmationCard
            onEditGuests={onEditGuests}
            onSelect={onSelect}
            row={row}
            selected={row.rowId === selectedRowId}
          />
        )}
      />

      <div className="grid gap-4 md:hidden">
        {items.map((row) => (
          <AdminGuestConfirmationCard
            key={row.rowId}
            onEditGuests={onEditGuests}
            onSelect={onSelect}
            row={row}
            selected={row.rowId === selectedRowId}
          />
        ))}
      </div>

      {!items.length && (
        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
          <UsersRound
            className="mx-auto text-[var(--color-accent-dark)]"
            size={28}
            strokeWidth={1.7}
          />
          <p className="mt-4 font-serif text-3xl text-[var(--color-accent-dark)]">
            {adminContent.guests.list.emptyTitle}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
            {adminContent.guests.list.emptyText}
          </p>
        </div>
      )}
    </>
  );
}

function AdminGuestConfirmationCard({
  onEditGuests,
  onSelect,
  row,
  selected,
  titleRef,
  titleStyle,
}) {
  const chips = getGroupSummaryChips(row);

  return (
    <div
      className={`relative h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(row)}
    >
      {onEditGuests && (
        <IconButton
          className="absolute right-4 top-4 z-10 h-10 w-10 !px-0"
          icon={<UsersRound size={16} strokeWidth={1.8} />}
          label={adminContent.guests.actions.editGuests}
          onClick={(event) => {
            event.stopPropagation();
            onEditGuests(row.group);
          }}
          tone="secondary"
          type="button"
        />
      )}
      <Card
        decorativeText={row.groupSize}
        eyebrow={`${row.groupSize} ${
          row.groupSize === 1 ? "persona" : "personas"
        }`}
        title={row.groupName || "Grupo sin nombre"}
        titleRef={titleRef}
        titleStyle={titleStyle}
      >
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chips.map((chip) => (
            <Chip
              className={chip.className}
              href={chip.href}
              icon={chip.icon}
              key={chip.key}
              strong={chip.strong}
              tone={chip.tone}
              value={chip.value}
              valueClassName={chip.valueClassName}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function getGroupSummaryChips(row) {
  const guests = Guest.normalizeList(row.guests, { ensureOne: false });
  const allergyChips = COMMON_ALLERGIES.map((allergy) => {
    const count = getGuestCountBy(guests, (guest) =>
      Guest.hasAllergy(guest, allergy),
    );

    if (!count) return null;

    return {
      key: `allergy-${allergy}`,
      icon: <AlertTriangle size={13} strokeWidth={1.8} />,
      value: `${allergy}: ${count}`,
    };
  }).filter(Boolean);
  const otherAllergiesCount = getGuestCountBy(guests, Guest.hasOtherAllergies);
  const commentsCount = getGuestCountBy(guests, Guest.hasComments);

  return [
    {
      className: "col-span-2",
      href: getEmailHref(row.email),
      icon: <Mail size={13} strokeWidth={1.8} />,
      key: "email",
      tone: "secondary",
      value: row.email || "-",
    },
    {
      href: getPhoneHref(row.phone),
      icon: <Phone size={13} strokeWidth={1.8} />,
      key: "phone",
      tone: "secondary",
      value: row.phone || "-",
    },
    ...GUEST_MENU_OPTIONS.map((menu) => {
      const count = getGuestCountBy(guests, (guest) => guest.menu === menu);

      if (!count) return null;

      return {
        icon: <GroupMenuIcon menu={menu} size={13} strokeWidth={1.8} />,
        key: `menu-${menu}`,
        strong: true,
        value: `${menu}: ${count}`,
      };
    }).filter(Boolean),
    ...allergyChips,
    otherAllergiesCount
      ? {
          icon: <AlertTriangle size={13} strokeWidth={1.8} />,
          key: "other-allergies",
          value: `Otras: ${otherAllergiesCount}`,
        }
      : null,
    getGuestCountBy(
      guests,
      (guest) => guest.outboundBus && guest.outboundBus !== "No",
    )
      ? {
          icon: <BusFront size={13} strokeWidth={1.8} />,
          key: "outbound-bus",
          value: `Ida: ${getGuestCountBy(
            guests,
            (guest) => guest.outboundBus && guest.outboundBus !== "No",
          )}`,
        }
      : null,
    getGuestCountBy(
      guests,
      (guest) => guest.returnBus && guest.returnBus !== "No",
    )
      ? {
          icon: <BusFront size={13} strokeWidth={1.8} />,
          key: "return-bus",
          value: `Vuelta: ${getGuestCountBy(
            guests,
            (guest) => guest.returnBus && guest.returnBus !== "No",
          )}`,
        }
      : null,
    commentsCount
      ? {
          icon: <MessageCircle size={13} strokeWidth={1.8} />,
          key: "comments",
          value: `Notas: ${commentsCount}`,
        }
      : null,
  ].filter(Boolean);
}

function getGuestCountBy(guests, predicate) {
  return guests.filter(predicate).length;
}

function GroupMenuIcon({ menu, ...props }) {
  const normalizedMenu = String(menu || "")
    .trim()
    .toLowerCase();
  const Icon =
    normalizedMenu === "pescado"
      ? Fish
      : normalizedMenu === "carne"
        ? Beef
        : Utensils;

  return <Icon {...props} />;
}

function GroupEditor({ group, isCreation, mode = "full", onClose, onSave }) {
  const [draft, setDraft] = useState(group);
  const [errors, setErrors] = useState({});
  const [validationPopupOpen, setValidationPopupOpen] = useState(false);
  const [unsavedChangesOpen, setUnsavedChangesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedDraftSnapshot = useMemo(
    () =>
      getStableJson(normalizeAdminGroupBeforeSave(group, { isCreation })),
    [group, isCreation],
  );
  const currentDraftSnapshot = useMemo(
    () =>
      getStableJson(normalizeAdminGroupBeforeSave(draft, { isCreation })),
    [draft, isCreation],
  );
  const hasUnsavedChanges = savedDraftSnapshot !== currentDraftSnapshot;
  const pendingChanges = useMemo(
    () => buildGroupEditorChanges(group, draft, { isCreation }),
    [draft, group, isCreation],
  );
  const renderFormItem = (index, children) => (
    <CinematicStaggeredRevealItem index={index} isVisible key={index}>
      {children}
    </CinematicStaggeredRevealItem>
  );
  const isGuestListMode = mode === "guests";
  const isGroupMode = mode === "group";
  const dialogTitle = isGuestListMode
    ? adminContent.guests.dialogs.guestListEditorTitle
    : adminContent.guests.dialogs.groupEditorTitle;

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasUnsavedChanges || saving) return;

        event.preventDefault();
        event.returnValue = "";
      },
      [hasUnsavedChanges, saving],
    ),
  );

  const handleRequestClose = () => {
    if (saving) return;

    if (hasUnsavedChanges) {
      setUnsavedChangesOpen(true);
      return;
    }

    onClose();
  };

  const handleDiscardChanges = () => {
    setUnsavedChangesOpen(false);
    onClose();
  };

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

  return (
    <EditorDialog
      onClose={handleRequestClose}
      title={dialogTitle}
      titleId="group-editor-title"
    >
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
        onCancel={handleRequestClose}
        onContactChange={updateContact}
        onGuestChange={updateGuest}
        onRemoveGuest={removeGuest}
        onSubmit={handleSubmit}
        renderItem={renderFormItem}
        showContactDetails={!isGuestListMode}
        showGuestList={!isGroupMode}
        submitText="Guardar"
        variant="admin"
      />

      <StatusDialog
        closeText="Cerrar"
        eyebrow={adminContent.guests.dialogs.warningEyebrow}
        message={adminContent.guests.dialogs.validationMessage}
        onClose={() => setValidationPopupOpen(false)}
        open={validationPopupOpen}
        title={adminContent.guests.dialogs.validationTitle}
        type="error"
      />

      {unsavedChangesOpen && (
        <DeleteDialog
          confirmText={adminContent.guests.dialogs.discardChanges}
          message={adminContent.guests.dialogs.unsavedMessage}
          onCancel={() => setUnsavedChangesOpen(false)}
          onConfirm={handleDiscardChanges}
          title={adminContent.guests.dialogs.unsavedTitle}
        >
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-left text-sm text-[var(--color-muted)]">
            {pendingChanges.map((change, index) => (
              <li
                className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
                key={`${change}-${index}`}
              >
                {change}
              </li>
            ))}
          </ul>
        </DeleteDialog>
      )}
    </EditorDialog>
  );
}
function downloadGuestsCsv(rows) {
  downloadGenericCsv({
    filename: adminContent.guests.csv.filename,
    headers: [
      "email",
      "telefono",
      "nombre_grupo",
      "total_invitados",
      "mesa_menu_asiento",
      "alergias",
      "transporte",
      "notas",
    ],
    rows: rows.map((row) => [
      row.email,
      row.phone,
      row.groupName,
      row.groupSize,
      row.assignmentText,
      row.allergyText,
      row.transportText,
      row.commentsText,
    ]),
  });
}

function getStableJson(value) {
  return JSON.stringify(value);
}

function upsertGroupInList(groups, group) {
  const normalizedGroup = normalizeAdminGroups([group])[0];
  const existingIndex = groups.findIndex(
    (item) => item.groupName === normalizedGroup.groupName,
  );

  if (existingIndex === -1) {
    return normalizeAdminGroups([...groups, normalizedGroup]);
  }

  return normalizeAdminGroups(
    groups.map((item, index) =>
      index === existingIndex ? normalizedGroup : item,
    ),
  );
}

function removeGroupFromList(groups, groupName) {
  return normalizeAdminGroups(
    groups.filter((group) => group.groupName !== groupName),
  );
}

async function persistGuestChanges({ currentGroups, savedGroups }) {
  const savedByGroupName = new Map(
    savedGroups.map((group) => [group.groupName, group]),
  );
  const currentByGroupName = new Map(
    currentGroups.map((group) => [group.groupName, group]),
  );
  const persistencePromises = [];

  savedByGroupName.forEach((group, groupName) => {
    if (!currentByGroupName.has(groupName)) {
      persistencePromises.push(
        deleteAdminGroup({
          groupName,
          password: ADMIN_PASSWORD,
        }),
      );
    }
  });

  currentByGroupName.forEach((group, groupName) => {
    const savedGroup = savedByGroupName.get(groupName);
    const isCreation = !savedGroup;

    if (!isCreation && getStableJson(savedGroup) === getStableJson(group)) {
      return;
    }

    persistencePromises.push(
      saveAdminGroup({
        group,
        method: isCreation ? "POST" : "PUT",
        password: ADMIN_PASSWORD,
      }),
    );
  });

  await Promise.all(persistencePromises);
}

function buildPendingGuestChanges(savedGroups, currentGroups) {
  const savedByGroupName = new Map(
    savedGroups.map((group) => [group.groupName, group]),
  );
  const currentByGroupName = new Map(
    currentGroups.map((group) => [group.groupName, group]),
  );
  const changes = [];

  currentByGroupName.forEach((group, groupName) => {
    const savedGroup = savedByGroupName.get(groupName);

    if (!savedGroup) {
      changes.push(`Grupo creado: ${groupName || group.email || "sin nombre"}`);
      return;
    }

    if (getStableJson(savedGroup) !== getStableJson(group)) {
      changes.push(...buildGroupEditorChanges(savedGroup, group, {
        isCreation: false,
      }));
    }
  });

  savedByGroupName.forEach((group, groupName) => {
    if (!currentByGroupName.has(groupName)) {
      changes.push(`Grupo eliminado: ${groupName || group.email || "sin nombre"}`);
    }
  });

  return changes;
}

function buildGroupEditorChanges(originalGroup, draftGroup, { isCreation }) {
  const original = normalizeAdminGroupBeforeSave(originalGroup, { isCreation });
  const draft = normalizeAdminGroupBeforeSave(draftGroup, { isCreation });
  const contactChanges = [];

  if (isCreation) {
    contactChanges.push("Grupo nuevo");
  }

  [
    ["groupName", "Nombre de grupo"],
    ["email", "Email"],
    ["phone", "Telefono"],
  ].forEach(([field, label]) => {
    if (String(original[field] || "") !== String(draft[field] || "")) {
      contactChanges.push(label);
    }
  });

  const guestChanges = buildGuestEditorChanges(original.guests, draft.guests);
  const groupLabel = getGroupChangeLabel(original, draft);
  const changeParts = [];

  if (contactChanges.length) {
    changeParts.push(`contacto: ${contactChanges.join(", ")}`);
  }

  if (guestChanges.added.length) {
    changeParts.push(`invitados anadidos: ${guestChanges.added.join(", ")}`);
  }

  if (guestChanges.removed.length) {
    changeParts.push(
      `invitados eliminados: ${guestChanges.removed.join(", ")}`,
    );
  }

  if (guestChanges.modified.length) {
    changeParts.push(
      `invitados modificados: ${guestChanges.modified.join(", ")}`,
    );
  }

  return changeParts.length
    ? [`Grupo ${groupLabel}: ${changeParts.join("; ")}`]
    : ["Cambios sin guardar"];
}

function buildGuestEditorChanges(originalGuests = [], draftGuests = []) {
  const originalGuestsByKey = getGuestsByEditorKey(originalGuests);
  const draftGuestsByKey = getGuestsByEditorKey(draftGuests);
  const changes = {
    added: [],
    modified: [],
    removed: [],
  };

  originalGuestsByKey.forEach((originalGuest, guestKey) => {
    const draftGuest = draftGuestsByKey.get(guestKey);

    if (!draftGuest) {
      changes.removed.push(getGuestChangeLabel(originalGuest, guestKey));
      return;
    }

    if (getStableJson(originalGuest) !== getStableJson(draftGuest)) {
      changes.modified.push(getGuestChangeLabel(draftGuest, guestKey));
    }
  });

  draftGuestsByKey.forEach((draftGuest, guestKey) => {
    if (!originalGuestsByKey.has(guestKey)) {
      changes.added.push(getGuestChangeLabel(draftGuest, guestKey));
    }
  });

  return changes;
}

function getGuestsByEditorKey(guests = []) {
  const guestKeyCounts = new Map();

  return new Map(
    guests.map((guest, index) => {
      const baseKey = getGuestEditorBaseKey(guest, index);
      const nextCount = (guestKeyCounts.get(baseKey) || 0) + 1;

      guestKeyCounts.set(baseKey, nextCount);

      return [`${baseKey}#${nextCount}`, guest];
    }),
  );
}

function getGuestEditorBaseKey(guest, index) {
  const guestName = Guest.getFullName(guest, "")
    .trim()
    .toLowerCase();

  return guestName || `invitado-${index + 1}`;
}

function getGuestChangeLabel(guest, guestKey) {
  return Guest.getFullName(guest, "") || guestKey.replace(/#\d+$/, "");
}

function getGroupChangeLabel(original, draft) {
  const originalLabel = original.groupName || original.email || "sin nombre";
  const draftLabel = draft.groupName || draft.email || "sin nombre";

  if (originalLabel === draftLabel) return draftLabel;

  return `${originalLabel} -> ${draftLabel}`;
}
