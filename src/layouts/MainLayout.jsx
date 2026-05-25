import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollManager from "../components/ui/ScrollManager";

export default function MainLayout() {
  const location = useLocation();
  const pageKey = location.pathname + location.search + location.hash;
  const initialY = location.hash ? 0 : 24;

  return (
    <div className="app-shell">
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
