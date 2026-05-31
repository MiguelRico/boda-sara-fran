import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import IconButton from "../ui/IconButton";
import useViewportScrollLock from "../../hooks/useViewportScrollLock";

export default function RsvpStatusDialog({
  children,
  closeText = "Cerrar",
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

  useViewportScrollLock(open);

  if (!open) return null;

  const handleClose = () => {
    onClose?.();

    if (closeTo) {
      navigate(closeTo);
    }
  };

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        className="premium-card rsvp-dialog-card"
        role={role}
        aria-modal="true"
        aria-labelledby="rsvp-dialog-title"
        aria-describedby="rsvp-dialog-message"
      >
        <p className="section-eyebrow mb-3">
          {eyebrow ?? (type === "success" ? "Confirmado" : "Aviso")}
        </p>

        <h2
          id="rsvp-dialog-title"
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
        >
          {title}
        </h2>

        <p
          id="rsvp-dialog-message"
          className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]"
        >
          {message}
        </p>

        {children}

        <IconButton
          className="mt-8"
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
