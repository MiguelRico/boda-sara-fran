import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

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
import NotificationTotalsPanel from "../components/admin/notifications/NotificationTotalsPanel";
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
  saveAdminNotifications,
  updateAdminNotificationRead,
} from "../api/notificationsApi";
import {
  discardAdminNotificationChanges,
  getAdminDataSnapshot,
  getAdminNotificationChangesSummary,
  loadAdminDataOnce,
  markAdminDataSaved,
  removeAdminNotification,
  setAdminNotificationRead,
  upsertAdminNotification,
} from "../services/adminDataStore";
import { buildNotificationStats } from "../services/notificationsService";
import useIsMobileView from "../hooks/useIsMobileView";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";

const createEmptyForm = () => AdminNotification.create();
const DESKTOP_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 4;
const READ_FILTERS = [
  { value: "", label: "Todas" },
  { value: "unread", label: "No leídas" },
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
  const [statusPopup, setStatusPopup] = useState({
    message: "",
    open: false,
    title: "",
    type: "success",
  });
  const [saving, setSaving] = useState(false);
  const pendingChanges = getAdminNotificationChangesSummary();
  const hasPendingChanges = pendingChanges.length > 0;
  const blocker = useUnsavedChangesNavigation(hasPendingChanges);
  const notificationStats = useMemo(
    () => buildNotificationStats(state.notifications),
    [state.notifications],
  );
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

  const syncNotifications = useCallback((notifications) => {
    const normalizedNotifications =
      AdminNotification.normalizeList(notifications);

    setState((current) => ({
      ...current,
      loading: false,
      notifications: normalizedNotifications,
    }));
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
    }, 500);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === effectiveCurrentPage
    ) {
      return;
    }

    setPageDirection(nextPage > effectiveCurrentPage ? 1 : -1);
    setCurrentPage(nextPage);
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
    setStatusPopup({
      message: adminContent.notifications.dialogs.pendingMessage,
      open: true,
      title: adminContent.notifications.dialogs.pendingTitle,
      type: "success",
    });
  };

  const handleToggleRead = (notification) => {
    const nextRead = !notification.read;
    const nextNotifications = setAdminNotificationRead(
      notification.id,
      nextRead,
      { markSaved: true },
    );

    syncNotifications(nextNotifications);
    void updateAdminNotificationRead({
      notificationId: notification.id,
      password: ADMIN_PASSWORD,
      read: nextRead,
    }).catch((error) => {
      console.error("Error actualizando notificacion en segundo plano:", error);
    });
  };

  const handleDeleteNotification = () => {
    if (!deleteTarget) return;

    const nextNotifications = removeAdminNotification(deleteTarget.id);
    syncNotifications(nextNotifications);
    setCurrentPage(1);
    setDeleteTarget(null);
  };

  const handleDiscard = () => {
    const nextNotifications = discardAdminNotificationChanges();
    syncNotifications(nextNotifications);
  };
  const handleSavePendingChanges = async () => {
    if (!pendingChanges.length || saving) return true;

    setSaving(true);

    try {
      const normalizedNotifications = AdminNotification.normalizeList(
        state.notifications,
      );

      await saveAdminNotifications({
        notifications: normalizedNotifications,
        password: ADMIN_PASSWORD,
      });
      markAdminDataSaved({ notifications: normalizedNotifications });
      syncNotifications(normalizedNotifications);
      setStatusPopup({
        message: adminContent.notifications.dialogs.savedMessage,
        open: true,
        title: adminContent.notifications.dialogs.savedTitle,
        type: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      setStatusPopup({
        message: adminContent.notifications.dialogs.saveError,
        open: true,
        title: adminContent.notifications.dialogs.problemTitle,
        type: "error",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };
  const handleConfirmBlockedNavigation = () => {
    handleDiscard();
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

  return (
    <CinematicPage>
      <AdminPageShell
        header={adminContent.notifications.header}
        innerClassName="max-w-7xl py-6"
        isMobileView={isMobileView}
        isVisible={notificationsInView}
        rootRef={notificationsRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={notificationsInView}>
          <NotificationTotalsPanel
            loading={state.loading}
            stats={notificationStats}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={notificationsInView}>
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.notifications.actions.discardChanges}
            discardDialogText={adminContent.notifications.dialogs.discardText}
            discardDialogTitle={adminContent.notifications.dialogs.discardTitle}
            hasPendingChanges={pendingChanges.length > 0}
            loading={state.loading}
            onDiscard={handleDiscard}
            onSave={handleSavePendingChanges}
            saveLabel={adminContent.notifications.actions.saveChanges}
            saving={saving}
            showText={!isMobileView}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={notificationsInView}>
          <AdminTableSection
            className="pt-0 mt-4"
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
                }}
                onReadFilterChange={(value) => {
                  setReadFilter(value);
                }}
                onTypeFilterChange={(value) => {
                  setTypeFilter(value);
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
          changes={pendingChanges}
          labels={{
            eyebrow: adminContent.notifications.dialogs.warningEyebrow,
            exitWithoutSaving: adminContent.tables.dialogs.exitWithoutSaving,
            keepEditing: adminContent.tables.dialogs.keepEditing,
            saveAndExit: adminContent.tables.dialogs.saveAndExit,
            text: adminContent.notifications.dialogs.unsavedText,
            title: adminContent.notifications.dialogs.unsavedTitle,
          }}
          onCancel={() => blocker.reset?.()}
          onConfirm={handleConfirmBlockedNavigation}
          onSaveAndExit={handleSaveAndExitBlockedNavigation}
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
      <StatusDialog
        eyebrow={adminContent.notifications.dialogs.warningEyebrow}
        message={statusPopup.message}
        onClose={() =>
          setStatusPopup((current) => ({ ...current, open: false }))
        }
        open={statusPopup.open}
        title={statusPopup.title}
        type={statusPopup.type}
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
