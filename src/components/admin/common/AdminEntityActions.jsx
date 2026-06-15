import { Plus } from "lucide-react";

import CardActions from "./CardActions";
import IconButton from "../../ui/IconButton";

export default function AdminEntityActions({
  addLabel,
  deleteLabel,
  discardLabel,
  editLabel,
  hasItems,
  onCreate,
  onDelete,
  onEdit,
  selectedItem,
  showText = true,
}) {
  void discardLabel;

  if (!hasItems) {
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
      <div
        className={`grid w-full gap-3 ${
          hasItems ? "grid-cols-3" : "grid-cols-1"
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
