import { Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";

import {
  Card,
  SelectableCardFrame,
  SelectableCardPage,
  TableGuestCard,
} from "../common";
import Chip from "../../ui/Chip";
import CollapsiblePanel from "../../ui/CollapsiblePanel";
import IconButton from "../../ui/IconButton";
import {
  inputClassName,
  Label,
  selectClassName,
} from "../../rsvp/FormPrimitives";
import { adminContent } from "../../../constants/adminContent";
import { getGroupSummaryChips } from "../../../utils/rsvpSummaryChips";

const filters = adminContent.guests.filters.options;

export function FiltersCard({ filter, onFilterChange, onQueryChange, query }) {
  const selectedFilter = filters.find((item) => item.value === filter);
  const activeFilters = [
    query.trim()
      ? {
          key: "query",
          label: query.trim(),
          onRemove: () => onQueryChange(""),
        }
      : null,
    filter !== "all" && selectedFilter
      ? {
          key: "filter",
          label: selectedFilter.label,
          onRemove: () => onFilterChange("all"),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      className="mb-4"
      title={adminContent.guests.filters.eyebrow}
    >
      <div className="grid gap-4">
        <div>
          <Label>{adminContent.guests.filters.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={adminContent.guests.filters.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>{adminContent.guests.filters.showLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onFilterChange(event.target.value)}
            value={filter}
          >
            {filters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

export function GuestTableActions({ loading, onCreate, rows, showText = true }) {
  void rows;

  if (!onCreate) return null;

  return (
    <div className="grid w-full gap-3">
      <IconButton
        className="w-full"
        disabled={loading}
        icon={<Plus size={18} strokeWidth={2.4} />}
        label={adminContent.guests.actions.create}
        onClick={onCreate}
        showText={showText ? "always" : undefined}
        tone="primary"
        type="button"
      >
        {showText ? adminContent.guests.actions.create : undefined}
      </IconButton>
    </div>
  );
}

export function GuestItemsPage({
  emptyState,
  items,
  onDelete,
  onEdit,
  onSelect,
  selectedGuestId,
}) {
  return (
    <SelectableCardPage
      emptyIcon={UsersRound}
      emptyState={{
        text: emptyState?.text || adminContent.guests.list.emptyText,
        title: emptyState?.title || adminContent.guests.list.emptyTitle,
      }}
      getKey={(guest) => guest.rowId}
      items={items}
      renderCard={(guest) => (
        <GuestItemCard
          guestItem={guest}
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
          selected={guest.rowId === selectedGuestId}
        />
      )}
    />
  );
}

export function AdminGuestPage({
  emptyState,
  items,
  onDeleteGroup,
  onEditGroup,
  onSelect,
  selectedRowId,
}) {
  return (
    <SelectableCardPage
      emptyIcon={UsersRound}
      emptyState={{
        text: emptyState?.text || adminContent.guests.list.emptyText,
        title: emptyState?.title || adminContent.guests.list.emptyTitle,
      }}
      getKey={(row) => row.rowId}
      items={items}
      renderCard={(row) => (
        <AdminGuestConfirmationCard
          onDeleteGroup={onDeleteGroup}
          onEditGroup={onEditGroup}
          onSelect={onSelect}
          row={row}
          selected={row.rowId === selectedRowId}
        />
      )}
    />
  );
}

function GuestItemCard({ guestItem, onDelete, onEdit, onSelect, selected }) {
  return (
    <SelectableCardFrame
      className="h-full"
      onClick={() => onSelect(guestItem)}
      selected={selected}
    >
      <TableGuestCard
        actions={
          <CardActionButtons
            deleteLabel={adminContent.guests.actions.delete}
            editLabel={adminContent.guests.actions.edit}
            onDelete={(event) => {
              event.stopPropagation();
              onDelete?.(guestItem);
            }}
            onEdit={(event) => {
              event.stopPropagation();
              onEdit?.(guestItem);
            }}
          />
        }
        decorativeText={guestItem.guestIndex + 1}
        eyebrow={guestItem.confirmationName}
        guest={guestItem}
      />
    </SelectableCardFrame>
  );
}

function AdminGuestConfirmationCard({
  onDeleteGroup,
  onEditGroup,
  onSelect,
  row,
  selected,
  titleRef,
  titleStyle,
}) {
  const chips = getGroupSummaryChips(row, row.guests);

  return (
    <SelectableCardFrame
      className="relative h-full"
      onClick={() => onSelect(row)}
      selected={selected}
    >
      <Card
        actionsPlacement="overlay"
        actions={
          <CardActionButtons
            deleteLabel={adminContent.guests.actions.delete}
            editLabel={adminContent.guests.actions.edit}
            onDelete={(event) => {
              event.stopPropagation();
              onDeleteGroup?.(row);
            }}
            onEdit={(event) => {
              event.stopPropagation();
              onEditGroup?.(row);
            }}
          />
        }
        decorativeText={row.groupSize}
        eyebrow={`${row.groupSize} ${
          row.groupSize === 1 ? "persona" : "personas"
        }`}
        title={row.confirmationName || adminContent.common.fallbacks.group}
        titleRef={titleRef}
        titleStyle={titleStyle}
      >
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chips.map((chip) => (
            <Chip
              className={chip.className}
              href={chip.href}
              icon={chip.icon}
              key={chip.key}
              strong={chip.strong}
              tone={chip.tone}
              value={chip.value}
              valueClassName={chip.valueClassName}
            />
          ))}
        </div>
      </Card>
    </SelectableCardFrame>
  );
}

function CardActionButtons({ deleteLabel, editLabel, onDelete, onEdit }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 self-start">
      <IconButton
        className="h-10 w-10 !px-0"
        icon={<Trash2 size={16} strokeWidth={1.8} />}
        label={deleteLabel}
        onClick={onDelete}
        tone="danger"
        type="button"
      />
      <IconButton
        className="h-10 w-10 !px-0"
        icon={<Pencil size={16} strokeWidth={1.8} />}
        label={editLabel}
        onClick={onEdit}
        tone="primary"
        type="button"
      />
    </div>
  );
}
