import { storageEvents, storageKeys } from "../config/storageKeys";

const TRUE_VALUE = "true";

export function isAdminSessionAuthenticated() {
  return (
    getSessionValue(storageKeys.adminSession) === TRUE_VALUE &&
    Boolean(getAdminSessionPassword())
  );
}

export function getAdminSessionPassword() {
  return getSessionValue(storageKeys.adminPassword);
}

export function setAdminSessionAuthenticated(password) {
  const normalizedPassword = String(password || "").trim();

  if (!normalizedPassword) return;

  setSessionValue(storageKeys.adminPassword, normalizedPassword);
  setSessionValue(storageKeys.adminSession, TRUE_VALUE);
  dispatchAdminAuthChange();
}

export function clearAdminSession() {
  removeSessionValue(storageKeys.adminPassword);
  removeSessionValue(storageKeys.adminSession);
  dispatchAdminAuthChange();
}

export function dispatchAdminAuthChange() {
  window.dispatchEvent(new Event(storageEvents.adminAuthChange));
}

export function subscribeAdminAuthChange(callback) {
  window.addEventListener(storageEvents.adminAuthChange, callback);

  return () => {
    window.removeEventListener(storageEvents.adminAuthChange, callback);
  };
}

function getSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function setSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or locked browser contexts.
  }
}

function removeSessionValue(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private or locked browser contexts.
  }
}
