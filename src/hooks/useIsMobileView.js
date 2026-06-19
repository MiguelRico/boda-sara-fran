import { useEffect, useState } from "react";

const MOBILE_VIEW_QUERY = "(max-width: 767px)";

export default function useIsMobileView() {
  const [isMobileView, setIsMobileView] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_VIEW_QUERY);
    const syncMobileView = () => setIsMobileView(mediaQuery.matches);

    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileView);
    };
  }, []);

  return isMobileView;
}
