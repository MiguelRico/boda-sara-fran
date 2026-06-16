import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function useCloseOnRouteAttempt(enabled, onClose) {
  const location = useLocation();
  const initialLocationKeyRef = useRef(location.key);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!enabled) {
      initialLocationKeyRef.current = location.key;
    }
  }, [enabled, location.key]);

  useEffect(() => {
    if (!enabled) return;
    if (location.key === initialLocationKeyRef.current) return;

    onCloseRef.current?.();
  }, [enabled, location.key]);
}
