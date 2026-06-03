import { useEffect, useMemo, useState } from "react";

export default function usePagedData({
  desktopPageSize,
  items,
  mobilePageSize,
  page,
}) {
  const [isMobileList, setIsMobileList] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobileList = () => setIsMobileList(mediaQuery.matches);

    updateIsMobileList();
    mediaQuery.addEventListener("change", updateIsMobileList);

    return () => mediaQuery.removeEventListener("change", updateIsMobileList);
  }, []);

  return useMemo(() => {
    const pageSize = isMobileList ? mobilePageSize : desktopPageSize;
    const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
    const currentPage = Math.min(page, totalPages);
    const pagedItems = items.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    return {
      currentPage,
      isMobileList,
      pageSize,
      pagedItems,
      totalPages,
    };
  }, [desktopPageSize, isMobileList, items, mobilePageSize, page]);
}
