import { useEffect, useMemo } from "react";

export default function useEffectiveSelection({
  allItems,
  currentPage,
  getId,
  items,
  onPageChange,
  pageSize,
  selectedId,
}) {
  const sourceItems = allItems || items;

  useEffect(() => {
    if (!onPageChange || !pageSize || !currentPage) return;

    if (!sourceItems.length) {
      if (currentPage !== 1) onPageChange(1);
    }
  }, [currentPage, onPageChange, pageSize, sourceItems]);

  const effectiveSelectedId = useMemo(() => {
    if (sourceItems.some((item) => getId(item) === selectedId)) {
      return selectedId;
    }

    return items[0] ? getId(items[0]) : "";
  }, [getId, items, selectedId, sourceItems]);

  const selectedItem = useMemo(
    () =>
      sourceItems.find((item) => getId(item) === effectiveSelectedId) || null,
    [effectiveSelectedId, getId, sourceItems],
  );

  return {
    effectiveSelectedId,
    selectedItem,
  };
}
