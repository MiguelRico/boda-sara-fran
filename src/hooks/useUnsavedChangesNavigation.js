import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";

export default function useUnsavedChangesNavigation(hasPendingChanges) {
  const [externalNavigation, setExternalNavigation] = useState(null);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!hasPendingChanges) return false;

    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash
    );
  });

  useEffect(() => {
    if (!hasPendingChanges) return undefined;

    const handleClick = (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target.closest?.("a[href]");
      if (!link || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const targetUrl = new URL(href, window.location.href);
      const isExternal =
        targetUrl.origin !== window.location.origin ||
        !["http:", "https:"].includes(targetUrl.protocol);

      if (!isExternal) return;

      event.preventDefault();
      setExternalNavigation({
        href: targetUrl.href,
        target: link.getAttribute("target"),
      });
    };

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, [hasPendingChanges]);

  useEffect(() => {
    if (!hasPendingChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasPendingChanges]);

  const proceed = () => {
    if (externalNavigation) {
      const { href, target } = externalNavigation;

      setExternalNavigation(null);

      if (target === "_blank") {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      window.location.href = href;
      return;
    }

    blocker.proceed?.();
  };

  const reset = () => {
    if (externalNavigation) {
      setExternalNavigation(null);
      return;
    }

    blocker.reset?.();
  };

  return {
    ...blocker,
    proceed,
    reset,
    state: externalNavigation ? "blocked" : blocker.state,
  };
}
