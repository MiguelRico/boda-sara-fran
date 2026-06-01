import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import { siteContent } from "../../config/siteContent";
import TimelineCard from "./timeline/TimelineCard";

export default function TimelineSection() {
  const { timeline } = siteContent.details;

  return (
    <CinematicSection id="timeline" className="surface-soft">
      <div className="mx-auto max-w-5xl">
        <HeaderSection
          eyebrow={timeline.eyebrow}
          title={timeline.title}
          text={timeline.text}
        />

        <div className="mx-auto mt-4 max-w-4xl">
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

