import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import { siteContent } from "../../config/siteContent";
import TransportCard from "./transport/TransportCard";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function TransportSection() {
  const { transport } = siteContent.details;
  const isMobileView = useIsMobileView();
  const contentClassName = isMobileView
    ? "mx-auto max-w-5xl"
    : "mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-7xl flex-col justify-center";
  const gridClassName = isMobileView
    ? "mt-4 grid grid-cols-1 gap-5"
    : "grid grid-cols-2 gap-5";

  return (
    <CinematicSection id="transport">
      <div className={contentClassName}>
        <HeaderSection
          eyebrow={transport.eyebrow}
          title={transport.title}
          text={transport.text}
          showTitleAndTextOnMobile
        />

        <div className={gridClassName}>
          {transport.routes.map((route) => (
            <TransportCard key={route.title} route={route} />
          ))}
        </div>
      </div>
    </CinematicSection>
  );
}
