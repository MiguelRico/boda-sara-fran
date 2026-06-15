import { appEnvironment } from "./environment";

const STORAGE_PREFIX = appEnvironment.storagePrefix;

const buildKey = (key) => `${STORAGE_PREFIX}:${key}`;

export const storageKeys = {
  adminActiveTabs: {
    guests: buildKey("admin:guests:active-tab"),
    providers: buildKey("admin:providers:active-tab"),
    tables: buildKey("admin:tables:active-tab"),
  },
  adminMemoryNoticeDismissed: buildKey("admin:memory-notice-dismissed"),
  adminSession: buildKey("admin:auth"),
  adminTables: buildKey("admin:tables"),
};

export const storageEvents = {
  adminAuthChange: `${STORAGE_PREFIX}:admin-auth-change`,
};
