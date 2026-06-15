import { Pencil, Trash2 } from "lucide-react";

import { uiContent } from "../../../constants/uiContent";
import IconButton from "../../ui/IconButton";

export default function CardActions({
  className = "grid w-full min-w-0 grid-cols-2 gap-2",
  deleteLabel = uiContent.actions.delete,
  editLabel = uiContent.actions.edit,
  item,
  onDelete,
  onEdit,
  extraActions,
  showText = true,
  stopPropagation = false,
}) {
  if (!onEdit && !onDelete && !extraActions) return null;

  return (
    <div className={className}>
      {onDelete && (
        <IconButton
          className="w-full min-w-0 basis-0 !shrink !gap-1.5 !px-3"
          icon={<Trash2 size={16} strokeWidth={1.8} />}
          label={deleteLabel}
          onClick={(event) => {
            if (stopPropagation) event.stopPropagation();
            onDelete(item);
          }}
          showText={showText ? "always" : undefined}
          tone="danger"
          type="button"
        >
          {showText ? deleteLabel : undefined}
        </IconButton>
      )}
      {onEdit && (
        <IconButton
          className="w-full min-w-0 basis-0 !shrink !gap-1.5 !px-3"
          icon={<Pencil size={16} strokeWidth={1.8} />}
          label={editLabel}
          onClick={(event) => {
            if (stopPropagation) event.stopPropagation();
            onEdit(item);
          }}
          showText={showText ? "always" : undefined}
          tone="primary"
          type="button"
        >
          {showText ? editLabel : undefined}
        </IconButton>
      )}
      {extraActions}
    </div>
  );
}
