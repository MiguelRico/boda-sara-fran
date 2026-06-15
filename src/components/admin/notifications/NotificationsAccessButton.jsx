import { useEffect, useRef, useState } from "react";
import { Bell, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";

import IconButton from "../../ui/IconButton";
import { ADMIN_PASSWORD } from "../../../constants/admin";
import { adminContent } from "../../../constants/adminContent";
import {
  isAdminSessionAuthenticated,
  subscribeAdminAuthChange,
} from "../../../utils/adminSession";
import { AdminNotification } from "../../../models";
import { CONFIRMATION_TYPE } from "../../../models/AdminNotification";
import { updateNotificationRead } from "../../../services/notificationsService";
import { NotificationChips } from "./NotificationCards";
import {
  getAdminDataSnapshot,
  loadAdminDataOnce,
  markAdminNotificationRead,
} from "../../../services/adminDataStore";

export default function NotificationsAccessButton() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    isAdminSessionAuthenticated,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const visibleNotifications = notifications.filter(isVisibleNotification);
  const unreadCount = visibleNotifications.length;

  const refreshNotifications = () => {
    setNotifications(
      AdminNotification.normalizeList(getAdminDataSnapshot().notifications),
    );
  };

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(isAdminSessionAuthenticated());
    };

    const unsubscribeAdminAuthChange = subscribeAdminAuthChange(syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      unsubscribeAdminAuthChange();
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    loadAdminDataOnce({ password: ADMIN_PASSWORD }).finally(
      refreshNotifications,
    );
    const intervalId = window.setInterval(refreshNotifications, 500);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleMarkRead = (notificationId) => {
    markAdminNotificationRead(notificationId, { markSaved: true });
    refreshNotifications();
    void updateNotificationRead({
      notificationId,
      password: ADMIN_PASSWORD,
      read: true,
    }).catch((error) => {
      console.error("Error actualizando notificacion en segundo plano:", error);
    });
  };

  return (
    <div className="fixed left-3 top-3 z-50" ref={menuRef}>
      <IconButton
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="relative bg-white/70 shadow-[0_18px_45px_rgba(52,69,49,0.12)] backdrop-blur-md hover:bg-white/90"
        icon={<Bell size={18} strokeWidth={1.8} />}
        keepTextOnAdminSubpages
        label={adminContent.notifications.access.label}
        onClick={() => setIsOpen((current) => !current)}
        showText
        tone="terciary"
        type="button"
      >
        {adminContent.notifications.access.shortLabel}
      </IconButton>

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent-dark)] px-1 text-[0.65rem] font-semibold text-white">
          {unreadCount}
        </span>
      )}

      {isOpen && (
        <div
          className="absolute left-0 mt-3 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white/95 p-2 shadow-[0_24px_70px_rgba(52,69,49,0.14)] backdrop-blur-md"
          role="menu"
        >
          <div className="max-h-[70vh] overflow-y-auto p-1">
            {visibleNotifications.length ? (
              <div className="grid gap-2">
                {visibleNotifications.map((notification) => (
                  <div
                    className="rounded-[1rem] border border-[var(--color-border)] bg-white/60 p-3"
                    key={notification.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="section-eyebrow mb-1">
                          {notification.type}
                        </p>
                        <h3 className="break-words font-serif text-xl leading-none text-[var(--color-accent-dark)]">
                          {notification.title}
                        </h3>
                        <NotificationChips
                          className="mt-3"
                          notification={notification}
                        />
                      </div>

                      <IconButton
                        icon={<Bell size={15} strokeWidth={1.8} />}
                        label={adminContent.notifications.actions.markRead}
                        onClick={() => handleMarkRead(notification.id)}
                        tone="primary"
                        type="button"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1rem] border border-[var(--color-border)] bg-white/60 p-4 text-center">
                <Inbox
                  className="mx-auto text-[var(--color-accent)]"
                  size={22}
                  strokeWidth={1.8}
                />
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {adminContent.notifications.access.empty}
                </p>
              </div>
            )}
          </div>

          <IconButton
            className="mt-2 w-full justify-start border-transparent bg-transparent shadow-none hover:bg-[var(--color-bg-soft)]"
            icon={<Bell size={16} strokeWidth={1.8} />}
            keepTextOnAdminSubpages
            label={adminContent.notifications.access.viewAll}
            onClick={() => {
              setIsOpen(false);
              navigate("/admin/notifications");
            }}
            role="menuitem"
            showText="always"
            tone="terciary"
            type="button"
          >
            {adminContent.notifications.access.viewAll}
          </IconButton>
        </div>
      )}
    </div>
  );
}

function isVisibleNotification(notification) {
  if (notification.read) return false;
  if (notification.type === CONFIRMATION_TYPE) return true;

  return isOneWeekOrLessAway(notification.date);
}

function isOneWeekOrLessAway(value) {
  const notificationDate = parseDateOnly(value);

  if (!notificationDate) return false;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const limitDate = new Date(todayStart);

  limitDate.setDate(limitDate.getDate() + 7);

  return notificationDate <= limitDate;
}

function parseDateOnly(value) {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}
