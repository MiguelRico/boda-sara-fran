import { ADMIN_PASSWORD } from "../constants/admin";
import { AdminNotification, Table } from "../models";
import { findAllConfirmations } from "../api/confirmationsApi";
import { findAllNotifications } from "../api/notificationsApi";
import { findAllProviders } from "../api/providersApi";
import { findAllTables } from "../api/tablesApi";
import {
  saveAdminConfirmation,
  deleteAdminConfirmation,
} from "../api/confirmationsApi";
import { saveAdminProviders } from "../api/providersApi";
import { saveAdminNotifications } from "../api/notificationsApi";
import { saveAdminTables } from "../api/tablesApi";
import { mapAdminConfirmations } from "../mappers/confirmationMapper";
import { mapAdminProviders } from "../mappers/providerMapper";
import { mapAdminTables } from "../mappers/tableMapper";

const emptySnapshot = {
  confirmations: [],
  loaded: false,
  loadingPromise: null,
  notifications: [],
  providers: [],
  savedConfirmations: [],
  savedNotifications: [],
  savedProviders: [],
  savedTables: [],
  tables: [],
};

const store = { ...emptySnapshot };

const getConfirmationKey = (group = {}) =>
  group.confirmationId || group.id || `draft:${group.email || ""}:${group.phone || ""}`;
const getStableJson = (value) => JSON.stringify(value);
const cloneData = (value) => JSON.parse(JSON.stringify(value));

export const clearAdminDataStore = () => {
  store.confirmations = [];
  store.loaded = false;
  store.loadingPromise = null;
  store.notifications = [];
  store.providers = [];
  store.savedConfirmations = [];
  store.savedNotifications = [];
  store.savedProviders = [];
  store.savedTables = [];
  store.tables = [];
};

export const loadAdminDataOnce = async ({ password = ADMIN_PASSWORD } = {}) => {
  if (store.loaded) return getAdminDataSnapshot();
  if (store.loadingPromise) return store.loadingPromise;

  store.loadingPromise = Promise.all([
    findAllConfirmations({ password }),
    findAllTables({ password }).catch((error) => {
      console.error("Error al cargar mesas guardadas:", error);
      return { tables: [] };
    }),
    findAllProviders({ password }).catch((error) => {
      console.error("Error al cargar proveedores:", error);
      return { providers: [] };
    }),
    findAllNotifications({ password }).catch((error) => {
      console.error("Error al cargar notificaciones:", error);
      return { notifications: [] };
    }),
  ])
    .then(
      ([
        confirmationsResponse,
        tablesResponse,
        providersResponse,
        notificationsResponse,
      ]) => {
      store.confirmations = mapAdminConfirmations(confirmationsResponse);
      store.tables = Table.normalizeList(
        mapAdminTables(tablesResponse?.tables || []),
      );
      store.providers = mapAdminProviders(providersResponse?.providers || []);
      store.notifications = AdminNotification.normalizeList(
        notificationsResponse?.notifications || notificationsResponse || [],
      );
      markAdminDataSaved();
      store.loaded = true;

      return getAdminDataSnapshot();
    })
    .finally(() => {
      store.loadingPromise = null;
    });

  return store.loadingPromise;
};

export const getAdminDataSnapshot = () => ({
  confirmations: cloneData(store.confirmations),
  notifications: cloneData(store.notifications),
  providers: cloneData(store.providers),
  savedConfirmations: cloneData(store.savedConfirmations),
  savedNotifications: cloneData(store.savedNotifications),
  savedProviders: cloneData(store.savedProviders),
  savedTables: cloneData(store.savedTables),
  tables: cloneData(store.tables),
});

export const hasAdminPendingChanges = () =>
  getStableJson(store.confirmations) !== getStableJson(store.savedConfirmations) ||
  getStableJson(store.tables) !== getStableJson(store.savedTables) ||
  getStableJson(store.providers) !== getStableJson(store.savedProviders) ||
  getStableJson(store.notifications) !== getStableJson(store.savedNotifications);

export const getAdminPendingChangesSummary = () => [
  ...buildEntityChanges({
    createdLabel: (item) =>
      `Confirmacion creada: ${getConfirmationLabel(item)}`,
    currentItems: store.confirmations,
    deletedLabel: (item) =>
      `Confirmacion eliminada: ${getConfirmationLabel(item)}`,
    getKey: getConfirmationKey,
    modifiedLabel: (item) =>
      `Confirmacion modificada: ${getConfirmationLabel(item)}`,
    savedItems: store.savedConfirmations,
  }),
  ...buildEntityChanges({
    createdLabel: (item) => `Mesa creada: ${item.name || "sin nombre"}`,
    currentItems: store.tables,
    deletedLabel: (item) => `Mesa eliminada: ${item.name || "sin nombre"}`,
    getKey: (item) => item.id || item.name,
    modifiedLabel: (item) => `Mesa modificada: ${item.name || "sin nombre"}`,
    savedItems: store.savedTables,
  }),
  ...buildEntityChanges({
    createdLabel: (item) => `Proveedor creado: ${item.name || "sin nombre"}`,
    currentItems: store.providers,
    deletedLabel: (item) =>
      `Proveedor eliminado: ${item.name || "sin nombre"}`,
    getKey: (item) => item.id,
    modifiedLabel: (item) =>
      `Proveedor modificado: ${item.name || "sin nombre"}`,
    savedItems: store.savedProviders,
  }),
  ...buildEntityChanges({
    createdLabel: (item) => `Notificacion creada: ${item.title || "sin título"}`,
    currentItems: store.notifications,
    deletedLabel: (item) =>
      `Notificacion eliminada: ${item.title || "sin título"}`,
    getKey: (item) => item.id,
    modifiedLabel: (item) =>
      `Notificacion modificada: ${item.title || "sin título"}`,
    savedItems: store.savedNotifications,
  }),
];

export const getAdminNotificationChangesSummary = () =>
  buildEntityChanges({
    createdLabel: (item) => `Notificacion creada: ${item.title || "sin título"}`,
    currentItems: store.notifications,
    deletedLabel: (item) =>
      `Notificacion eliminada: ${item.title || "sin título"}`,
    getKey: (item) => item.id,
    modifiedLabel: (item) =>
      `Notificacion modificada: ${item.title || "sin título"}`,
    savedItems: store.savedNotifications,
  });

export const markAdminDataSaved = ({
  confirmations = store.confirmations,
  notifications = store.notifications,
  providers = store.providers,
  tables = store.tables,
} = {}) => {
  store.savedConfirmations = mapAdminConfirmations(confirmations);
  store.savedNotifications = AdminNotification.normalizeList(notifications);
  store.savedProviders = mapAdminProviders(providers);
  store.savedTables = Table.normalizeList(tables);

  return getAdminDataSnapshot();
};

export const discardAdminPendingChanges = () => {
  store.confirmations = mapAdminConfirmations(store.savedConfirmations);
  store.notifications = AdminNotification.normalizeList(
    store.savedNotifications,
  );
  store.providers = mapAdminProviders(store.savedProviders);
  store.tables = Table.normalizeList(store.savedTables);

  return getAdminDataSnapshot();
};

export const discardAdminNotificationChanges = () => {
  store.notifications = AdminNotification.normalizeList(
    store.savedNotifications,
  );

  return store.notifications;
};

export const saveAdminPendingChanges = async ({
  password = ADMIN_PASSWORD,
} = {}) => {
  const savedById = new Map(
    store.savedConfirmations.map((confirmation) => [
      getConfirmationKey(confirmation),
      confirmation,
    ]),
  );
  const currentById = new Map(
    store.confirmations.map((confirmation) => [
      getConfirmationKey(confirmation),
      confirmation,
    ]),
  );
  const confirmationRequests = [];

  store.confirmations.forEach((confirmation) => {
    const key = getConfirmationKey(confirmation);

    if (getStableJson(savedById.get(key)) === getStableJson(confirmation)) {
      return;
    }

    confirmationRequests.push(
      saveAdminConfirmation({
        confirmation,
        method: savedById.has(key) ? "PUT" : "POST",
        password,
      }),
    );
  });

  store.savedConfirmations.forEach((confirmation) => {
    const key = getConfirmationKey(confirmation);

    if (currentById.has(key) || !confirmation.confirmationId) return;

    confirmationRequests.push(
      deleteAdminConfirmation({
        confirmationId: confirmation.confirmationId,
        password,
      }),
    );
  });

  await Promise.all([
    ...confirmationRequests,
    saveAdminNotifications({ password, notifications: store.notifications }),
    saveAdminTables({ password, tables: store.tables }),
    saveAdminProviders({ password, providers: store.providers }),
  ]);

  return markAdminDataSaved();
};

export const setAdminConfirmations = (confirmations) => {
  store.confirmations = mapAdminConfirmations(confirmations);

  return store.confirmations;
};

export const upsertAdminConfirmation = (confirmation) => {
  const normalizedConfirmation = mapAdminConfirmations([confirmation])[0];
  const normalizedKey = getConfirmationKey(normalizedConfirmation);
  const existingIndex = store.confirmations.findIndex(
    (item) => getConfirmationKey(item) === normalizedKey,
  );

  if (existingIndex === -1) {
    store.confirmations = [...store.confirmations, normalizedConfirmation];
  } else {
    store.confirmations = store.confirmations.map((item, index) =>
      index === existingIndex ? normalizedConfirmation : item,
    );
  }

  return store.confirmations;
};

export const removeAdminConfirmation = (confirmationId) => {
  store.confirmations = store.confirmations.filter(
    (confirmation) => getConfirmationKey(confirmation) !== confirmationId,
  );

  return store.confirmations;
};

export const setAdminTables = (tables) => {
  store.tables = Table.normalizeList(tables);

  return store.tables;
};

export const setAdminProviders = (providers) => {
  store.providers = mapAdminProviders(providers);

  return store.providers;
};

export const setAdminNotifications = (notifications) => {
  store.notifications = AdminNotification.normalizeList(notifications);

  return store.notifications;
};

export const upsertAdminNotification = (notification) => {
  const normalizedNotification = AdminNotification.normalize(notification);
  const existingIndex = store.notifications.findIndex(
    (item) => item.id === normalizedNotification.id,
  );

  if (existingIndex === -1) {
    store.notifications = AdminNotification.normalizeList([
      ...store.notifications,
      normalizedNotification,
    ]);
  } else {
    store.notifications = AdminNotification.normalizeList(
      store.notifications.map((item, index) =>
        index === existingIndex ? normalizedNotification : item,
      ),
    );
  }

  return store.notifications;
};

export const markAdminNotificationRead = (notificationId) => {
  store.notifications = AdminNotification.normalizeList(
    store.notifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification,
    ),
  );

  return store.notifications;
};

export const setAdminNotificationRead = (notificationId, read) => {
  store.notifications = AdminNotification.normalizeList(
    store.notifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: Boolean(read) }
        : notification,
    ),
  );

  return store.notifications;
};

export const removeAdminNotification = (notificationId) => {
  store.notifications = AdminNotification.normalizeList(
    store.notifications.filter((notification) => notification.id !== notificationId),
  );

  return store.notifications;
};

function buildEntityChanges({
  createdLabel,
  currentItems,
  deletedLabel,
  getKey,
  modifiedLabel,
  savedItems,
}) {
  const savedByKey = new Map(savedItems.map((item) => [getKey(item), item]));
  const currentByKey = new Map(currentItems.map((item) => [getKey(item), item]));
  const changes = [];

  currentByKey.forEach((item, key) => {
    if (!savedByKey.has(key)) {
      changes.push(createdLabel(item));
      return;
    }

    if (getStableJson(savedByKey.get(key)) !== getStableJson(item)) {
      changes.push(modifiedLabel(item));
    }
  });

  savedByKey.forEach((item, key) => {
    if (!currentByKey.has(key)) {
      changes.push(deletedLabel(item));
    }
  });

  return changes;
}

function getConfirmationLabel(confirmation = {}) {
  return (
    confirmation.confirmationName ||
    confirmation.email ||
    confirmation.phone ||
    "sin nombre"
  );
}

