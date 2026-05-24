import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollManager from "../components/common/ScrollManager";

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <ScrollManager />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname + location.search + location.hash}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
