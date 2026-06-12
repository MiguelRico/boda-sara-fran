import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, X } from "lucide-react";

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
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
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
  const [editingNotification, setEditingNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});
  const [hasPendingChanges, setHasPendingChanges] = useState(
    hasAdminPendingChanges,
  );
  const pendingChanges = getAdminNotificationChangesSummary();
  const blocker = useUnsavedChangesNavigation(hasPendingChanges);
  const totalPages = Math.max(
    1,
    Math.ceil(state.notifications.length / pageSize),
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
            contentRef={tableStartRef}
            eyebrow={adminContent.notifications.list.eyebrow}
            getKey={(notification) => notification.id}
            isMobileView={isMobileView}
            items={state.notifications}
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
