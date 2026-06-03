import { useCallback, useEffect, useRef, useState } from "react";

const pageDataSwapDelay = 680;
const pageRevealDelay = 160;
const mobilePageHeightLockDelay = 560;

export default function usePageTransition({
  currentPage,
  isMobileList,
  onPageChange,
  totalPages,
}) {
  const timeoutRef = useRef(null);
  const revealTimeoutRef = useRef(null);
  const frameRef = useRef(null);
  const cancelScrollRef = useRef(null);
  const [direction, setDirection] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [minHeight, setMinHeight] = useState(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    cancelScrollRef.current?.();

    timeoutRef.current = null;
    revealTimeoutRef.current = null;
    frameRef.current = null;
    cancelScrollRef.current = null;
    setPageLoading(false);
    setMinHeight(null);
  }, []);

  useEffect(() => cancel, [cancel]);

  const changePage = useCallback(
    (nextPage, containerElement) => {
      const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

      if (clampedPage === currentPage || pageLoading) return;

      const rect = containerElement?.getBoundingClientRect();
      const nextDirection = clampedPage > currentPage ? 1 : -1;

      cancel();
      setDirection(nextDirection);
      setMinHeight(rect?.height || null);

      if (isMobileList) {
        onPageChange(clampedPage);
        revealTimeoutRef.current = window.setTimeout(() => {
          setMinHeight(null);
          revealTimeoutRef.current = null;
        }, mobilePageHeightLockDelay);
        return;
      }

      setPageLoading(true);
      timeoutRef.current = window.setTimeout(() => {
        onPageChange(clampedPage);
        timeoutRef.current = null;

        revealTimeoutRef.current = window.setTimeout(() => {
          setPageLoading(false);
          setMinHeight(null);
          revealTimeoutRef.current = null;
        }, pageRevealDelay);
      }, pageDataSwapDelay);
    },
    [cancel, currentPage, isMobileList, onPageChange, pageLoading, totalPages],
  );

  return {
    cancelPageLoading: cancel,
    handlePageChange: changePage,
    pageDirection: direction,
    pageLoading,
    pageLoadingMinHeight: minHeight,
  };
}
