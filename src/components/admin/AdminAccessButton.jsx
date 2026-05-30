import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ADMIN_AUTH_EVENT, ADMIN_SESSION_KEY } from "../../constants/admin";

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
    <div
      className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5"
      ref={menuRef}
    >
      <button
        aria-expanded={isAuthenticated ? isOpen : undefined}
        aria-haspopup={isAuthenticated ? "menu" : undefined}
        aria-label={isAuthenticated ? "Abrir menu admin" : "Acceso admin"}
        className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white/70 px-3 text-[var(--color-accent-dark)] shadow-[0_18px_45px_rgba(52,69,49,0.12)] backdrop-blur-md transition-all duration-500 hover:-translate-y-0.5 hover:bg-white/90 sm:h-12 sm:px-4"
        onClick={handleMainClick}
        type="button"
      >
        {isAuthenticated ? (
          <ShieldCheck size={18} strokeWidth={1.8} />
        ) : (
          <LockKeyhole size={18} strokeWidth={1.8} />
        )}
        <span className="hidden text-[0.66rem] uppercase tracking-[0.2em] sm:inline">
          Admin
        </span>
      </button>

      {isAuthenticated && isOpen && (
        <div
          className="absolute right-0 mt-3 w-52 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white/90 p-2 shadow-[0_24px_70px_rgba(52,69,49,0.14)] backdrop-blur-md"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm text-[var(--color-accent-dark)] transition-all duration-300 hover:bg-[var(--color-bg-soft)]"
            onClick={handleNavigateAdmin}
            role="menuitem"
            type="button"
          >
            <LayoutDashboard size={16} strokeWidth={1.8} />
            Panel admin
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm text-[var(--color-muted)] transition-all duration-300 hover:bg-[var(--color-bg-soft)]"
            onClick={handleLogout}
            role="menuitem"
            type="button"
          >
            <LogOut size={16} strokeWidth={1.8} />
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}
