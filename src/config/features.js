const truthyValues = new Set(["1", "true", "yes", "on", "enabled"]);

function readBooleanEnv(name, defaultValue = false) {
  const rawValue = import.meta.env[name];

  if (rawValue == null || rawValue === "") return defaultValue;

  return truthyValues.has(String(rawValue).trim().toLowerCase());
}

export const features = {
  menuModule: readBooleanEnv("VITE_ENABLE_MENU_MODULE", false),
};

export const isMenuModuleEnabled = features.menuModule;
