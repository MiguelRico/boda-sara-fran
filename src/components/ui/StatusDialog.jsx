import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

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
        className="premium-card rsvp-dialog-card"
        role={role}
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        aria-describedby="status-dialog-message"
        ref={dialogRef}
        tabIndex={-1}
      >
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

        <IconButton
          className="mt-8"
          data-autofocus="true"
          icon={<Check size={16} strokeWidth={1.8} />}
          onClick={handleClose}
          tone="primary"
          type="button"
          showText="always"
        >
          {closeText}
        </IconButton>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
