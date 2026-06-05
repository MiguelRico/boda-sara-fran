import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

export default function useCloseOnRouteAttempt(enabled, onClose) {
  const blocker = useBlocker(Boolean(enabled));

  useEffect(() => {
    if (!enabled || blocker.state !== "blocked") return;

    onClose?.();
    blocker.reset?.();
  }, [blocker, enabled, onClose]);
}
