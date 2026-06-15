import { useEffect, useState } from "react";
import {
  getLocalStorageValue,
  setLocalStorageValue,
} from "../utils/browserStorage";

export default function useAdminActiveTab(
  storageKey,
  fallbackTab,
) {
  const [activeTab, setActiveTab] = useState(() => {
    return getLocalStorageValue(storageKey) || fallbackTab;
  });

  useEffect(() => {
    setLocalStorageValue(storageKey, activeTab);
  }, [activeTab, storageKey]);

  return [activeTab, setActiveTab];
}
