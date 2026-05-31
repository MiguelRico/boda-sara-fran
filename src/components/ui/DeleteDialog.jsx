import { useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

import useViewportScrollLock from "../../hooks/useViewportScrollLock";
import IconButton from "./IconButton";

export default function DeleteDialog({
  cancelText = "Cancelar",
  confirmText = "Eliminar",
  message,
  onCancel,
  onConfirm,
  title,
}) {
  const titleId = useId();
  const messageId = useId();

  useViewportScrollLock(true);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="premium-card rsvp-dialog-card"
        role="alertdialog"
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
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <IconButton
            className="flex-1"
            icon={<X size={16} strokeWidth={1.8} />}
            label={cancelText}
            onClick={onCancel}
            showText="always"
            tone="secondary"
            type="button"
          >
            {cancelText}
          </IconButton>
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
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
