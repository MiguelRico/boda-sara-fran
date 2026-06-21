import { Search } from "lucide-react";

import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import { TextField } from "@/components/ui/FormFields";
import {
  inputClassName,
  Label,
  selectClassName,
} from "@/components/rsvp/FormPrimitives";
import { adminContent } from "@/constants/adminContent";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/constants/tasks";

export default function TaskFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onPriorityChange,
  onQueryChange,
  onStatusChange,
  priority,
  query,
  status,
}) {
  const content = adminContent.tasks.filters;
  const selectedStatus = TASK_STATUSES.find((item) => item.value === status);
  const selectedPriority = TASK_PRIORITIES.find(
    (item) => item.value === priority,
  );
  const activeFilters = [
    query.trim()
      ? { key: "query", label: query.trim(), onRemove: () => onQueryChange("") }
      : null,
    selectedStatus
      ? {
          key: "status",
          label: selectedStatus.label,
          onRemove: () => onStatusChange(""),
        }
      : null,
    selectedPriority
      ? {
          key: "priority",
          label: selectedPriority.label,
          onRemove: () => onPriorityChange(""),
        }
      : null,
    dateFrom
      ? {
          key: "dateFrom",
          label: dateFrom,
          onRemove: () => onDateFromChange(""),
        }
      : null,
    dateTo
      ? { key: "dateTo", label: dateTo, onRemove: () => onDateToChange("") }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel activeFilters={activeFilters} title={content.eyebrow}>
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
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
            <Label>{content.statusLabel}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onStatusChange(event.target.value)}
              value={status}
            >
              <option value="">{content.allStatuses}</option>
              <option value="pending">{content.pending}</option>
              <option value="completed">{content.completed}</option>
            </select>
          </div>

          <div>
            <Label>{content.priorityLabel}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onPriorityChange(event.target.value)}
              value={priority}
            >
              <option value="">{content.allPriorities}</option>
              {TASK_PRIORITIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DateFilter
            label={content.dateFromLabel}
            onChange={onDateFromChange}
            value={dateFrom}
          />
          <DateFilter
            label={content.dateToLabel}
            onChange={onDateToChange}
            value={dateTo}
          />
        </div>
      </div>
    </CollapsiblePanel>
  );
}

function DateFilter({ label, onChange, value }) {
  return (
    <TextField label={label} onChange={onChange} type="date" value={value} />
  );
}
