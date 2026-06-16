import { X } from "lucide-react";
import { createPortal } from "react-dom";

import useViewportScrollLock from "../../hooks/useViewportScrollLock";
import useCloseOnRouteAttempt from "../../hooks/useCloseOnRouteAttempt";
import useDialogFocus from "../../hooks/useDialogFocus";
import { uiContent } from "../../constants/uiContent";
import IconButton from "./IconButton";

export default function SeatAssignmentModal({
  blockRouteChange = true,
  children,
  eyebrow,
  maxWidthClassName = "max-w-3xl",
  onClose,
  title,
}) {
  useViewportScrollLock(true);
  useCloseOnRouteAttempt(blockRouteChange, onClose);
  const dialogRef = useDialogFocus({ onEscape: onClose });

  return createPortal(
    <div className="rsvp-dialog-overlay" onClick={onClose}>
      <div
        aria-labelledby="seat-assignment-modal-title"
        aria-modal="true"
        className={`mt-4 premium-card max-h-[calc(100dvh-2rem)] w-full ${maxWidthClassName} overflow-y-auto p-5 text-left`}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {eyebrow && <p className="section-eyebrow mb-2">{eyebrow}</p>}
            <h2
              className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]"
              id="seat-assignment-modal-title"
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
