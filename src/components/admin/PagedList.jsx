import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";

import { getRenderKey } from "../../utils/renderKeys";

export default function PagedList({
  allItems = [],
  className = "",
  direction = 1,
  getKey = getRenderKey,
  itemClassName = "absolute inset-x-0 top-0",
  items = [],
  page,
  renderItem,
  renderMeasureItem,
}) {
  const reduceMotion = useReducedMotion();
  const measureRefs = useRef([]);
  const [minHeight, setMinHeight] = useState(null);

  useLayoutEffect(() => {
    if (!allItems.length) return undefined;

    const updateHeight = () => {
      const nextHeight = allItems.reduce((max, _, index) => {
        const node = measureRefs.current[index];
        if (!node) return max;

        return Math.max(max, Math.ceil(node.getBoundingClientRect().height));
      }, 0);

      setMinHeight((current) => {
        if (!nextHeight) return current;
        return Math.abs((current || 0) - nextHeight) < 1 ? current : nextHeight;
      });
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, [allItems]);

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
  const pageKey = `${page}-${items.map((item, index) => getKey(item, { index })).join("|")}`;

  return (
    <div
      className={`relative overflow-hidden md:hidden ${className}`}
      style={
        minHeight
          ? { minHeight: `${minHeight}px`, height: `${minHeight}px` }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[-1] h-auto w-full opacity-0"
      >
        {allItems.map((item, index) => (
          <div
            key={`measure-${getKey(item, { index })}`}
            ref={(node) => {
              measureRefs.current[index] = node;
            }}
          >
            {renderMeasureItem
              ? renderMeasureItem(item, index)
              : renderItem(item, index)}
          </div>
        ))}
      </div>

      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          animate="center"
          className={itemClassName}
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
          {items.map((item, index) => (
            <div key={getKey(item, { index })}>{renderItem(item, index)}</div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
