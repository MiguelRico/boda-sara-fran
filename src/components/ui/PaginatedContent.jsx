import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { getPaginationState } from "../../utils/paginationState";

export default function PaginatedContent({
  allItems = [],
  className = "",
  direction = 1,
  getKey = (_item, { index }) => index,
  lockHeight = true,
  page,
  pageSize,
  renderMeasurePage,
  renderPage,
  totalPages,
}) {
  const reduceMotion = useReducedMotion();
  const measureRefs = useRef([]);
  const visiblePageRef = useRef(null);
  const [height, setHeight] = useState(null);
  const pagination = getPaginationState({
    items: allItems,
    page,
    pageSize,
    totalPages,
  });
  const pageGroups = useMemo(
    () =>
      Array.from({ length: pagination.totalPages }, (_, pageIndex) =>
        allItems.slice(
          pageIndex * pagination.pageSize,
          (pageIndex + 1) * pagination.pageSize,
        ),
      ),
    [allItems, pagination.pageSize, pagination.totalPages],
  );
  const currentItems = pageGroups[pagination.page - 1] || [];
  const pageKey = `${pagination.page}-${currentItems
    .map((item, index) => getKey(item, { index }))
    .join("|")}`;
  const variants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (pageDirection) => ({
          opacity: 0,
          x: pageDirection > 0 ? 72 : -72,
          filter: "blur(6px)",
        }),
        center: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: (pageDirection) => ({
          opacity: 0,
          x: pageDirection > 0 ? -72 : 72,
          filter: "blur(6px)",
        }),
      };

  useLayoutEffect(() => {
    const updateHeight = () => {
      const nextHeight = measureRefs.current.reduce((max, node) => {
        if (!node) return max;

        return Math.max(max, Math.ceil(node.getBoundingClientRect().height));
      }, 0);

      setHeight((current) => {
        if (!nextHeight) return current;
        return Math.abs((current || 0) - nextHeight) < 1 ? current : nextHeight;
      });
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, [pageGroups, renderMeasurePage, renderPage]);

  useEffect(() => {
    const node = visiblePageRef.current;
    if (!node) return undefined;

    const updateVisibleHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setHeight((current) => {
        if (Math.abs((current || 0) - nextHeight) < 1) return current;
        return nextHeight;
      });
    };

    updateVisibleHeight();
    const observer = new ResizeObserver(updateVisibleHeight);
    observer.observe(node);

    return () => observer.disconnect();
  }, [pageKey]);

  return (
    <div
      className={`relative overflow-hidden ${lockHeight ? "" : "grid"} ${className}`}
      style={
        height
          ? lockHeight
            ? { minHeight: `${height}px`, height: `${height}px` }
            : { minHeight: `${height}px` }
          : undefined
      }
    >
      {lockHeight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-[-1] h-auto w-full opacity-0"
          inert=""
        >
          {pageGroups.map((items, index) => (
            <div
              key={`measure-page-${index}`}
              ref={(node) => {
                measureRefs.current[index] = node;
              }}
            >
              {(renderMeasurePage || renderPage)(items, index + 1)}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          animate="center"
          className={
            lockHeight
              ? "absolute inset-x-0 top-0"
              : "mt-0 col-start-1 row-start-1"
          }
          custom={direction}
          exit="exit"
          initial="enter"
          key={pageKey}
          transition={{
            duration: reduceMotion ? 0.18 : 0.48,
            ease: [0.22, 1, 0.36, 1],
          }}
          variants={variants}
        >
          <div ref={visiblePageRef}>
            {renderPage(currentItems, pagination.page)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
