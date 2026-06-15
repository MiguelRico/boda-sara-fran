import { useState } from "react";
import { Save, Undo2, X } from "lucide-react";

import IconButton from "../../ui/IconButton";
import { SkeletonBlock } from "../../ui/TableSectionSkeleton";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import { adminContent } from "../../../constants/adminContent";
import { uiContent } from "../../../constants/uiContent";

export default function AdminPendingChangesActions({
  changes = [],
  discardLabel = adminContent.auth.accessMenu.discardChanges,
  dialogEyebrow = adminContent.tables.dialogs.unsavedEyebrow,
  discardDialogText = adminContent.notifications.dialogs.discardText,
  discardDialogTitle = adminContent.auth.accessMenu.discardChanges,
  hasPendingChanges,
  keepEditingLabel = adminContent.guests.dialogs.keepEditing,
  loading = false,
  onConfirmDiscard,
  onConfirmSave,
  onDiscard,
  onSave,
  saveLabel = adminContent.auth.accessMenu.saveChanges,
  saveDialogText = adminContent.guests.dialogs.pendingMessage,
  saveDialogTitle = adminContent.auth.accessMenu.saveChanges,
  saving = false,
  showSave = true,
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

  if (loading) {
    return (
      <section className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <div
          className={`grid w-full gap-3 ${
            showSave ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <SkeletonBlock className="h-11 rounded-full" />
          {showSave && <SkeletonBlock className="h-11 rounded-full" />}
        </div>
      </section>
    );
  }

  return (
    <>
      {dialogMode && (
        <UnsavedChangesDialog
          actions={
            dialogMode === "discard"
              ? [
                  {
                    disabled: saving,
                    icon: <Undo2 size={16} strokeWidth={1.8} />,
                    label: discardLabel,
                    onClick: handleDiscard,
                    tone: "danger",
                  },
                  {
                    disabled: saving,
                    icon: <X size={16} strokeWidth={1.8} />,
                    label: keepEditingLabel || uiContent.actions.close,
                    onClick: closeDialog,
                    tone: "terciary",
                  },
                ]
              : [
                  {
                    disabled: saving,
                    icon: <Undo2 size={16} strokeWidth={1.8} />,
                    label: discardLabel,
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
                    label: keepEditingLabel || uiContent.actions.close,
                    onClick: closeDialog,
                    tone: "terciary",
                  },
                ]
          }
          changes={changes}
          labels={{
            eyebrow: dialogEyebrow,
            keepEditing: keepEditingLabel || uiContent.actions.close,
            text: dialogMode === "discard" ? discardDialogText : saveDialogText,
            title:
              dialogMode === "discard" ? discardDialogTitle : saveDialogTitle,
          }}
          onCancel={closeDialog}
          titleId={`admin-pending-${dialogMode}-changes-title`}
        />
      )}

      <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4 mt-4">
        <div
          className={`grid w-full gap-3 ${
            showSave ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
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

          {showSave && (
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
          )}
        </div>
      </section>
    </>
  );
}
