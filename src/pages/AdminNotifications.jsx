import { useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bell, Trash2, X } from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
import AdminPageShell from "../components/admin/AdminPageShell";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import NotificationCards from "../components/admin/notifications/NotificationCards";
import NotificationForm from "../components/admin/notifications/NotificationForm";
import StatusDialog from "../components/ui/StatusDialog";
import { TableCardsSkeleton } from "../components/ui/TableSectionSkeleton";
import { adminContent } from "../constants/adminContent";
import { AdminNotification } from "../models";
import {
  discardAdminNotificationChanges,
  getAdminDataSnapshot,
  getAdminNotificationChangesSummary,
  hasAdminPendingChanges,
  loadAdminDataOnce,
  markAdminNotificationRead,
  upsertAdminNotification,
} from "../services/adminDataStore";
import useIsMobileView from "../hooks/useIsMobileView";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";

const createEmptyForm = () => AdminNotification.create();

export default function AdminNotifications() {
  const notificationsRef = useRef(null);
  const notificationsInView = useInView(notificationsRef, {
    once: true,
    amount: 0.12,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const isMobileView = useIsMobileView();
  const [state, setState] = useState({
    error: "",
    loading: true,
    notifications: [],
  });
  const [form, setForm] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});
  const [hasPendingChanges, setHasPendingChanges] = useState(
    hasAdminPendingChanges,
  );
  const pendingChanges = getAdminNotificationChangesSummary();
  const blocker = useUnsavedChangesNavigation(hasPendingChanges);

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

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleCreateNotification = (event) => {
    event.preventDefault();

    const validationErrors = AdminNotification.validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    const nextNotifications = upsertAdminNotification(form);
    syncNotifications(nextNotifications);
    setForm(createEmptyForm());
  };

  const handleMarkRead = (notificationId) => {
    const nextNotifications = markAdminNotificationRead(notificationId);
    syncNotifications(nextNotifications);
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
          <NotificationForm
            errors={errors}
            form={form}
            onChange={handleFormChange}
            onSubmit={handleCreateNotification}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem
          index={4}
          isVisible={notificationsInView}
        >
          <section className="premium-card">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
                <Bell size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="section-eyebrow mb-2">
                  {adminContent.notifications.list.eyebrow}
                </p>
                <h2 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
                  {adminContent.notifications.list.title}
                </h2>
              </div>
            </div>

            {state.loading ? (
              <TableCardsSkeleton
                columnsClassName="lg:grid-cols-2"
                count={4}
                itemClassName="min-h-40"
                lines={2}
              />
            ) : (
              <NotificationCards
                emptyText={adminContent.notifications.list.emptyText}
                emptyTitle={adminContent.notifications.list.emptyTitle}
                notifications={state.notifications}
                onMarkRead={handleMarkRead}
              />
            )}
          </section>
        </CinematicStaggeredRevealItem>
      </AdminPageShell>

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
