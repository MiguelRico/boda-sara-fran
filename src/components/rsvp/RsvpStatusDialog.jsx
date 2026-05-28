import { createPortal } from "react-dom";
import useViewportScrollLock from "../../hooks/useViewportScrollLock";

export default function RsvpStatusDialog({ popup, onClose }) {
  useViewportScrollLock(popup.open);

  if (!popup.open) return null;

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        className="premium-card rsvp-dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rsvp-dialog-title"
        aria-describedby="rsvp-dialog-message"
      >
        <p className="section-eyebrow mb-3">
          {popup.type === "success" ? "Confirmado" : "Aviso"}
        </p>

        <h2
          id="rsvp-dialog-title"
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
        >
          {popup.title}
        </h2>

        <p
          id="rsvp-dialog-message"
          className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]"
        >
          {popup.message}
        </p>

        <button type="button" onClick={onClose} className="btn-primary mt-8">
          Entendido
        </button>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
