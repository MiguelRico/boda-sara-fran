import { useEffect, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function useDialogFocus({ enabled = true, onEscape } = {}) {
  const dialogRef = useRef(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return undefined;

    const dialog = dialogRef.current;
    const previousActiveElement = document.activeElement;

    if (!dialog) return undefined;

    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );
    const focusTarget =
      dialog.querySelector("[data-autofocus='true']") ||
      getFocusableElements()[0] ||
      dialog;

    window.setTimeout(() => {
      focusTarget.focus?.({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();

      if (!focusableElements.length) {
        event.preventDefault();
        dialog.focus?.({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (
        previousActiveElement &&
        typeof previousActiveElement.focus === "function"
      ) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [enabled]);

  return dialogRef;
}
