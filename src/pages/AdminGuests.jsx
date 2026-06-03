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
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
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
import PagedList from "../components/admin/PagedList";
import CardListSkeleton from "../components/ui/CardListSkeleton";
import InfoLine from "../components/ui/InfoLine";
import Pagination from "../components/ui/Pagination";
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
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import { downloadCsv as downloadGenericCsv } from "../utils/csvExport";
import {
  createDraftGroup,
  normalizeAdminGroupBeforeSave,
} from "../utils/drafts";
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
  eyebrow: type === "success" ? adminContent.guests.dialogs.successEyebrow : adminContent.guests.dialogs.warningEyebrow,
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
          adminContent.guests.dialogs.loadError,
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
  const {
    cancelPageLoading,
    handlePageChange,
    pageDirection,
    pageLoading,
    pageLoadingMinHeight,
  } = usePageTransition({
    currentPage,
    isMobileList,
    onPageChange: setPage,
    totalPages,
  });
  const pagedGroupCount = pagedRows.length;
  const pagedGuestCount = pagedRows.reduce(
    (total, row) => total + row.groupSize,
    0,
  );

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
        isCreation ? adminContent.guests.spinner.create : adminContent.guests.spinner.save,
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
          message:
            adminContent.guests.dialogs.saveError,
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

      setDeleteTarget(null);
      await loadGuests({ showLoading: false });
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
          message:
            adminContent.guests.dialogs.deleteError,
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
                  <p className="section-eyebrow mb-2">{adminContent.guests.list.eyebrow}</p>
                  <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
                    {adminContent.guests.list.title}
                  </h2>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                      {adminContent.guests.list.countLabel({ groups: pagedGroupCount, guests: pagedGuestCount })}
                    </p>

                    <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex sm:justify-end">
                      <IconButton
                        className="w-full"
                        disabled={!rows.length}
                        label={adminContent.guests.actions.export}
                        tone="terciary"
                        onClick={() => downloadGuestsCsv(rows)}
                      >
                        <Download size={16} strokeWidth={1.8} />
                      </IconButton>

                      <IconButton
                        className="w-full"
                        disabled={state.loading}
                        label={adminContent.guests.actions.refresh}
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
                        label={adminContent.guests.actions.create}
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
                  <CardListSkeleton />
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
                        <CardGrid
                          className="hidden gap-4 md:grid lg:grid-cols-2"
                          getKey={(row) => row.rowId}
                          items={pagedRows}
                          renderCard={(row) => (
                            <AdminGuestConfirmationCard
                              onDelete={setDeleteTarget}
                              onEdit={(group) =>
                                setEditingGroup(createDraftGroup(group))
                              }
                              row={row}
                            />
                          )}
                        />

                        <PagedList
                          allItems={visibleRows}
                          direction={pageDirection}
                          getKey={(row) => row.rowId}
                          items={pagedRows}
                          page={currentPage}
                          renderItem={(row) => (
                            <AdminGuestConfirmationCard
                              onDelete={setDeleteTarget}
                              onEdit={(group) =>
                                setEditingGroup(createDraftGroup(group))
                              }
                              row={row}
                            />
                          )}
                          renderMeasureItem={(row) => (
                            <AdminGuestConfirmationCard row={row} />
                          )}
                        />

                        {!visibleRows.length && (
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
                      </div>

                      {pageLoading && (
                        <div className="absolute inset-x-0 top-0 z-10">
                          <CardListSkeleton />
                        </div>
                      )}
                    </div>

                    <Pagination
                      isMobileList={isMobileList}
                      page={currentPage}
                      totalPages={totalPages}
                      currentLabel={adminContent.guests.list.pageLabel}
                      mobileLabel={adminContent.guests.list.mobilePageLabel}
                      onNext={() =>
                        handlePageChange(currentPage + 1, tableStartRef.current)
                      }
                      onPrev={() =>
                        handlePageChange(currentPage - 1, tableStartRef.current)
                      }
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
          message={adminContent.guests.dialogs.deleteMessage(
            deleteTarget.groupName || deleteTarget.email,
          )}          onCancel={() => setDeleteTarget(null)}
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
  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-4">{adminContent.guests.filters.eyebrow}</p>

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
    </section>
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
    <Card
      actions={
        <CardActions
          className="grid w-full shrink-0 grid-cols-2 gap-3 sm:w-auto sm:flex sm:items-center sm:justify-end sm:gap-2"
          item={row.group}
          onDelete={onDelete}
          onEdit={onEdit}
          showText={false}
        />
      }
      decorativeText={row.groupSize}
      detail={`${row.email || "-"} · ${row.phone || "-"}`}
      eyebrow={`${row.groupSize} ${
        row.groupSize === 1 ? "persona" : "personas"
      }`}
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
    </Card>
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
