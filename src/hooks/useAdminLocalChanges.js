import useUnsavedChangesNavigation from "./useUnsavedChangesNavigation";

export default function useAdminLocalChanges({
  hasPendingChanges,
  onDiscard,
  onSave,
}) {
  const blocker = useUnsavedChangesNavigation(hasPendingChanges);

  const cancelBlockedNavigation = () => {
    blocker.reset?.();
  };

  const discardAndContinueNavigation = () => {
    onDiscard?.();
    blocker.proceed?.();
  };

  const saveAndContinueNavigation = async () => {
    const saved = await onSave?.();

    if (saved) {
      blocker.proceed?.();
      return;
    }

    blocker.reset?.();
  };

  return {
    blocker,
    cancelBlockedNavigation,
    discardAndContinueNavigation,
    saveAndContinueNavigation,
  };
}
