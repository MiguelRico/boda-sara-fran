import { useMemo } from "react";

import useIsMobileView from "./useIsMobileView";

export default function usePagedData({
  items,
  page,
  pageSize = 1,
}) {
  const isMobileView = useIsMobileView();

  return useMemo(() => {
    const effectivePageSize = pageSize || 1;
    const totalPages = Math.max(
      Math.ceil(items.length / effectivePageSize),
      1,
    );
    const currentPage = Math.min(page, totalPages);
    const pagedItems = items.slice(
      (currentPage - 1) * effectivePageSize,
      currentPage * effectivePageSize,
    );

    return {
      currentPage,
      isMobileView,
      pageSize: effectivePageSize,
      pagedItems,
      totalPages,
    };
  }, [isMobileView, items, page, pageSize]);
}
