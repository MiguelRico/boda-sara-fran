import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import { siteContent } from "../../config/siteContent";
import TimelineCard from "./timeline/TimelineCard";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function TimelineSection() {
  const { timeline } = siteContent.details;
  const isMobileView = useIsMobileView();
  const contentClassName = isMobileView
    ? "mx-auto max-w-5xl"
    : "mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.75fr_1.25fr]";
  const timelineClassName = isMobileView
    ? "mx-auto mt-4 max-w-4xl"
    : "mx-auto w-full max-w-5xl";

  return (
    <CinematicSection id="timeline" className="surface-soft">
      <div className={contentClassName}>
        <HeaderSection
          eyebrow={timeline.eyebrow}
          title={timeline.title}
          text={timeline.text}
          showTitleAndTextOnMobile
        />

        <div className={timelineClassName}>
          {timeline.events.map((event, index) => (
            <TimelineCard
              key={event.time}
              event={event}
              index={index}
              isLast={index === timeline.events.length - 1}
            />
          ))}
        </div>
      </div>
    </CinematicSection>
  );
}

