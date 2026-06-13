import { findAllTasks, saveAdminTasks } from "../api/tasksApi";
import { Task } from "../models";

export const createEmptyTask = Task.create;
export const normalizeTasks = Task.normalizeList;
export const validateTask = Task.validate;

export function buildTaskStats(tasks) {
  const normalizedTasks = normalizeTasks(tasks);
  const pendingTasks = normalizedTasks.filter(
    (task) => task.status === "pending",
  );
  const completedTasks = normalizedTasks.filter(
    (task) => task.status === "completed",
  );
  const highPriorityPending = pendingTasks.filter(
    (task) => task.priority === "alta",
  );
  const nextTask = [...pendingTasks]
    .filter((task) => task.maxDate)
    .sort((left, right) => left.maxDate.localeCompare(right.maxDate))[0];

  return {
    completedCount: completedTasks.length,
    highPriorityPendingCount: highPriorityPending.length,
    nextTaskDate: nextTask?.maxDate || "",
    pendingCount: pendingTasks.length,
    totalCount: normalizedTasks.length,
  };
}

export const loadTasks = async ({ password } = {}) => {
  const response = await findAllTasks({ password });

  if (response?.success === false) {
    throw new Error(response.error || "No se pudieron cargar las tareas.");
  }

  return normalizeTasks(response?.tasks || []);
};

export const persistTasks = async ({ password, tasks }) => {
  const normalizedTasks = normalizeTasks(tasks);

  await saveAdminTasks({
    password,
    tasks: normalizedTasks,
  });

  return normalizedTasks;
};
