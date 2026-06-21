import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import AdminAccessButton from "../components/admin/AdminAccessButton";
import { NotificationsAccessButton } from "../components/admin/notifications";
import HelpAccessButton from "../components/help/HelpAccessButton";
import ScrollManager from "../components/ui/ScrollManager";
import useIsMobileView from "../hooks/useIsMobileView";
import {
  isAdminSessionAuthenticated,
  subscribeAdminAuthChange,
} from "../utils/adminSession";

const calmPublicPaths = new Set([
  "/",
  "/details",
  "/rsvp",
  "/rsvp/create",
  "/rsvp/edit",
]);

export default function MainLayout() {
  const location = useLocation();
  const pageKey = location.pathname + location.search + location.hash;
  const reduceMotion = useReducedMotion();
  const isMobileView = useIsMobileView();
  const useCalmPublicTransition =
    !isMobileView && calmPublicPaths.has(location.pathname);
  const initialY = location.hash || useCalmPublicTransition ? 0 : 24;
  const hiddenState =
    reduceMotion || useCalmPublicTransition
      ? { opacity: 0, y: 0, filter: "none" }
      : { opacity: 0, y: initialY, filter: "blur(8px)" };
  const visibleState =
    reduceMotion || useCalmPublicTransition
      ? { opacity: 1, y: 0, filter: "none" }
      : { opacity: 1, y: 0, filter: "blur(0px)" };
  const exitState =
    reduceMotion || useCalmPublicTransition
      ? { opacity: 0, y: 0, filter: "none" }
      : { opacity: 0, y: -24, filter: "blur(8px)" };
  const routeTransition = {
    duration: useCalmPublicTransition ? 0.22 : reduceMotion ? 0.18 : 0.8,
    ease: [0.22, 1, 0.36, 1],
  };
  const [isAuthenticated, setIsAuthenticated] = useState(
    isAdminSessionAuthenticated,
  );

  useEffect(() => {
    const syncAuthState = () =>
      setIsAuthenticated(isAdminSessionAuthenticated());

    const unsubscribeAdminAuthChange = subscribeAdminAuthChange(syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      unsubscribeAdminAuthChange();
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
          initial={hiddenState}
          animate={visibleState}
          exit={exitState}
          transition={routeTransition}
        >
          <ScrollManager />
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
