import { useMemo } from "react";

import useIsMobileView from "./useIsMobileView";

export default function usePagedData({
  desktopPageSize,
  items,
  mobilePageSize,
  page,
}) {
  const isMobileView = useIsMobileView();

  return useMemo(() => {
    const pageSize = isMobileView ? mobilePageSize : desktopPageSize;
    const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
    const currentPage = Math.min(page, totalPages);
    const pagedItems = items.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return {
      currentPage,
      isMobileView,
      pageSize,
      pagedItems,
      totalPages,
    };
  }, [desktopPageSize, isMobileView, items, mobilePageSize, page]);
}
