import { Check, Grid2X2, Plus } from "lucide-react";

import { SelectableCardFrame, SelectableCardPage } from "../common";
import IconButton from "../../ui/IconButton";
import { Label, selectClassName } from "../../rsvp/FormPrimitives";
import { adminContent } from "../../../constants/adminContent";
import { Table } from "../../../models";
import { getTableKey } from "../../../services/tablesService";
import { getTableRenderKey } from "../../../utils/renderKeys";
import TableAnimatedInfoCard from "./TableAnimatedInfoCard";

export function TableTabActions({ loading, onCreate, showText = true }) {
  if (!onCreate) return null;

  return (
    <div className="grid w-full gap-3">
      <IconButton
        className="w-full"
        disabled={loading}
        icon={<Plus size={18} strokeWidth={2.4} />}
        label={adminContent.tables.actions.addTable}
        onClick={onCreate}
        showText={showText ? "always" : undefined}
        tone="primary"
        type="button"
      >
        {showText ? adminContent.tables.actions.addTable : undefined}
      </IconButton>
    </div>
  );
}

export function PendingGuestAssignmentActions({
  assigning,
  availableSeats,
  disabled,
  onAssign,
  onSeatChange,
  onTableChange,
  selectedSeat,
  selectedTable,
  tables,
}) {
  const canAssign = Boolean(!disabled && selectedTable && selectedSeat);

  return (
    <div className="grid w-full gap-3">
      <div>
        <Label>{adminContent.pendingGuests.tableLabel}</Label>
        <select
          className={`${selectClassName} text-sm`}
          disabled={disabled || assigning}
          onChange={(event) => onTableChange(event.target.value)}
          value={selectedTable}
        >
          <option value="">
            {adminContent.pendingGuests.tablePlaceholder}
          </option>
          {tables.map((table) => {
            const emptySeats = Table.getEmptySeats(table);
            const label = `${table.name} (${adminContent.pendingGuests.emptySeatsLabel(emptySeats.length)})`;

            return (
              <option key={table.name} value={table.name}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <Label>{adminContent.pendingGuests.seatLabel}</Label>
        <select
          className={`${selectClassName} text-sm`}
          disabled={!selectedTable || disabled || assigning}
          onChange={(event) => onSeatChange(event.target.value)}
          value={selectedSeat}
        >
          <option value="">
            {selectedTable
              ? adminContent.pendingGuests.tablePlaceholder
              : adminContent.pendingGuests.selectTableFirst}
          </option>
          {availableSeats.map((seatNum) => (
            <option key={seatNum} value={seatNum}>
              {adminContent.pendingGuests.seatOption(seatNum)}
            </option>
          ))}
        </select>
      </div>

      <IconButton
        className="w-full self-end mt-2"
        disabled={!canAssign || assigning}
        icon={
          assigning ? (
            <span className="inline-block animate-spin">...</span>
          ) : (
            <Check size={16} strokeWidth={2} />
          )
        }
        label={
          assigning
            ? adminContent.pendingGuests.assigning
            : adminContent.pendingGuests.assign
        }
        onClick={onAssign}
        showText="always"
        tone={canAssign ? "primary" : "default"}
      >
        {assigning
          ? adminContent.pendingGuests.assigning
          : adminContent.pendingGuests.assign}
      </IconButton>
    </div>
  );
}

function TableCardWithActions({
  index = 0,
  onDelete,
  onEdit,
  onSeatClick,
  onSelect,
  onUnassignSeat,
  reveal = true,
  selected = false,
  table,
}) {
  return (
    <SelectableCardFrame
      className="grid gap-3"
      onClick={() => onSelect(table)}
      selected={selected}
    >
      <TableAnimatedInfoCard
        index={index}
        onDelete={onDelete}
        onEdit={onEdit}
        onSeatClick={onSeatClick}
        onUnassignSeat={onUnassignSeat}
        reveal={reveal}
        table={table}
      />
    </SelectableCardFrame>
  );
}

export function TableCardsPage({
  items,
  onDelete,
  onEdit,
  onSeatClick,
  onSelect,
  onUnassignSeat,
  selectedTableKey,
}) {
  return (
    <SelectableCardPage
      emptyIcon={Grid2X2}
      emptyState={adminContent.tables.empty}
      getKey={getTableRenderKey}
      items={items}
      renderCard={(table, index) => (
        <TableCardWithActions
          index={index}
          onDelete={onDelete}
          onEdit={onEdit}
          onSeatClick={onSeatClick}
          onSelect={onSelect}
          onUnassignSeat={onUnassignSeat}
          reveal={false}
          selected={getTableKey(table) === selectedTableKey}
          table={table}
        />
      )}
    />
  );
}
