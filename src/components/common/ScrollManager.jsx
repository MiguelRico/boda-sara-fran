import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }

      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash, location.key]);

  return null;
}
