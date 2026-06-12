import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Search, Trash2, X } from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import AdminEditorDialog from "../components/admin/AdminEditorDialog";
import AdminPageShell from "../components/admin/AdminPageShell";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import AdminTableSection from "../components/admin/AdminTableSection";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import NotificationCards from "../components/admin/notifications/NotificationCards";
import NotificationForm from "../components/admin/notifications/NotificationForm";
import DeleteDialog from "../components/ui/DeleteDialog";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import {
  inputClassName,
  Label,
  selectClassName,
} from "../components/rsvp/FormPrimitives";
import { adminContent } from "../constants/adminContent";
import { AdminNotification } from "../models";
import {
  discardAdminNotificationChanges,
  getAdminDataSnapshot,
  getAdminNotificationChangesSummary,
  hasAdminPendingChanges,
  loadAdminDataOnce,
  removeAdminNotification,
  setAdminNotificationRead,
  upsertAdminNotification,
} from "../services/adminDataStore";
import useIsMobileView from "../hooks/useIsMobileView";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";

const createEmptyForm = () => AdminNotification.create();
const DESKTOP_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 4;
const READ_FILTERS = [
  { value: "", label: "Todas" },
  { value: "unread", label: "No vistas" },
  { value: "read", label: "Leídas" },
];

export default function AdminNotifications() {
  const notificationsRef = useRef(null);
  const tableStartRef = useRef(null);
  const notificationsInView = useInView(notificationsRef, {
    once: true,
    amount: 0.12,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const isMobileView = useIsMobileView();
  const pageSize = isMobileView ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
  const [state, setState] = useState({
    error: "",
    loading: true,
    notifications: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDirection, setPageDirection] = useState(1);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [editingNotification, setEditingNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});
  const [hasPendingChanges, setHasPendingChanges] = useState(
    hasAdminPendingChanges,
  );
  const pendingChanges = getAdminNotificationChangesSummary();
  const blocker = useUnsavedChangesNavigation(hasPendingChanges);
  const filteredNotifications = useMemo(
    () =>
      state.notifications.filter((notification) =>
        matchesNotificationFilters(notification, {
          query,
          readFilter,
          typeFilter,
        }),
      ),
    [query, readFilter, state.notifications, typeFilter],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / pageSize),
  );
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const emptyState = useMemo(
    () => ({
      text: adminContent.notifications.list.emptyText,
      title: adminContent.notifications.list.emptyTitle,
    }),
    [],
  );

  const refreshPendingChanges = () =>
    setHasPendingChanges(hasAdminPendingChanges());
  const syncNotifications = useCallback((notifications) => {
    const normalizedNotifications =
      AdminNotification.normalizeList(notifications);

    setState((current) => ({
      ...current,
      loading: false,
      notifications: normalizedNotifications,
    }));
    refreshPendingChanges();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadAdminDataOnce({ password: ADMIN_PASSWORD })
      .then((snapshot) => {
        syncNotifications(snapshot.notifications);
      })
      .catch((error) => {
        console.error(error);
        setState({
          error: adminContent.notifications.dialogs.loadError,
          loading: false,
          notifications: [],
        });
      });
  }, [isAuthenticated, syncNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const snapshot = getAdminDataSnapshot();
      setState((current) => ({
        ...current,
        notifications: AdminNotification.normalizeList(snapshot.notifications),
      }));
      refreshPendingChanges();
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handlePageChange = (nextPage, target = tableStartRef.current) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === effectiveCurrentPage
    ) {
      return;
    }

    setPageDirection(nextPage > effectiveCurrentPage ? 1 : -1);
    setCurrentPage(nextPage);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const openCreateEditor = () => {
    setErrors({});
    setForm(createEmptyForm());
    setEditingNotification({ mode: "create" });
  };

  const openEditEditor = (notification) => {
    setErrors({});
    setForm(AdminNotification.normalize(notification));
    setEditingNotification({ mode: "edit", notification });
  };

  const closeEditor = () => {
    setEditingNotification(null);
    setErrors({});
  };

  const handleSaveNotification = (event) => {
    event.preventDefault();

    const validationErrors = AdminNotification.validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    const nextNotifications = upsertAdminNotification(form);
    syncNotifications(nextNotifications);
    closeEditor();
  };

  const handleToggleRead = (notification) => {
    const nextNotifications = setAdminNotificationRead(
      notification.id,
      !notification.read,
    );
    syncNotifications(nextNotifications);
  };

  const handleDeleteNotification = () => {
    if (!deleteTarget) return;

    const nextNotifications = removeAdminNotification(deleteTarget.id);
    syncNotifications(nextNotifications);
    setDeleteTarget(null);
  };

  const handleDiscard = () => {
    const nextNotifications = discardAdminNotificationChanges();
    syncNotifications(nextNotifications);
  };

  return (
    <CinematicPage>
      <AdminPageShell
        header={adminContent.notifications.header}
        innerClassName="max-w-7xl py-6"
        isMobileView={isMobileView}
        isVisible={notificationsInView}
        rootRef={notificationsRef}
      >
        <CinematicStaggeredRevealItem
          index={2}
          isVisible={notificationsInView}
        >
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.notifications.actions.discardChanges}
            discardDialogText={adminContent.notifications.dialogs.discardText}
            discardDialogTitle={adminContent.notifications.dialogs.discardTitle}
            hasPendingChanges={pendingChanges.length > 0}
            loading={state.loading}
            onDiscard={handleDiscard}
            showSave={false}
            showText={!isMobileView}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem
          index={3}
          isVisible={notificationsInView}
        >
          <AdminTableSection
            actions={
              <NotificationTableActions
                loading={state.loading}
                onCreate={openCreateEditor}
                showText={!isMobileView}
              />
            }
            actionsFullWidth
            contentRef={tableStartRef}
            eyebrow={adminContent.notifications.list.eyebrow}
            filters={
              <NotificationFilters
                onQueryChange={(value) => {
                  setQuery(value);
                  setCurrentPage(1);
                }}
                onReadFilterChange={(value) => {
                  setReadFilter(value);
                  setCurrentPage(1);
                }}
                onTypeFilterChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
                query={query}
                readFilter={readFilter}
                typeFilter={typeFilter}
              />
            }
            getKey={(notification) => notification.id}
            isMobileView={isMobileView}
            items={filteredNotifications}
            loading={state.loading}
            mobilePageLabel={adminContent.notifications.list.mobilePageLabel}
            onNextPage={() => handlePageChange(effectiveCurrentPage + 1)}
            onPrevPage={() => handlePageChange(effectiveCurrentPage - 1)}
            page={state.loading ? undefined : effectiveCurrentPage}
            pageDirection={pageDirection}
            pageLabel={adminContent.notifications.list.pageLabel}
            pageSize={state.loading ? undefined : pageSize}
            renderMeasurePage={(items) => (
              <NotificationCards
                emptyText={emptyState.text}
                emptyTitle={emptyState.title}
                notifications={items}
                onDelete={() => {}}
                onEdit={() => {}}
                onToggleRead={() => {}}
              />
            )}
            renderPage={(items) => (
              <NotificationCards
                emptyText={emptyState.text}
                emptyTitle={emptyState.title}
                notifications={items}
                onDelete={setDeleteTarget}
                onEdit={openEditEditor}
                onToggleRead={handleToggleRead}
              />
            )}
            skeletonConfig={{
              content: {
                columnsClassName: "lg:grid-cols-2",
                itemClassName: "min-h-40",
                lines: 2,
              },
              filters: true,
            }}
            title={adminContent.notifications.list.title}
            totalPages={state.loading ? undefined : totalPages}
          />
        </CinematicStaggeredRevealItem>
      </AdminPageShell>

      {editingNotification && (
        <AdminEditorDialog
          onClose={closeEditor}
          title={
            editingNotification.mode === "create"
              ? adminContent.notifications.dialogs.createTitle
              : adminContent.notifications.dialogs.editTitle
          }
          titleId="notification-editor-title"
        >
          <NotificationForm
            errors={errors}
            form={form}
            onChange={handleFormChange}
            onSubmit={handleSaveNotification}
          />
        </AdminEditorDialog>
      )}

      {deleteTarget && (
        <DeleteDialog
          confirmText={adminContent.notifications.actions.delete}
          message={adminContent.notifications.dialogs.deleteMessage(
            deleteTarget.title || "esta notificación",
          )}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteNotification}
          title={adminContent.notifications.dialogs.deleteTitle}
        />
      )}

      {blocker.state === "blocked" && (
        <UnsavedChangesDialog
          actions={[
            {
              icon: <Trash2 size={16} strokeWidth={1.8} />,
              label: adminContent.tables.dialogs.exitWithoutSaving,
              onClick: () => blocker.proceed?.(),
              tone: "danger",
            },
            {
              icon: <X size={16} strokeWidth={1.8} />,
              label: adminContent.tables.dialogs.keepEditing,
              onClick: () => blocker.reset?.(),
              tone: "terciary",
            },
          ]}
          changes={pendingChanges}
          labels={{
            eyebrow: adminContent.notifications.dialogs.warningEyebrow,
            text: adminContent.notifications.dialogs.unsavedText,
            title: adminContent.notifications.dialogs.unsavedTitle,
          }}
          titleId="admin-notifications-unsaved-changes-title"
        />
      )}

      <StatusDialog
        eyebrow={adminContent.notifications.dialogs.warningEyebrow}
        message={state.error}
        onClose={() => setState((current) => ({ ...current, error: "" }))}
        open={Boolean(state.error)}
        title={adminContent.notifications.dialogs.problemTitle}
        type="error"
      />
    </CinematicPage>
  );
}

function NotificationTableActions({ loading, onCreate, showText = true }) {
  return (
    <IconButton
      className="w-full"
      disabled={loading}
      icon={<Plus size={16} strokeWidth={1.8} />}
      onClick={onCreate}
      showText={showText ? "always" : undefined}
      tone="primary"
      type="button"
    >
      {showText ? adminContent.notifications.actions.create : undefined}
    </IconButton>
  );
}

function NotificationFilters({
  onQueryChange,
  onReadFilterChange,
  onTypeFilterChange,
  query,
  readFilter,
  typeFilter,
}) {
  const content = adminContent.notifications.filters;
  const selectedType = AdminNotification.types.find(
    (type) => type === typeFilter,
  );
  const selectedReadFilter = READ_FILTERS.find(
    (filter) => filter.value === readFilter,
  );
  const activeFilters = [
    query.trim()
      ? {
          key: "query",
          label: query.trim(),
          onRemove: () => onQueryChange(""),
        }
      : null,
    selectedType
      ? {
          key: "type",
          label: selectedType,
          onRemove: () => onTypeFilterChange(""),
        }
      : null,
    readFilter && selectedReadFilter
      ? {
          key: "read",
          label: selectedReadFilter.label,
          onRemove: () => onReadFilterChange(""),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel activeFilters={activeFilters} title={content.eyebrow}>
      <div className="grid gap-4 lg:grid-cols-[1fr_12rem_12rem] lg:items-end">
        <div>
          <Label>{content.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={content.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>{content.typeLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onTypeFilterChange(event.target.value)}
            value={typeFilter}
          >
            <option value="">{content.allTypes}</option>
            {AdminNotification.types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>{content.readLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onReadFilterChange(event.target.value)}
            value={readFilter}
          >
            {READ_FILTERS.map((filter) => (
              <option key={filter.value || "all"} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

function matchesNotificationFilters(
  notification,
  { query, readFilter, typeFilter },
) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery =
    !normalizedQuery ||
    [
      notification.title,
      notification.detail,
      notification.type,
      notification.date,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  const matchesType = !typeFilter || notification.type === typeFilter;
  const matchesRead =
    !readFilter ||
    (readFilter === "read" ? notification.read : !notification.read);

  return matchesQuery && matchesType && matchesRead;
}
