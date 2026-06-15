import { createPortal } from "react-dom";
import { Save, Trash2, X } from "lucide-react";

import IconButton from "../../ui/IconButton";
import useViewportScrollLock from "../../../hooks/useViewportScrollLock";
import useDialogFocus from "../../../hooks/useDialogFocus";

export default function UnsavedChangesDialog({
  actions,
  changes,
  labels,
  onCancel,
  onConfirm,
  onSaveAndExit,
  titleId = "unsaved-changes-title",
}) {
  useViewportScrollLock(true);
  const dialogRef = useDialogFocus({ onEscape: onCancel });
  const uniqueChanges = getUniqueChanges(changes);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="premium-card rsvp-dialog-card relative flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <IconButton
          className="absolute right-4 top-4"
          data-autofocus="true"
          icon={<X size={17} strokeWidth={1.8} />}
          label={labels.keepEditing || "Cerrar"}
          onClick={onCancel}
          type="button"
        />
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
        <DialogActions
          actions={actions}
          labels={labels}
          onConfirm={onConfirm}
          onSaveAndExit={onSaveAndExit}
        />
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <ul className="space-y-2 text-left text-sm text-[var(--color-muted)]">
            {uniqueChanges.map((change, index) => (
              <li
                className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
                key={`${getChangeTitle(change)}-${index}`}
              >
                <p className="font-medium text-[var(--color-accent-dark)]">
                  {getChangeTitle(change)}
                </p>
                {Array.isArray(change?.details) &&
                  change.details.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
                      {change.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function DialogActions({
  actions,
  labels,
  onConfirm,
  onSaveAndExit,
}) {
  const dialogActions =
    actions ||
    [
      {
        icon: <Trash2 size={16} strokeWidth={1.8} />,
        label: labels.exitWithoutSaving,
        onClick: onConfirm,
        tone: "danger",
      },
      {
        icon: <Save size={16} strokeWidth={1.8} />,
        label: labels.saveAndExit,
        onClick: onSaveAndExit,
        tone: "primary",
      },
    ].filter((action) => action.label && action.onClick);
  const filteredActions = dialogActions.filter(
    (action) => !isCancelLikeAction(action, labels),
  );

  return (
    <div className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <div className="grid gap-3">
        {filteredActions.map((action) => (
          <IconButton
            className="w-full"
            disabled={action.disabled}
            icon={action.icon}
            keepTextOnAdminSubpages
            key={action.label}
            label={action.label}
            onClick={action.onClick}
            showText="always"
            tone={action.tone}
            type="button"
          >
            {action.label}
          </IconButton>
        ))}
      </div>
    </div>
  );
}

function isCancelLikeAction(action, labels) {
  const label = String(action?.label || "").toLowerCase();
  const keepEditing = String(labels?.keepEditing || "").toLowerCase();

  return (
    (keepEditing && label === keepEditing) ||
    label.includes("seguir editando") ||
    label.includes("cancelar") ||
    label.includes("cerrar")
  );
}

function getChangeTitle(change) {
  if (typeof change === "string") return change;

  return change?.title || "Cambio sin guardar";
}

function getUniqueChanges(changes = []) {
  const seen = new Set();

  return changes
    .map((change) =>
      typeof change === "string"
        ? change
        : {
            ...change,
            details: Array.isArray(change?.details)
              ? Array.from(new Set(change.details))
              : change?.details,
          },
    )
    .filter((change) => {
      const key = JSON.stringify({
        details: Array.isArray(change?.details) ? change.details : [],
        title: getChangeTitle(change),
      });

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}
