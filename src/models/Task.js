import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_RESPONSIBLES,
  TASK_STATUSES,
} from "../constants/tasks";

const normalizeString = (value) => String(value || "").trim();
const validCategoryValues = new Set(TASK_CATEGORIES.map((item) => item.value));
const validPriorityValues = new Set(TASK_PRIORITIES.map((item) => item.value));
const validResponsibleValues = new Set(
  TASK_RESPONSIBLES.map((item) => item.value),
);
const validStatusValues = new Set(TASK_STATUSES.map((item) => item.value));

const createId = () =>
  `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createStableId = (input = {}) => {
  const explicitId = normalizeString(input.id || input.taskId);

  if (explicitId) return explicitId;

  const stableParts = [input.category, input.title]
    .map((part) => normalizeString(part).toLowerCase())
    .filter(Boolean);

  return stableParts.length ? `task:${stableParts.join(":")}` : createId();
};

const normalizeCategory = (value) => {
  const category = normalizeString(value).toLowerCase();

  return validCategoryValues.has(category)
    ? category
    : TASK_CATEGORIES[0].value;
};

const normalizePriority = (value) => {
  const priority = normalizeString(value).toLowerCase();

  return validPriorityValues.has(priority) ? priority : "media";
};

const normalizeStatus = (value) => {
  const status = normalizeString(value).toLowerCase();

  if (status === "completa" || status === "complete" || status === "done") {
    return "completed";
  }

  return validStatusValues.has(status) ? status : "pending";
};

const normalizeResponsible = (value) => {
  const responsible = normalizeString(value);

  return validResponsibleValues.has(responsible)
    ? responsible
    : TASK_RESPONSIBLES[0]?.value || "";
};

export const Task = {
  create(overrides = {}) {
    const id = createStableId(overrides);

    return {
      id,
      taskId: overrides.taskId || overrides.id || id,
      category: normalizeCategory(overrides.category),
      description: normalizeString(overrides.description),
      maxDate: normalizeString(overrides.maxDate),
      priority: normalizePriority(overrides.priority),
      responsible: normalizeResponsible(overrides.responsible),
      status: normalizeStatus(overrides.status),
      title: normalizeString(overrides.title),
    };
  },

  normalize(task = {}) {
    return Task.create(task);
  },

  normalizeList(tasks = []) {
    if (!Array.isArray(tasks)) return [];

    return tasks
      .map((task) => Task.normalize(task))
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "pending" ? -1 : 1;
        }

        return String(left.maxDate || "9999-12-31").localeCompare(
          String(right.maxDate || "9999-12-31"),
        );
      });
  },

  validate(input = {}) {
    const task = Task.normalize(input);
    const errors = {};

    if (!task.title) errors.title = "El titulo es obligatorio";
    if (!task.category) errors.category = "La categoria es obligatoria";
    if (!task.priority) errors.priority = "La prioridad es obligatoria";
    if (!task.responsible) errors.responsible = "El responsable es obligatorio";
    if (!task.status) errors.status = "El estado es obligatorio";

    return errors;
  },
};
