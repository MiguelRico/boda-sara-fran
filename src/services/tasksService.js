import { adminContent } from "../constants/adminContent";
import { Task } from "../models";
import { taskRepository } from "../repositories/taskRepository";

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
  const response = await taskRepository.findAll({ password });

  if (response?.success === false) {
    throw new Error(response.error || adminContent.tasks.dialogs.loadError);
  }

  return normalizeTasks(response?.tasks || []);
};

export const persistTasks = async ({ password, tasks }) => {
  const normalizedTasks = normalizeTasks(tasks);

  await taskRepository.saveAdmin({
    password,
    tasks: normalizedTasks,
  });

  return normalizedTasks;
};
