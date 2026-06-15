import { useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

import useViewportScrollLock from "../../hooks/useViewportScrollLock";
import useCloseOnRouteAttempt from "../../hooks/useCloseOnRouteAttempt";
import useDialogFocus from "../../hooks/useDialogFocus";
import { uiContent } from "../../constants/uiContent";
import IconButton from "./IconButton";

export default function DeleteDialog({
  cancelText = uiContent.actions.cancel,
  children,
  confirmText = uiContent.actions.delete,
  message,
  onCancel,
  onConfirm,
  title,
}) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useDialogFocus({ onEscape: onCancel });

  useViewportScrollLock(true);
  useCloseOnRouteAttempt(true, onCancel);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="premium-card rsvp-dialog-card"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <AlertTriangle
          className="mx-auto text-red-500"
          size={30}
          strokeWidth={1.7}
        />
        <h2
          className="mt-4 font-serif text-4xl leading-none text-[var(--color-accent-dark)]"
          id={titleId}
        >
          {title}
        </h2>
        <p
          className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]"
          id={messageId}
        >
          {message}
        </p>
        {children}
        <div className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
          <div className="flex flex-col gap-3">
            <IconButton
              className="flex-1"
              icon={<Trash2 size={16} strokeWidth={1.8} />}
              label={confirmText}
              onClick={onConfirm}
              showText="always"
              tone="danger"
              type="button"
            >
              {confirmText}
            </IconButton>
            <IconButton
              className="flex-1"
              data-autofocus="true"
              icon={<X size={16} strokeWidth={1.8} />}
              label={cancelText}
              onClick={onCancel}
              showText="always"
              tone="terciary"
              type="button"
            >
              {cancelText}
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
