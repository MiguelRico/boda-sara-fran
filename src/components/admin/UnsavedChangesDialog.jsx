import { createPortal } from "react-dom";
import { Save, Trash2, X } from "lucide-react";

import IconButton from "../ui/IconButton";
import useViewportScrollLock from "../../hooks/useViewportScrollLock";

export default function UnsavedChangesDialog({
  changes,
  labels,
  onCancel,
  onConfirm,
  onSaveAndExit,
  titleId = "unsaved-changes-title",
}) {
  useViewportScrollLock(true);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="premium-card rsvp-dialog-card"
        role="alertdialog"
      >
        <p className="section-eyebrow mb-3">{labels.eyebrow}</p>
        <h2
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
          id={titleId}
        >
          {labels.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          {labels.text}
        </p>
        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-left text-sm text-[var(--color-muted)]">
          {changes.map((change, index) => (
            <li
              className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
              key={`${getChangeTitle(change)}-${index}`}
            >
              <p className="font-medium text-[var(--color-accent-dark)]">
                {getChangeTitle(change)}
              </p>
              {Array.isArray(change?.details) && change.details.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
                  {change.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <IconButton
            className="flex-1"
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label={labels.exitWithoutSaving}
            onClick={onConfirm}
            showText="always"
            tone="danger"
            type="button"
          >
            {labels.exitWithoutSaving}
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<Save size={16} strokeWidth={1.8} />}
            label={labels.saveAndExit}
            onClick={onSaveAndExit}
            showText="always"
            tone="primary"
            type="button"
          >
            {labels.saveAndExit}
          </IconButton>
          <IconButton
            className="flex-1"
            icon={<X size={16} strokeWidth={1.8} />}
            label={labels.keepEditing}
            onClick={onCancel}
            showText="always"
            tone="terciary"
            type="button"
          >
            {labels.keepEditing}
          </IconButton>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function getChangeTitle(change) {
  if (typeof change === "string") return change;

  return change?.title || "Cambio sin guardar";
}
