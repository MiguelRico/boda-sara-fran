import { useCallback } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

export default function useUnsavedChangesNavigation(hasPendingChanges) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      hasPendingChanges && currentLocation.pathname !== nextLocation.pathname
    );
  });

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasPendingChanges) return;

        event.preventDefault();
        event.returnValue = "";
      },
      [hasPendingChanges],
    ),
  );

  return blocker;
}
