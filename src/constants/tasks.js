import { siteContent } from "../config/siteContent";

export const TASK_CATEGORIES = [
  { value: "ceremonia", label: "Ceremonia" },
  { value: "novios", label: "Novios" },
  { value: "fotografia", label: "Fotografia" },
  { value: "video", label: "Video" },
  { value: "banquete", label: "Banquete" },
  { value: "invitados", label: "Invitados" },
  { value: "transporte", label: "Transporte" },
  { value: "mesas", label: "Mesas" },
  { value: "fiesta", label: "Fiesta" },
  { value: "decoracion", label: "Decoracion" },
  { value: "pagos", label: "Pagos" },
  { value: "otros", label: "Otros" },
];

export const TASK_CATEGORY_LABELS = Object.fromEntries(
  TASK_CATEGORIES.map((category) => [category.value, category.label]),
);

export const TASK_PRIORITIES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

export const TASK_PRIORITY_LABELS = Object.fromEntries(
  TASK_PRIORITIES.map((priority) => [priority.value, priority.label]),
);

export const TASK_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "completed", label: "Completa" },
];

export const TASK_STATUS_LABELS = Object.fromEntries(
  TASK_STATUSES.map((status) => [status.value, status.label]),
);

const fallbackResponsibles = ["Novia", "Novio"];
const configuredResponsibles = String(siteContent.coupleName || "")
  .split("&")
  .map((name) => name.trim())
  .filter(Boolean);

export const TASK_RESPONSIBLES = (
  configuredResponsibles.length >= 2 ? configuredResponsibles : fallbackResponsibles
).map((name) => ({ value: name, label: name }));
