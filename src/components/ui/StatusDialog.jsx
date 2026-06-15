import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import useViewportScrollLock from "../../hooks/useViewportScrollLock";
import useCloseOnRouteAttempt from "../../hooks/useCloseOnRouteAttempt";
import useDialogFocus from "../../hooks/useDialogFocus";
import { uiContent } from "../../constants/uiContent";
import IconButton from "./IconButton";

export default function StatusDialog({
  children,
  closeText = uiContent.actions.close,
  closeTo,
  eyebrow,
  message,
  onClose,
  open,
  role = "alertdialog",
  title,
  type = "success",
}) {
  const navigate = useNavigate();
  const dialogRef = useDialogFocus({
    enabled: open,
    onEscape: onClose,
  });

  useViewportScrollLock(open);
  useCloseOnRouteAttempt(open && !closeTo, onClose);

  if (!open) return null;

  const handleClose = () => {
    if (closeTo) {
      navigate(closeTo);
      return;
    }

    onClose?.();
  };

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        className="premium-card rsvp-dialog-card relative"
        role={role}
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        aria-describedby="status-dialog-message"
        ref={dialogRef}
        tabIndex={-1}
      >
        <IconButton
          className="absolute right-4 top-4"
          data-autofocus="true"
          icon={<X size={17} strokeWidth={1.8} />}
          label={closeText}
          onClick={handleClose}
          type="button"
        />
        <p className="section-eyebrow mb-3">
          {eyebrow ??
            (type === "success"
              ? uiContent.dialog.successEyebrow
              : uiContent.dialog.warningEyebrow)}
        </p>

        <h2
          id="status-dialog-title"
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
        >
          {title}
        </h2>

        <p
          id="status-dialog-message"
          className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]"
        >
          {message}
        </p>

        {children}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
