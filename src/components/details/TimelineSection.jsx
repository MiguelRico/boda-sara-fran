import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../common/HeaderSection";
import TimelineCard from "./timeline/TimelineCard";

const timelineEvents = [
  {
    time: "19:00",
    title: "Ceremonia",
    description:
      "Celebraremos el momento más especial del día en un entorno natural y cuidado",
    emoji: "💍",
  },
  {
    time: "20:00",
    title: "Cóctel",
    description:
      "Primer brindis para encontrarnos y empezar a disfrutar de la celebración",
    emoji: "🥂",
  },
  {
    time: "22:00",
    title: "Cena",
    description:
      "Pensada para compartir, disfrutar y celebrar con las personas que queremos",
    emoji: "🍽️",
  },
  {
    time: "00:00",
    title: "Fiesta",
    description: "La noche continuará con música, baile y muchas sorpresas",
    emoji: "🎉",
  },
];

export default function TimelineSection() {
  return (
    <CinematicSection id="timeline" className="surface-soft">
      <div className="mx-auto max-w-5xl">
        <HeaderSection
          eyebrow="El ritmo del día"
          title="Timeline"
          text="Una guía sencilla para que puedas disfrutar cada momento."
        />

        <div className="mx-auto mt-8 max-w-4xl">
          {timelineEvents.map((event, index) => (
            <TimelineCard
              key={event.time}
              event={event}
              index={index}
              isLast={index === timelineEvents.length - 1}
            />
          ))}
        </div>
      </div>
    </CinematicSection>
  );
}
