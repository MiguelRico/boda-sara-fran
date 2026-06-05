import { useEffect, useState } from "react";

export default function useIsMobileView() {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobileView = () => setIsMobileView(mediaQuery.matches);

    updateIsMobileView();
    mediaQuery.addEventListener("change", updateIsMobileView);

    return () => mediaQuery.removeEventListener("change", updateIsMobileView);
  }, []);

  return isMobileView;
}
