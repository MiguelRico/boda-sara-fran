import { ADMIN_PASSWORD } from "../constants/admin";
import { Table } from "../models";
import { findAllGroups, findAllTables } from "./rsvpService";
import { normalizeAdminGroups } from "../utils/rsvpGroups";

const emptySnapshot = {
  groups: [],
  loaded: false,
  loadingPromise: null,
  tables: [],
};

const store = { ...emptySnapshot };

export const clearAdminDataStore = () => {
  store.groups = [];
  store.loaded = false;
  store.loadingPromise = null;
  store.tables = [];
};

export const loadAdminDataOnce = async ({ password = ADMIN_PASSWORD } = {}) => {
  if (store.loaded) return getAdminDataSnapshot();
  if (store.loadingPromise) return store.loadingPromise;

  store.loadingPromise = Promise.all([
    findAllGroups({ password }),
    findAllTables({ password }).catch((error) => {
      console.error("Error al cargar mesas guardadas:", error);
      return { tables: [] };
    }),
  ])
    .then(([groupsResponse, tablesResponse]) => {
      store.groups = normalizeAdminGroups(groupsResponse);
      store.tables = Table.normalizeList(tablesResponse?.tables || []);
      store.loaded = true;

      return getAdminDataSnapshot();
    })
    .finally(() => {
      store.loadingPromise = null;
    });

  return store.loadingPromise;
};

export const getAdminDataSnapshot = () => ({
  groups: store.groups,
  tables: store.tables,
});

export const setAdminGroups = (groups) => {
  store.groups = normalizeAdminGroups(groups);

  return store.groups;
};

export const upsertAdminGroup = (group) => {
  const normalizedGroup = normalizeAdminGroups([group])[0];
  const existingIndex = store.groups.findIndex(
    (item) => item.groupName === normalizedGroup.groupName,
  );

  if (existingIndex === -1) {
    store.groups = [...store.groups, normalizedGroup];
  } else {
    store.groups = store.groups.map((item, index) =>
      index === existingIndex ? normalizedGroup : item,
    );
  }

  return store.groups;
};

export const removeAdminGroup = (groupName) => {
  store.groups = store.groups.filter((group) => group.groupName !== groupName);

  return store.groups;
};

export const setAdminTables = (tables) => {
  store.tables = Table.normalizeList(tables);

  return store.tables;
};
