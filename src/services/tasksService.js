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
  const nextTask = [...pendingTasks]
    .filter((task) => task.maxDate)
    .sort((left, right) => left.maxDate.localeCompare(right.maxDate))[0];
  const priorityCounts = normalizedTasks.reduce(
    (counts, task) => ({
      ...counts,
      [task.priority]: (counts[task.priority] || 0) + 1,
    }),
    {
      alta: 0,
      baja: 0,
      media: 0,
    },
  );

  return {
    completedCount: completedTasks.length,
    nextTaskCategory: nextTask?.category || "",
    nextTaskDate: nextTask?.maxDate || "",
    nextTaskTitle: nextTask?.title || "",
    pendingCount: pendingTasks.length,
    priorityCounts,
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
