import { useMemo } from "react";

import useIsMobileView from "./useIsMobileView";

export default function usePagedData({
  desktopPageSize,
  items,
  mobilePageSize,
  page,
  pageSize,
}) {
  const isMobileView = useIsMobileView();

  return useMemo(() => {
    const effectivePageSize =
      pageSize || (isMobileView ? mobilePageSize : desktopPageSize) || 1;
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
  }, [desktopPageSize, isMobileView, items, mobilePageSize, page, pageSize]);
}
