import { useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";

export default function useUnsavedChangesNavigation(hasPendingChanges) {
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

  return {
    proceed: () => {},
    reset: () => {},
    state: "unblocked",
  };
}
