import { X } from "lucide-react";
import { createPortal } from "react-dom";

import useViewportScrollLock from "../../../hooks/useViewportScrollLock";
import useCloseOnRouteAttempt from "../../../hooks/useCloseOnRouteAttempt";
import useDialogFocus from "../../../hooks/useDialogFocus";
import { uiContent } from "../../../constants/uiContent";
import IconButton from "../../ui/IconButton";

export default function EditorDialog({
  children,
  onClose,
  title,
  titleId = "editor-dialog-title",
}) {
  useViewportScrollLock(true);
  useCloseOnRouteAttempt(true, onClose);
  const dialogRef = useDialogFocus({ onEscape: onClose });

  return createPortal(
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="premium-card max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto p-5"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2
              className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]"
              id={titleId}
            >
              {title}
            </h2>
          </div>

          <IconButton
            data-autofocus="true"
            label={uiContent.actions.close}
            onClick={onClose}
          >
            <X size={17} strokeWidth={1.8} />
          </IconButton>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
