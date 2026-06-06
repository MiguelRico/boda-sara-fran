import { useEffect, useState } from "react";

export default function useAdminActiveTab(storageKey, fallbackTab) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) || fallbackTab;
    } catch {
      return fallbackTab;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, activeTab);
    } catch {
      // Storage can be unavailable in private or locked browser contexts.
    }
  }, [activeTab, storageKey]);

  return [activeTab, setActiveTab];
}
