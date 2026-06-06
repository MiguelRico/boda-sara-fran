import { ADMIN_PASSWORD } from "../constants/admin";
import { Table } from "../models";
import { findAllConfirmations } from "../api/confirmationsApi";
import { findAllProviders } from "../api/providersApi";
import { findAllTables } from "../api/tablesApi";
import { mapAdminConfirmations } from "../mappers/confirmationMapper";
import { mapAdminProviders } from "../mappers/providerMapper";
import { mapAdminTables } from "../mappers/tableMapper";

const emptySnapshot = {
  confirmations: [],
  loaded: false,
  loadingPromise: null,
  providers: [],
  tables: [],
};

const store = { ...emptySnapshot };

const getConfirmationKey = (group = {}) =>
  group.confirmationId || group.id || `draft:${group.email || ""}:${group.phone || ""}`;

export const clearAdminDataStore = () => {
  store.confirmations = [];
  store.loaded = false;
  store.loadingPromise = null;
  store.providers = [];
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
  ])
    .then(([confirmationsResponse, tablesResponse, providersResponse]) => {
      store.confirmations = mapAdminConfirmations(confirmationsResponse);
      store.tables = Table.normalizeList(
        mapAdminTables(tablesResponse?.tables || []),
      );
      store.providers = mapAdminProviders(providersResponse?.providers || []);
      store.loaded = true;

      return getAdminDataSnapshot();
    })
    .finally(() => {
      store.loadingPromise = null;
    });

  return store.loadingPromise;
};

export const getAdminDataSnapshot = () => ({
  confirmations: store.confirmations,
  providers: store.providers,
  tables: store.tables,
});

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

