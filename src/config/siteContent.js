import { defaultSiteContent } from "../constants/defaultSiteContent";
import { siteContentOverrides } from "./siteContentOverrides";

export const siteContent = mergeSiteContent(
  defaultSiteContent,
  siteContentOverrides,
);

function mergeSiteContent(base, overrides) {
  if (Array.isArray(base) || Array.isArray(overrides)) {
    return overrides ?? base;
  }

  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return overrides ?? base;
  }

  return Object.keys({ ...base, ...overrides }).reduce((merged, key) => {
    merged[key] = mergeSiteContent(base[key], overrides[key]);

    return merged;
  }, {});
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
