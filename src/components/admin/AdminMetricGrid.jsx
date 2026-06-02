import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import AnimatedInfoCard from "../ui/AnimatedInfoCard";

const DEFAULT_GRID_CLASS =
  "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
const DEFAULT_CARD_CLASS =
  "rounded-[1.5rem] border-[var(--color-border)] bg-white/45 p-4 sm:p-5";

export function AdminMetricGrid({
  items,
  className = DEFAULT_GRID_CLASS,
  cardClassName = DEFAULT_CARD_CLASS,
  compactSummary = false,
}) {
  const itemRefs = useRef([]);
  const [summarySize, setSummarySize] = useState(null);
  const [shouldFitContent, setShouldFitContent] = useState(false);
  const sizeKey = useMemo(
    () =>
      items
        .map((item) => `${item.label}|${item.value}|${item.detail}|${item.emoji}`)
        .join("::"),
    [items],
  );
  const activeSummarySize = summarySize?.key === sizeKey ? summarySize : null;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateShouldFitContent = () =>
      setShouldFitContent(mediaQuery.matches);

    updateShouldFitContent();
    mediaQuery.addEventListener("change", updateShouldFitContent);

    return () =>
      mediaQuery.removeEventListener("change", updateShouldFitContent);
  }, []);

  useLayoutEffect(() => {
    if (activeSummarySize) return undefined;

    const measureCards = () => {
      const sizes = itemRefs.current
        .map((node) => node?.firstElementChild?.firstElementChild)
        .filter(Boolean)
        .map((node) => node.getBoundingClientRect());

      if (!sizes.length) return;

      setSummarySize({
        height: Math.ceil(Math.max(...sizes.map((size) => size.height))),
        key: sizeKey,
        width: Math.ceil(Math.max(...sizes.map((size) => size.width))),
      });
    };

    const frameId = window.requestAnimationFrame(measureCards);

    return () => window.cancelAnimationFrame(frameId);
  }, [activeSummarySize, sizeKey]);

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          className="flex justify-center"
          key={item.label}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
        >
          <AnimatedInfoCard
            card={{
              className: cardClassName,
              description: item.detail,
              emoji: item.emoji,
              inlineTitleDescription: true,
              showAction: false,
              summaryCompact: compactSummary,
              style: activeSummarySize
                ? getSummaryCardStyle(activeSummarySize, shouldFitContent)
                : undefined,
              subtitle: item.label,
              title: String(item.value),
              summaryView: true,
            }}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}

function getSummaryCardStyle(summarySize, shouldFitContent) {
  if (shouldFitContent) {
    return {
      width: `${summarySize.width}px`,
    };
  }

  return {
    minHeight: `${summarySize.height}px`,
    width: `${summarySize.width}px`,
  };
}

export function AdminMetricGridSkeleton({
  count = 6,
  className = DEFAULT_GRID_CLASS,
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="min-h-48 animate-pulse rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 sm:p-5"
          key={index}
        >
          <div className="h-11 w-11 rounded-full bg-[var(--color-border)]" />
          <div className="mt-8 h-4 w-24 rounded-full bg-[var(--color-border)]" />
          <div className="mt-4 h-12 w-20 rounded-full bg-[var(--color-border)]" />
        </div>
      ))}
    </div>
  );
}
