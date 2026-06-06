import { Plus, Save, Undo2 } from "lucide-react";

import CardActions from "./CardActions";
import IconButton from "../ui/IconButton";

export default function AdminEntityActions({
  addLabel,
  deleteLabel,
  discardLabel,
  editLabel,
  hasItems,
  hasPendingChanges,
  loading = false,
  onCreate,
  onDelete,
  onDiscard,
  onEdit,
  onSave,
  saveLabel,
  saving = false,
  selectedItem,
  showText = true,
}) {
  if (!hasItems && !hasPendingChanges) {
    if (!onCreate) return null;

    return (
      <div className="grid w-full gap-3">
        <IconButton
          className="w-full"
          icon={<Plus size={18} strokeWidth={2.4} />}
          label={addLabel}
          onClick={onCreate}
          showText={showText ? "always" : undefined}
          tone="primary"
          type="button"
        >
          {showText ? addLabel : undefined}
        </IconButton>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-3">
      {hasPendingChanges && (
        <div className="grid w-full grid-cols-2 gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-3">
          <IconButton
            className="w-full"
            disabled={loading}
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
      )}

      <div
        className={`grid w-full gap-3 sm:w-auto ${
          hasItems ? "grid-cols-3 sm:grid-cols-3" : "grid-cols-1"
        }`}
      >
        {hasItems && (
          <CardActions
            className="contents"
            deleteLabel={deleteLabel}
            editLabel={editLabel}
            item={selectedItem}
            onDelete={selectedItem ? onDelete : null}
            onEdit={selectedItem ? onEdit : null}
            showText={showText}
          />
        )}

        {onCreate && (
          <IconButton
            className="w-full"
            icon={<Plus size={18} strokeWidth={2.4} />}
            label={addLabel}
            onClick={onCreate}
            tone="primary"
            type="button"
          >
            {showText ? addLabel : undefined}
          </IconButton>
        )}
      </div>
    </div>
  );
}
