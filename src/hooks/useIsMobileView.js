const MOBILE_FIRST_VIEW = true;

export function useViewportMode() {
  return {
    isBrowserView: !MOBILE_FIRST_VIEW,
    isMobileView: MOBILE_FIRST_VIEW,
    visualMode: MOBILE_FIRST_VIEW ? "mobile" : "browser",
  };
}

export default function useIsMobileView() {
  return useViewportMode().isMobileView;
}
