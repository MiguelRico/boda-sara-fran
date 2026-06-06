import { TABLE_GROUP_OPTIONS } from "../constants/tables";
import { tableContent } from "../constants/tableContent";
import { Table } from "../models";

export const getTableKey = (table = {}) => (table.name || "").trim();

export const validateTableForm = (form, tables, editingTable = null) => {
  const errors = {};
  const tableName = form.name.trim();
  const editingTableKey = editingTable ? getTableKey(editingTable) : "";
  const repeatedTable = tables.some(
    (table) =>
      getTableKey(table).toLowerCase() !== editingTableKey.toLowerCase() &&
      getTableKey(table).toLowerCase() === tableName.toLowerCase(),
  );

  if (!tableName) {
    errors.name = "Introduce el nombre de la mesa.";
  } else if (repeatedTable) {
    errors.name = "Ya existe una mesa con este nombre.";
  }

  if (!form.shape) {
    errors.shape = "Selecciona la forma de la mesa.";
  }

  if (!TABLE_GROUP_OPTIONS.some((option) => option.value === form.group)) {
    errors.group = "Selecciona un grupo de mesa.";
  }

  if (!Table.isSeatCountAllowed(form.shape, form.seatCount)) {
    const range = Table.getSeatRange(form.shape);

    errors.seatCount = tableContent.validation.seatCountRange(range);
  }

  return errors;
};
