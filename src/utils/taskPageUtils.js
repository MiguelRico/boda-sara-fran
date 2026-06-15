export function filterTasks(tasks, { dateFrom, dateTo, priority, query, status }) {
  const normalizedQuery = query.trim().toLowerCase();

  return tasks.filter((task) => {
    const searchableText = [task.title, task.description]
      .join(" ")
      .toLowerCase();
    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesStatus = !status || task.status === status;
    const matchesPriority = !priority || task.priority === priority;
    const matchesDateFrom =
      !dateFrom || (task.maxDate && task.maxDate >= dateFrom);
    const matchesDateTo = !dateTo || (task.maxDate && task.maxDate <= dateTo);

    return (
      matchesQuery &&
      matchesStatus &&
      matchesPriority &&
      matchesDateFrom &&
      matchesDateTo
    );
  });
}
