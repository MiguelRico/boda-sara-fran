import { storageEvents, storageKeys } from "../config/storageKeys";

export const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "sara-fran-admin";

export const ADMIN_SESSION_KEY = storageKeys.adminSession;

export const ADMIN_AUTH_EVENT = storageEvents.adminAuthChange;
