import RevealOnView from "../../ui/RevealOnView";

export default function TimelineCard({ event, index, isLast }) {
  return (
    <RevealOnView
      as="article"
      delay={index * 0.06}
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
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-3xl leading-tight text-[#2f2a25]">
              {event.title}
            </h3>
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[#eadccb] bg-[#fbf7f1]/70 text-xl">
              {event.emoji}
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-[#7b6b5d] sm:text-base">
            {event.description}
          </p>
        </div>
      </div>
    </RevealOnView>
  );
}
