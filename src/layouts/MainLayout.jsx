import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import AdminAccessButton from "../components/admin/AdminAccessButton";
import NotificationsAccessButton from "../components/admin/notifications/NotificationsAccessButton";
import HelpAccessButton from "../components/help/HelpAccessButton";
import ScrollManager from "../components/ui/ScrollManager";
import { ADMIN_AUTH_EVENT, ADMIN_SESSION_KEY } from "../constants/admin";

function getAdminAuthState() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export default function MainLayout() {
  const location = useLocation();
  const pageKey = location.pathname + location.search + location.hash;
  const initialY = location.hash ? 0 : 24;
  const [isAuthenticated, setIsAuthenticated] = useState(getAdminAuthState);

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(getAdminAuthState());

    window.addEventListener(ADMIN_AUTH_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(ADMIN_AUTH_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  return (
    <div className="app-shell">
      {isAuthenticated ? <NotificationsAccessButton /> : <HelpAccessButton />}
      <AdminAccessButton />

      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0, y: initialY, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ScrollManager />
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
