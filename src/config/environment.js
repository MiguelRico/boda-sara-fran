const truthyValues = new Set(["1", "true", "yes", "on", "enabled"]);

function readStringEnv(name, defaultValue = "") {
  const value = import.meta.env[name];

  if (value == null || value === "") return defaultValue;

  return String(value).trim();
}

function readBooleanEnv(name, defaultValue = false) {
  const rawValue = readStringEnv(name);

  if (!rawValue) return defaultValue;

  return truthyValues.has(rawValue.toLowerCase());
}

function isValidUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const appEnvironment = {
  adminPassword: readStringEnv("VITE_ADMIN_PASSWORD", "sara-fran-admin"),
  isDevelopment: Boolean(import.meta.env.DEV),
  rsvpApiUrl: readStringEnv("VITE_RSVP_API_URL"),
  storagePrefix: readStringEnv("VITE_APP_STORAGE_PREFIX", "wedding-template"),
  features: {
    menuModule: readBooleanEnv("VITE_ENABLE_MENU_MODULE", false),
  },
};

export function validateAppEnvironment() {
  const errors = [];

  if (!appEnvironment.adminPassword) {
    errors.push("Falta VITE_ADMIN_PASSWORD.");
  }

  if (!appEnvironment.storagePrefix) {
    errors.push("Falta VITE_APP_STORAGE_PREFIX.");
  }

  if (!appEnvironment.rsvpApiUrl) {
    errors.push("Falta VITE_RSVP_API_URL.");
  } else if (!isValidUrl(appEnvironment.rsvpApiUrl)) {
    errors.push("VITE_RSVP_API_URL debe ser una URL http(s) valida.");
  }

  return errors;
}

export function getRequiredRsvpApiUrl() {
  if (!appEnvironment.rsvpApiUrl) {
    throw new Error(
      "Falta configurar VITE_RSVP_API_URL en el entorno de la aplicacion.",
    );
  }

  if (!isValidUrl(appEnvironment.rsvpApiUrl)) {
    throw new Error("VITE_RSVP_API_URL debe ser una URL http(s) valida.");
  }

  return appEnvironment.rsvpApiUrl;
}

let environmentWarningReported = false;

export function reportAppEnvironmentIssues() {
  if (!appEnvironment.isDevelopment || environmentWarningReported) return;

  const errors = validateAppEnvironment();

  if (!errors.length) return;

  environmentWarningReported = true;
  console.warn(
    [
      "Configuracion incompleta de la aplicacion:",
      ...errors.map((error) => `- ${error}`),
      "Revisa .env.example para preparar el entorno.",
    ].join("\n"),
  );
}
