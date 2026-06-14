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
      return;
    }

    if (!selectedId) return;

    const selectedIndex = sourceItems.findIndex(
      (item) => getId(item) === selectedId,
    );
    const nextPage =
      selectedIndex >= 0 ? Math.floor(selectedIndex / pageSize) + 1 : 1;

    if (nextPage !== currentPage) {
      onPageChange(nextPage);
    }
  }, [currentPage, getId, onPageChange, pageSize, selectedId, sourceItems]);

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
