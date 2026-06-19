import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { ADMIN_PASSWORD } from "../constants/admin";
import { isAdminSessionAuthenticated } from "../utils/adminSession";
import {
  AdminPageShell,
  AdminPendingChangesActions,
  AdminTableSection,
  EditorDialog as AdminEditorDialog,
  UnsavedChangesDialog,
} from "../components/admin/common";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import {
  NotificationCards,
  NotificationFilters,
  NotificationForm,
  NotificationTableActions,
  NotificationTotalsPanel,
} from "../components/admin/notifications";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import { adminContent } from "../constants/adminContent";
import { AdminNotification } from "../models";
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
import {
  buildNotificationStats,
  persistNotifications,
  updateNotificationRead,
} from "../services/notificationsService";
import useIsMobileView from "../hooks/useIsMobileView";
import useAdminLocalChanges from "../hooks/useAdminLocalChanges";
import { matchesNotificationFilters } from "../utils/notificationPageUtils";
import { DEFAULT_TABLE_PAGE_SIZE } from "../utils/paginationState";
import { getStableJson } from "../utils/objectSnapshot";

const createEmptyForm = () => AdminNotification.create();

export default function AdminNotifications() {
  const notificationsRef = useRef(null);
  const tableStartRef = useRef(null);
  const notificationsInView = useInView(notificationsRef, {
    once: true,
    amount: 0.12,
  });
  const isAuthenticated = isAdminSessionAuthenticated();
  const isMobileView = useIsMobileView();
  const pageSize = DEFAULT_TABLE_PAGE_SIZE;
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
  const [formSnapshot, setFormSnapshot] = useState("");
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
    const nextForm = createEmptyForm();

    setErrors({});
    setForm(nextForm);
    setFormSnapshot(getStableJson(nextForm));
    setEditingNotification({ mode: "create" });
  };

  const openEditEditor = (notification) => {
    const nextForm = AdminNotification.normalize(notification);

    setErrors({});
    setForm(nextForm);
    setFormSnapshot(getStableJson(nextForm));
    setEditingNotification({ mode: "edit", notification });
  };

  const closeEditor = () => {
    setEditingNotification(null);
    setFormSnapshot("");
    setErrors({});
  };
  const showPendingPopup = () => {
    setStatusPopup({
      message: adminContent.notifications.dialogs.pendingMessage,
      open: true,
      title: adminContent.notifications.dialogs.pendingTitle,
      type: "success",
    });
  };

  const handleSaveNotification = (event) => {
    event.preventDefault();

    if (getStableJson(form) === formSnapshot) return;

    const validationErrors = AdminNotification.validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    const nextNotifications = upsertAdminNotification(form);
    syncNotifications(nextNotifications);
    closeEditor();
    showPendingPopup();
  };

  const handleToggleRead = (notification) => {
    const nextRead = !notification.read;
    const nextNotifications = setAdminNotificationRead(
      notification.id,
      nextRead,
      { markSaved: true },
    );

    syncNotifications(nextNotifications);
    void updateNotificationRead({
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
    showPendingPopup();
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

      await persistNotifications({
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
  const {
    blocker,
    cancelBlockedNavigation,
    discardAndContinueNavigation,
    saveAndContinueNavigation,
  } = useAdminLocalChanges({
    hasPendingChanges,
    onDiscard: handleDiscard,
    onSave: handleSavePendingChanges,
  });

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      <AdminPageShell
        header={adminContent.notifications.header}
        innerClassName="max-w-7xl py-6"
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
              actionCount: 1,
              content: {
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
            submitDisabled={getStableJson(form) === formSnapshot}
          />
        </AdminEditorDialog>
      )}

      {deleteTarget && (
        <DeleteDialog
          confirmText={adminContent.notifications.actions.delete}
          message={adminContent.notifications.dialogs.deleteMessage(
            deleteTarget.title || "esta notificaciÃ³n",
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
          onCancel={cancelBlockedNavigation}
          onConfirm={discardAndContinueNavigation}
          onSaveAndExit={saveAndContinueNavigation}
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
