import { useEffect } from "react";

export default function useViewportScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const originalBodyStyle = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const originalHtmlStyle = {
      overflow: documentElement.style.overflow,
      overscrollBehavior: documentElement.style.overscrollBehavior,
    };
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      documentElement.style.overflow = originalHtmlStyle.overflow;
      documentElement.style.overscrollBehavior =
        originalHtmlStyle.overscrollBehavior;
      body.style.overflow = originalBodyStyle.overflow;
      body.style.position = originalBodyStyle.position;
      body.style.top = originalBodyStyle.top;
      body.style.left = originalBodyStyle.left;
      body.style.right = originalBodyStyle.right;
      body.style.width = originalBodyStyle.width;
      body.style.paddingRight = originalBodyStyle.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
