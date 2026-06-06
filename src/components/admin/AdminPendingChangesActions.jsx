import { Save, Undo2 } from "lucide-react";

import IconButton from "../ui/IconButton";

export default function AdminPendingChangesActions({
  discardLabel = "Deshacer cambios",
  hasPendingChanges,
  loading = false,
  onDiscard,
  onSave,
  saveLabel = "Guardar cambios",
  saving = false,
  showText = true,
}) {
  if (!hasPendingChanges) return null;

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      <div className="grid w-full grid-cols-2 gap-3">
        <IconButton
          className="w-full"
          disabled={loading || saving}
          icon={<Undo2 size={16} strokeWidth={1.8} />}
          label={discardLabel}
          onClick={onDiscard}
          showText={showText ? "always" : undefined}
          tone="secondary"
          type="button"
        >
          {showText ? discardLabel : undefined}
        </IconButton>

        <IconButton
          className="w-full"
          disabled={saving}
          icon={<Save size={16} strokeWidth={1.8} />}
          label={saveLabel}
          onClick={onSave}
          showText={showText ? "always" : undefined}
          tone="primary"
          type="button"
        >
          {showText ? saveLabel : undefined}
        </IconButton>
      </div>
    </section>
  );
}
