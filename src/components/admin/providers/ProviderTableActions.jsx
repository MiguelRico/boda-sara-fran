import { Plus } from "lucide-react";

import IconButton from "../../ui/IconButton";
import { adminContent } from "../../../constants/adminContent";

export default function ProviderTableActions({
  loading,
  onCreate,
  showText,
}) {
  if (!onCreate) return null;

  return (
    <div className="grid w-full gap-3">
      <IconButton
        className="w-full"
        disabled={loading}
        icon={<Plus size={18} strokeWidth={2.4} />}
        label={adminContent.providers.actions.add}
        onClick={onCreate}
        showText={showText ? "always" : undefined}
        tone="primary"
        type="button"
      >
        {showText ? adminContent.providers.actions.add : undefined}
      </IconButton>
    </div>
  );
}
