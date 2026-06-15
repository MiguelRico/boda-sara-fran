import { useMemo } from "react";

import useIsMobileView from "./useIsMobileView";
import { DEFAULT_TABLE_PAGE_SIZE } from "../utils/paginationState";

export default function usePagedData({
  items,
  page,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
}) {
  const isMobileView = useIsMobileView();

  return useMemo(() => {
    const effectivePageSize = pageSize || DEFAULT_TABLE_PAGE_SIZE;
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
