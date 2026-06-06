import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import IconButton from "../ui/IconButton";
import { ADMIN_AUTH_EVENT, ADMIN_SESSION_KEY } from "../../constants/admin";
import {
  clearAdminDataStore,
  hasAdminPendingChanges,
} from "../../services/adminDataStore";

function getAdminAuthState() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export default function AdminAccessButton() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(getAdminAuthState);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleLogout = () => {
    if (
      hasAdminPendingChanges() &&
      !window.confirm(
        "Hay cambios sin guardar en memoria. Si cierras sesion se perderan.",
      )
    ) {
      setIsOpen(false);
      return;
    }

    clearAdminDataStore();
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
    setIsOpen(false);
    navigate("/admin");
  };

  const handleNavigateAdmin = () => {
    setIsOpen(false);
    navigate("/admin");
  };

  return (
    <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5" ref={menuRef}>
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
