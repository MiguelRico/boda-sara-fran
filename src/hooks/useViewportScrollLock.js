import { useEffect } from "react";

let lockCount = 0;
let scrollY = 0;
let originalBodyStyle = null;
let originalHtmlStyle = null;

export default function useViewportScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const { body, documentElement } = document;

    if (lockCount === 0) {
      scrollY = window.scrollY;
      originalBodyStyle = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        paddingRight: body.style.paddingRight,
      };
      originalHtmlStyle = {
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
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(lockCount - 1, 0);

      if (lockCount > 0) return;

      documentElement.style.overflow = originalHtmlStyle?.overflow || "";
      documentElement.style.overscrollBehavior =
        originalHtmlStyle?.overscrollBehavior || "";
      body.style.overflow = originalBodyStyle?.overflow || "";
      body.style.position = originalBodyStyle?.position || "";
      body.style.top = originalBodyStyle?.top || "";
      body.style.left = originalBodyStyle?.left || "";
      body.style.right = originalBodyStyle?.right || "";
      body.style.width = originalBodyStyle?.width || "";
      body.style.paddingRight = originalBodyStyle?.paddingRight || "";
      window.scrollTo(0, scrollY);

      originalBodyStyle = null;
      originalHtmlStyle = null;
    };
  }, [active]);
}
