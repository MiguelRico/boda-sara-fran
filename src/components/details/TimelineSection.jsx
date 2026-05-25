import { motion, useReducedMotion } from "framer-motion";
import CinematicSection from "../cinematic/CinematicSection";

const timelineEvents = [
  {
    time: "18:00",
    title: "Ceremonia",
    description:
      "Celebraremos el momento más especial del día en un entorno natural y cuidado.",
  },
  {
    time: "20:00",
    title: "Cóctel",
    description:
      "Un primer brindis para encontrarnos y empezar a disfrutar juntos de la celebración.",
  },
  {
    time: "22:00",
    title: "Cena",
    description:
      "Una cena pensada para compartir, disfrutar y celebrar con las personas que queremos.",
  },
  {
    time: "00:00",
    title: "Fiesta",
    description: "La noche continuará con música, baile y muchas sorpresas.",
  },
];

function TimelineItem({ event, index, isLast }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 24, filter: "blur(8px)" }
      }
      whileInView={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        duration: 0.8,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        grid
        grid-cols-[4.5rem_1.5rem_1fr]
        gap-4
        sm:grid-cols-[6rem_2rem_1fr]
        sm:gap-6
      "
    >
      <div className="pt-2 text-right">
        <span className="font-serif text-2xl leading-none text-[#8f6f56] sm:text-3xl">
          {event.time}
        </span>
      </div>

      <div className="relative flex justify-center">
        <span
          className="
            relative z-10 mt-2 flex h-5 w-5 items-center justify-center
            rounded-full border border-[#d8c1ad]
            bg-[#fbf7f1]
            shadow-[0_0_0_6px_rgba(143,111,86,0.08)]
          "
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#8f6f56]" />
        </span>

        {!isLast && (
          <span
            className="
              absolute left-1/2 top-8 bottom-0
              w-px -translate-x-1/2
              bg-gradient-to-b from-[#d8c1ad] via-[#eadccb] to-transparent
            "
          />
        )}
      </div>

      <div className="pb-2">
        <div className="premium-card">
          <h3 className="font-serif text-3xl leading-tight text-[#2f2a25]">
            {event.title}
          </h3>

          <p className="mt-4 text-sm leading-relaxed text-[#7b6b5d] sm:text-base">
            {event.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default function TimelineSection() {
  return (
    <CinematicSection id="timeline" className="surface-soft">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">El ritmo del día</p>

          <h2 className="section-title">Timeline</h2>

          <p className="section-text">
            Una guía sencilla para que puedas vivir cada momento con calma, sin
            prisas y disfrutando de lo importante.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          {timelineEvents.map((event, index) => (
            <TimelineItem
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
