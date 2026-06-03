import { useCallback, useState } from "react";

export default function usePageTransition({
  currentPage,
  onPageChange,
  totalPages,
}) {
  const [direction, setDirection] = useState(1);

  const cancel = useCallback(() => {}, []);

  const changePage = useCallback(
    (nextPage) => {
      const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

      if (clampedPage === currentPage) return;

      setDirection(clampedPage > currentPage ? 1 : -1);
      onPageChange(clampedPage);
    },
    [currentPage, onPageChange, totalPages],
  );

  return {
    cancelPageLoading: cancel,
    handlePageChange: changePage,
    pageDirection: direction,
    pageLoading: false,
    pageLoadingMinHeight: null,
  };
}
