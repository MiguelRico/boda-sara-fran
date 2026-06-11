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
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import {
  ADMIN_AUTH_EVENT,
  ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
} from "../../constants/admin";
import { adminContent } from "../../constants/adminContent";
import {
  clearAdminDataStore,
  getAdminPendingChangesSummary,
  hasAdminPendingChanges,
  saveAdminPendingChanges,
} from "../../services/adminDataStore";

function getAdminAuthState() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export default function AdminAccessButton() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(getAdminAuthState);
  const [isOpen, setIsOpen] = useState(false);
  const [logoutChanges, setLogoutChanges] = useState(null);
  const [savingLogoutChanges, setSavingLogoutChanges] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(getAdminAuthState());
    };

    window.addEventListener(ADMIN_AUTH_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(ADMIN_AUTH_EVENT, syncAuthState);
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
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
    setLogoutChanges(null);
    setIsOpen(false);
    navigate("/admin");
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
    <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5" ref={menuRef}>
      {logoutChanges && (
        <UnsavedChangesDialog
          actions={[
            {
              disabled: savingLogoutChanges,
              icon: <Trash2 size={16} strokeWidth={1.8} />,
              label: "Eliminar cambios",
              onClick: completeLogout,
              tone: "danger",
            },
            {
              disabled: savingLogoutChanges,
              icon: <Save size={16} strokeWidth={1.8} />,
              label: "Guardar cambios",
              onClick: handleSaveAndLogout,
              tone: "primary",
            },
            {
              disabled: savingLogoutChanges,
              icon: <X size={16} strokeWidth={1.8} />,
              label: "Deshacer cambios",
              onClick: () => setLogoutChanges(null),
              tone: "terciary",
            },
          ]}
          changes={logoutChanges}
          labels={{
            eyebrow: adminContent.tables.dialogs.unsavedEyebrow,
            text: "Eliminar cambios limpiara todo cambio en memoria de admin. Guardar cambios los enviara a Apps Script antes de cerrar sesion.",
            title: "Cambios pendientes",
          }}
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
        label={isAuthenticated ? "Abrir menu admin" : "Acceso admin"}
        onClick={handleMainClick}
        showText
        type="button"
      >
        Admin
      </IconButton>

      {isAuthenticated && isOpen && (
        <div
          className="absolute right-0 mt-3 w-52 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white/90 p-2 shadow-[0_24px_70px_rgba(52,69,49,0.14)] backdrop-blur-md"
          role="menu"
        >
          <IconButton
            className="w-full justify-start border-transparent bg-transparent shadow-none hover:bg-[var(--color-bg-soft)]"
            icon={<LayoutDashboard size={16} strokeWidth={1.8} />}
            label="Panel admin"
            onClick={handleNavigateAdmin}
            role="menuitem"
            showText="always"
            type="button"
            tone="terciary"
          >
            Panel admin
          </IconButton>

          <IconButton
            className="w-full justify-start border-transparent bg-transparent shadow-none hover:bg-[var(--color-bg-soft)]"
            icon={<LogOut size={16} strokeWidth={1.8} />}
            label="Cerrar sesion"
            onClick={handleLogout}
            role="menuitem"
            showText="always"
            type="button"
            tone="terciary"
          >
            Cerrar sesion
          </IconButton>
        </div>
      )}
    </div>
  );
}
