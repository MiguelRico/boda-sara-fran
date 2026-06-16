import { AdminNotification, Confirmation, Provider, Table, Task } from "@/models";

const normalizeString = (value) => String(value || "").trim();
const normalizeBoolean = (value) => Boolean(value);
const sortByStableJson = (left, right) =>
  stableJson(left).localeCompare(stableJson(right));

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`;
};

export const sameFingerprint = (left, right) =>
  stableJson(left) === stableJson(right);

export const getConfirmationComparable = (confirmationInput) => {
  const confirmation = Confirmation.normalize(confirmationInput);

  return {
    confirmationName: normalizeString(confirmation.confirmationName),
    email: normalizeString(confirmation.email).toLowerCase(),
    guests: confirmation.guests
      .map((guest) => ({
        allergies: (guest.allergies || []).map(normalizeString).sort(),
        comments: normalizeString(guest.comments),
        firstName: normalizeString(guest.name || guest.firstName),
        lastName: normalizeString(guest.lastname || guest.lastName),
        menu: normalizeString(guest.menu),
        otherAllergies: normalizeString(guest.otherAllergies),
        outboundBus: normalizeString(guest.outboundBus),
        returnBus: normalizeString(guest.returnBus),
        seat: normalizeString(guest.seat),
        table: normalizeString(guest.table),
        tableId: normalizeString(guest.tableId),
      }))
      .sort(sortByStableJson),
    phone: normalizeString(confirmation.phone),
  };
};

export const getTablesComparable = (tables = []) =>
  (Array.isArray(tables) ? tables : [])
    .map((tableInput) => {
      const table = Table.normalize(tableInput);

      return {
        group: normalizeString(table.group),
        id: normalizeString(table.tableId || table.id),
        name: normalizeString(table.name),
        notes: normalizeString(table.notes),
        seatCount:
          Number(tableInput.seatCount) ||
          Number(table.seatCount) ||
          table.seats.length ||
          0,
        shape: normalizeString(table.shape),
        tag: normalizeString(table.tag || table.group),
      };
    })
    .sort(sortByStableJson);

export const getProvidersComparable = (providers = []) =>
  Provider.normalizeList(providers)
    .map((provider) => ({
      accountNumber: normalizeString(provider.accountNumber),
      address: normalizeString(provider.address),
      category: normalizeString(provider.category),
      email: normalizeString(provider.email).toLowerCase(),
      id: normalizeString(provider.providerId || provider.id),
      name: normalizeString(provider.name),
      phone: normalizeString(provider.phone),
      services: provider.services
        .map((service) => ({
          id: normalizeString(service.serviceId || service.id),
          name: normalizeString(service.name),
          paymentCount: Number(service.paymentCount) || 1,
          payments: service.payments
            .slice(0, Number(service.paymentCount) || 1)
            .map((payment) => ({
              amount: normalizeString(payment.amount),
              date: normalizeString(payment.date),
              id: normalizeString(payment.paymentId || payment.id),
              paid: normalizeBoolean(payment.paid),
            }))
            .sort(sortByStableJson),
          price: normalizeString(service.price),
        }))
        .sort(sortByStableJson),
      web: normalizeString(provider.web),
    }))
    .sort(sortByStableJson);

export const getNotificationsComparable = (notifications = []) =>
  AdminNotification.normalizeList(notifications)
    .map((notification) => ({
      date: normalizeString(notification.date),
      detail: normalizeString(notification.detail),
      id: normalizeString(notification.notificationId || notification.id),
      read: normalizeBoolean(notification.read),
      title: normalizeString(notification.title),
      type: normalizeString(notification.type),
    }))
    .sort(sortByStableJson);

export const getTasksComparable = (tasks = []) =>
  Task.normalizeList(tasks)
    .map((task) => ({
      category: normalizeString(task.category),
      description: normalizeString(task.description),
      id: normalizeString(task.taskId || task.id),
      maxDate: normalizeString(task.maxDate),
      priority: normalizeString(task.priority),
      responsible: normalizeString(task.responsible),
      status: normalizeString(task.status),
      title: normalizeString(task.title),
    }))
    .sort(sortByStableJson);
