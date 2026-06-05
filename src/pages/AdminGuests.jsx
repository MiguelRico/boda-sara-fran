import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { Navigate } from "react-router-dom";
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
  Search,
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
  removeAdminGroup,
  upsertAdminGroup,
} from "../services/adminDataStore";
import { inputClassName, Label } from "../components/rsvp/FormPrimitives";
import useSpinner from "../hooks/useSpinner";
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popup, setPopup] = useState(createInitialPopup);

  const loadGuests = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
    }

    try {
      const response = await loadAdminDataOnce({ password: ADMIN_PASSWORD });

      setState({
        groups: normalizeAdminGroups(response.groups),
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

  const closePopup = () => {
    setPopup((current) => ({
      ...current,
      open: false,
    }));
  };

  const handleSaveGroup = async (group) => {
    const isCreation = !editingGroup?.groupName;
    const groupToSave = normalizeAdminGroupBeforeSave(group, { isCreation });

    try {
      spinner.show(
        isCreation
          ? adminContent.guests.spinner.create
          : adminContent.guests.spinner.save,
      );

      await saveAdminGroup({
        group: groupToSave,
        method: isCreation ? "POST" : "PUT",
        password: ADMIN_PASSWORD,
      });
      const nextGroups = upsertAdminGroup(groupToSave);

      setEditingGroup(null);
      setState({
        groups: nextGroups,
        loading: false,
        error: "",
      });
      setPopup(
        createAdminPopup({
          message: isCreation
            ? adminContent.guests.dialogs.createdMessage
            : adminContent.guests.dialogs.updatedMessage,
          title: isCreation
            ? adminContent.guests.dialogs.createdTitle
            : adminContent.guests.dialogs.updatedTitle,
        }),
      );
    } catch (error) {
      console.error(error);
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.saveError,
          title: adminContent.guests.dialogs.problemTitle,
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
      spinner.show(adminContent.guests.spinner.delete);

      await deleteAdminGroup({
        groupName: deleteTarget.groupName,
        password: ADMIN_PASSWORD,
      });
      const nextGroups = removeAdminGroup(deleteTarget.groupName);

      setDeleteTarget(null);
      setState({
        groups: nextGroups,
        loading: false,
        error: "",
      });
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.deletedMessage,
          title: adminContent.guests.dialogs.deletedTitle,
        }),
      );
    } catch (error) {
      console.error(error);
      setPopup(
        createAdminPopup({
          message: adminContent.guests.dialogs.deleteError,
          title: adminContent.guests.dialogs.problemTitle,
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
              eyebrow={adminContent.guests.header.eyebrow}
              title={adminContent.guests.header.title}
              titleAs="h1"
              text={adminContent.guests.header.text}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={guestsInView}>
            <AdminTableSection
              actions={
                <div className="grid w-full grid-cols-4 gap-3 sm:w-auto sm:grid-cols-5">
                  <IconButton
                    className="w-full"
                    disabled={!rows.length}
                    label={adminContent.guests.actions.export}
                    tone="terciary"
                    onClick={() => downloadGuestsCsv(rows)}
                  >
                    <Download size={16} strokeWidth={1.8} />
                  </IconButton>

                  <CardActions
                    className="contents"
                    item={selectedRow?.group}
                    onDelete={
                      selectedRow
                        ? () => setDeleteTarget(selectedRow.group)
                        : null
                    }
                    onEdit={
                      selectedRow
                        ? () =>
                            setEditingGroup(createDraftGroup(selectedRow.group))
                        : null
                    }
                    showText={!isMobileList}
                  />

                  <IconButton
                    className="w-full"
                    label={adminContent.guests.actions.create}
                    tone="primary"
                    onClick={() => setEditingGroup(createDraftGroup())}
                  >
                    <Plus size={18} strokeWidth={2.4} />
                  </IconButton>
                </div>
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
                  onSelect={() => {}}
                  selectedRowId={effectiveSelectedRowId}
                />
              )}
              renderPage={(items) => (
                <AdminGuestPage
                  items={items}
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

function AdminGuestPage({ items, onSelect, selectedRowId }) {
  return (
    <>
      <CardGrid
        className="hidden gap-4 md:grid lg:grid-cols-2"
        getKey={(row) => row.rowId}
        items={items}
        renderCard={(row) => (
          <AdminGuestConfirmationCard
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
  onSelect,
  row,
  selected,
  titleRef,
  titleStyle,
}) {
  const chips = getGroupSummaryChips(row);

  return (
    <div
      className={`h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(row)}
    >
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
          value: `Otras alergias: ${otherAllergiesCount}`,
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
      onClose={onClose}
      title={adminContent.guests.dialogs.groupEditorTitle}
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
        eyebrow={adminContent.guests.dialogs.warningEyebrow}
        message={adminContent.guests.dialogs.validationMessage}
        onClose={() => setValidationPopupOpen(false)}
        open={validationPopupOpen}
        title={adminContent.guests.dialogs.validationTitle}
        type="error"
      />
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
