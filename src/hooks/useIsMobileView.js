import { useEffect, useState } from "react";

const FORCE_MOBILE_DESIGN = true;
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

function getActualIsMobileView() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function useViewportMode() {
  const [isActualMobileView, setIsActualMobileView] = useState(
    getActualIsMobileView,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateIsMobileView = () =>
      setIsActualMobileView(mediaQuery.matches);

    updateIsMobileView();
    mediaQuery.addEventListener("change", updateIsMobileView);

    return () => mediaQuery.removeEventListener("change", updateIsMobileView);
  }, []);

  return {
    isActualMobileView,
    isBrowserView: !isActualMobileView,
    isMobileView: FORCE_MOBILE_DESIGN || isActualMobileView,
    visualMode: FORCE_MOBILE_DESIGN ? "mobile" : "responsive",
  };
}

export default function useIsMobileView() {
  return useViewportMode().isMobileView;
}
