import { Search } from "lucide-react";

import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import {
  inputClassName,
  Label,
  selectClassName,
} from "@/components/rsvp/FormPrimitives";
import { adminContent } from "@/constants/adminContent";
import { AdminNotification } from "@/models";
import { READ_FILTERS } from "@/utils/notificationPageUtils";

export default function NotificationFilters({
  onQueryChange,
  onReadFilterChange,
  onTypeFilterChange,
  query,
  readFilter,
  typeFilter,
}) {
  const content = adminContent.notifications.filters;
  const selectedType = AdminNotification.types.find(
    (type) => type === typeFilter,
  );
  const selectedReadFilter = READ_FILTERS.find(
    (filter) => filter.value === readFilter,
  );
  const activeFilters = [
    query.trim()
      ? {
          key: "query",
          label: query.trim(),
          onRemove: () => onQueryChange(""),
        }
      : null,
    selectedType
      ? {
          key: "type",
          label: selectedType,
          onRemove: () => onTypeFilterChange(""),
        }
      : null,
    readFilter && selectedReadFilter
      ? {
          key: "read",
          label: selectedReadFilter.label,
          onRemove: () => onReadFilterChange(""),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel activeFilters={activeFilters} title={content.eyebrow}>
      <div className="grid gap-4">
        <div>
          <Label>{content.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={content.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>{content.typeLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onTypeFilterChange(event.target.value)}
            value={typeFilter}
          >
            <option value="">{content.allTypes}</option>
            {AdminNotification.types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>{content.readLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onReadFilterChange(event.target.value)}
            value={readFilter}
          >
            {READ_FILTERS.map((filter) => (
              <option key={filter.value || "all"} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CollapsiblePanel>
  );
}
