import { useState } from "react";
import { Save, Trash2, Undo2, X } from "lucide-react";

import IconButton from "../ui/IconButton";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import { adminContent } from "../../constants/adminContent";

export default function AdminPendingChangesActions({
  changes = [],
  discardLabel = "Deshacer cambios",
  dialogEyebrow = adminContent.tables.dialogs.unsavedEyebrow,
  discardDialogText = "Eliminar cambios limpiara todo cambio en memoria de admin.",
  discardDialogTitle = "Eliminar cambios",
  hasPendingChanges,
  keepEditingLabel = "Seguir editando",
  loading = false,
  onConfirmDiscard,
  onConfirmSave,
  onDiscard,
  onSave,
  saveLabel = "Guardar cambios",
  saveDialogText = "Se enviaran estos cambios a Apps Script.",
  saveDialogTitle = "Guardar cambios",
  saving = false,
  showText = true,
}) {
  const [dialogMode, setDialogMode] = useState(null);
  const isDisabled = !hasPendingChanges || loading || saving;
  const closeDialog = () => setDialogMode(null);
  const handleDiscard = async () => {
    const result = await (onConfirmDiscard || onDiscard)?.();

    if (result !== false) {
      closeDialog();
    }
  };
  const handleSave = async () => {
    const result = await (onConfirmSave || onSave)?.();

    if (result !== false) {
      closeDialog();
    }
  };

  return (
    <>
      {dialogMode && (
        <UnsavedChangesDialog
          actions={
            dialogMode === "discard"
              ? [
                  {
                    disabled: saving,
                    icon: <Trash2 size={16} strokeWidth={1.8} />,
                    label: "Eliminar cambios",
                    onClick: handleDiscard,
                    tone: "danger",
                  },
                  {
                    disabled: saving,
                    icon: <Save size={16} strokeWidth={1.8} />,
                    label: saveLabel,
                    onClick: handleSave,
                    tone: "primary",
                  },
                  {
                    disabled: saving,
                    icon: <X size={16} strokeWidth={1.8} />,
                    label: keepEditingLabel,
                    onClick: closeDialog,
                    tone: "terciary",
                  },
                ]
              : [
                  {
                    disabled: saving,
                    icon: <Save size={16} strokeWidth={1.8} />,
                    label: saveLabel,
                    onClick: handleSave,
                    tone: "primary",
                  },
                  {
                    disabled: saving,
                    icon: <X size={16} strokeWidth={1.8} />,
                    label: keepEditingLabel,
                    onClick: closeDialog,
                    tone: "terciary",
                  },
                ]
          }
          changes={changes}
          labels={{
            eyebrow: dialogEyebrow,
            text: dialogMode === "discard" ? discardDialogText : saveDialogText,
            title:
              dialogMode === "discard" ? discardDialogTitle : saveDialogTitle,
          }}
          titleId={`admin-pending-${dialogMode}-changes-title`}
        />
      )}

      <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <div className="grid w-full grid-cols-2 gap-3">
          <IconButton
            className="w-full"
            disabled={isDisabled}
            icon={<Undo2 size={16} strokeWidth={1.8} />}
            label={discardLabel}
            onClick={() => setDialogMode("discard")}
            showText={showText ? "always" : undefined}
            tone="secondary"
            type="button"
          >
            {showText ? discardLabel : undefined}
          </IconButton>

          <IconButton
            className="w-full"
            disabled={isDisabled}
            icon={<Save size={16} strokeWidth={1.8} />}
            label={saveLabel}
            onClick={() => setDialogMode("save")}
            showText={showText ? "always" : undefined}
            tone="primary"
            type="button"
          >
            {showText ? saveLabel : undefined}
          </IconButton>
        </div>
      </section>
    </>
  );
}
