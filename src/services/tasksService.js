import { findAllTasks, saveAdminTasks } from "../api/tasksApi";
import { TASK_CATEGORIES } from "../constants/tasks";
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
  const categoryCounts = TASK_CATEGORIES.map((category) => ({
    ...category,
    count: normalizedTasks.filter((task) => task.category === category.value)
      .length,
  }));

  return {
    categoryCounts,
    completedCount: completedTasks.length,
    highPriorityPendingCount: highPriorityPending.length,
    nextTaskCategory: nextTask?.category || "",
    nextTaskDate: nextTask?.maxDate || "",
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
