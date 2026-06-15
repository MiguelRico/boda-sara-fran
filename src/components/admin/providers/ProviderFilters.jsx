import { Search } from "lucide-react";

import CollapsiblePanel from "../../ui/CollapsiblePanel";
import {
  inputClassName,
  Label,
  selectClassName,
} from "../../rsvp/FormPrimitives";
import { PROVIDER_CATEGORIES } from "../../../constants/providers";
import { adminContent } from "../../../constants/adminContent";

export default function ProviderFilters({
  category = "",
  onCategoryChange,
  onPaymentStatusChange,
  onQueryChange,
  paymentStatus = "",
  query,
  showCategory = true,
  showPaymentStatus = false,
}) {
  const selectedCategory = showCategory
    ? PROVIDER_CATEGORIES.find((item) => item.value === category)
    : null;
  const selectedPaymentStatus = adminContent.providers.filters.paymentStatuses.find(
    (item) => item.value === paymentStatus,
  );
  const activeFilters = [
    query.trim()
      ? { key: "query", label: query.trim(), onRemove: () => onQueryChange("") }
      : null,
    selectedCategory
      ? {
          key: "category",
          label: selectedCategory.label,
          onRemove: () => onCategoryChange?.(""),
        }
      : null,
    selectedPaymentStatus
      ? {
          key: "paymentStatus",
          label: selectedPaymentStatus.label,
          onRemove: () => onPaymentStatusChange?.(""),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      title={adminContent.providers.filters.eyebrow}
    >
      <div className="grid gap-4">
        <div>
          <Label>{adminContent.providers.filters.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={adminContent.providers.filters.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        {showCategory && (
          <div>
            <Label>{adminContent.providers.filters.categoryLabel}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onCategoryChange?.(event.target.value)}
              value={category}
            >
              <option value="">
                {adminContent.providers.filters.allCategories}
              </option>
              {PROVIDER_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPaymentStatus && (
          <div>
            <Label>{adminContent.providers.filters.paymentStatusLabel}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onPaymentStatusChange?.(event.target.value)}
              value={paymentStatus}
            >
              <option value="">
                {adminContent.providers.filters.allPaymentStatuses}
              </option>
              {adminContent.providers.filters.paymentStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
