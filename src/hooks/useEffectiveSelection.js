import { useMemo } from "react";

export default function useEffectiveSelection({
  getId,
  items,
  selectedId,
}) {
  const effectiveSelectedId = useMemo(() => {
    if (items.some((item) => getId(item) === selectedId)) {
      return selectedId;
    }

    return items[0] ? getId(items[0]) : "";
  }, [getId, items, selectedId]);

  const selectedItem = useMemo(
    () => items.find((item) => getId(item) === effectiveSelectedId) || null,
    [effectiveSelectedId, getId, items],
  );

  return {
    effectiveSelectedId,
    selectedItem,
  };
}
