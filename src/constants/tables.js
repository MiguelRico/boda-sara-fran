import { storageKeys } from "../config/storageKeys";
import { tableContent } from "./tableContent";

export const TABLE_SHAPES = {
  rectangular: "rectangular",
  round: "round",
};

export const TABLE_SHAPE_OPTIONS = [
  {
    value: TABLE_SHAPES.rectangular,
    label: "Rectangular",
    seatRange: { min: 4, max: 6 },
  },
  {
    value: TABLE_SHAPES.round,
    label: "Redonda",
    seatRange: { min: 8, max: 12 },
  },
];

export const DEFAULT_TABLE_SHAPE = TABLE_SHAPES.rectangular;
export const ADMIN_TABLES_STORAGE_KEY = storageKeys.adminTables;

export const TABLE_GROUP_OPTIONS = [
  {
    value: "familia",
    label: "Familia",
    icon: "users",
  },
  {
    value: "amistades",
    label: "Amistades",
    icon: "heart",
  },
  {
    value: "trabajo",
    label: "Trabajo",
    icon: "briefcase",
  },
];

export const DEFAULT_TABLE_GROUP = TABLE_GROUP_OPTIONS[0]?.value || "";

export const tableFormContent = tableContent.form;

export const getTableGroupOption = (group) =>
  TABLE_GROUP_OPTIONS.find((option) => option.value === group) || null;

export const createEmptyTableForm = () => {
  const shapeOption =
    TABLE_SHAPE_OPTIONS.find(
      (option) => option.value === DEFAULT_TABLE_SHAPE,
    ) || TABLE_SHAPE_OPTIONS[0];

  return {
    name: "",
    group: DEFAULT_TABLE_GROUP,
    notes: "",
    shape: shapeOption.value,
    seatCount: shapeOption.seatRange.min,
  };
};
