import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import IconButton from "../ui/IconButton";
import { UnsavedChangesDialog } from "./common";
import { ADMIN_PASSWORD } from "../../constants/admin";
import { adminContent } from "../../constants/adminContent";
import {
  clearAdminSession,
  isAdminSessionAuthenticated,
  subscribeAdminAuthChange,
} from "../../utils/adminSession";
import {
  clearAdminDataStore,
  discardAdminPendingChanges,
  getAdminPendingChangesSummary,
  hasAdminPendingChanges,
  saveAdminPendingChanges,
} from "../../services/adminDataStore";

export default function AdminAccessButton() {
  const navigate = useNavigate();
  const menuContent = adminContent.auth.accessMenu;
  const menuRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    isAdminSessionAuthenticated,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [logoutChanges, setLogoutChanges] = useState(null);
  const [savingLogoutChanges, setSavingLogoutChanges] = useState(false);

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

  const handleMainClick = () => {
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }

    setIsOpen((current) => !current);
  };

  const completeLogout = () => {
    clearAdminDataStore();
    clearAdminSession();
    setLogoutChanges(null);
    setIsOpen(false);
    navigate("/admin");
  };

  const handleDiscardAndLogout = () => {
    discardAdminPendingChanges();
    completeLogout();
  };

  const handleLogout = () => {
    if (hasAdminPendingChanges()) {
      setLogoutChanges(getAdminPendingChangesSummary());
      return;
    }

    completeLogout();
  };

  const handleSaveAndLogout = async () => {
    setSavingLogoutChanges(true);

    try {
      await saveAdminPendingChanges({ password: ADMIN_PASSWORD });
      completeLogout();
    } finally {
      setSavingLogoutChanges(false);
    }
  };

  const handleNavigateAdmin = () => {
    setIsOpen(false);
    navigate("/admin");
  };

  return (
    <div className="fixed right-3 top-3 z-50" ref={menuRef}>
      {logoutChanges && (
        <UnsavedChangesDialog
          actions={[
            {
              disabled: savingLogoutChanges,
              icon: <Trash2 size={16} strokeWidth={1.8} />,
              label: menuContent.deleteChanges,
              onClick: handleDiscardAndLogout,
              tone: "danger",
            },
            {
              disabled: savingLogoutChanges,
              icon: <Save size={16} strokeWidth={1.8} />,
              label: menuContent.saveChanges,
              onClick: handleSaveAndLogout,
              tone: "primary",
            },
            {
              disabled: savingLogoutChanges,
              icon: <X size={16} strokeWidth={1.8} />,
              label: menuContent.discardChanges,
              onClick: handleDiscardAndLogout,
              tone: "terciary",
            },
          ]}
          changes={logoutChanges}
          labels={{
            eyebrow: adminContent.tables.dialogs.unsavedEyebrow,
            keepEditing: "Cerrar",
            text: menuContent.pendingText,
            title: menuContent.pendingTitle,
          }}
          onCancel={() => setLogoutChanges(null)}
          titleId="admin-logout-unsaved-changes-title"
        />
      )}

      <IconButton
        aria-expanded={isAuthenticated ? isOpen : undefined}
        aria-haspopup={isAuthenticated ? "menu" : undefined}
        tone="terciary"
        className="bg-white/70 shadow-[0_18px_45px_rgba(52,69,49,0.12)] backdrop-blur-md hover:bg-white/90"
        icon={
          isAuthenticated ? (
            <ShieldCheck size={18} strokeWidth={1.8} />
          ) : (
            <LockKeyhole size={18} strokeWidth={1.8} />
          )
        }
        label={
          isAuthenticated ? menuContent.openAuthenticated : menuContent.openGuest
        }
        keepTextOnAdminSubpages
        onClick={handleMainClick}
        showText
        type="button"
      >
        {menuContent.adminLabel}
      </IconButton>

      {isAuthenticated && isOpen && (
        <div
          className="absolute right-0 mt-3 w-52 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white/90 p-2 shadow-[0_24px_70px_rgba(52,69,49,0.14)] backdrop-blur-md"
          role="menu"
        >
          <IconButton
            className="w-full justify-start border-transparent bg-transparent shadow-none hover:bg-[var(--color-bg-soft)]"
            icon={<LayoutDashboard size={16} strokeWidth={1.8} />}
            keepTextOnAdminSubpages
            label={menuContent.panel}
            onClick={handleNavigateAdmin}
            role="menuitem"
            showText="always"
            type="button"
            tone="terciary"
          >
            {menuContent.panel}
          </IconButton>

          <IconButton
            className="w-full justify-start border-transparent bg-transparent shadow-none hover:bg-[var(--color-bg-soft)]"
            icon={<LogOut size={16} strokeWidth={1.8} />}
            keepTextOnAdminSubpages
            label={menuContent.logout}
            onClick={handleLogout}
            role="menuitem"
            showText="always"
            type="button"
            tone="terciary"
          >
            {menuContent.logout}
          </IconButton>
        </div>
      )}
    </div>
  );
}
