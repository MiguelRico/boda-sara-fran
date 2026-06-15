import {
  GlassWater,
  HeartHandshake,
  PartyPopper,
  Utensils,
} from "lucide-react";

import RevealOnView from "../../ui/RevealOnView";

const timelineIcons = {
  "glass-water": GlassWater,
  "heart-handshake": HeartHandshake,
  "party-popper": PartyPopper,
  utensils: Utensils,
};

export default function TimelineCard({ event, index, isLast }) {
  const Icon = timelineIcons[event.icon] || HeartHandshake;

  return (
    <RevealOnView
      as="article"
      delay={index * 0.06}
      className="
        grid
        grid-cols-[4.5rem_1.5rem_1fr]
        gap-4
      "
    >
      <div className="pt-2 text-right">
        <span className="font-serif text-2xl leading-none --color-accent-dark">
          {event.time}
        </span>
      </div>

      <div className="relative flex justify-center">
        <span
          className="
            relative z-10 mt-2 flex h-5 w-5 items-center justify-center
            rounded-full border border-[var(--color-accent-dark)]
            bg-[var(--color-accent-dark)]
            shadow-[0_0_0_6px_rgba(143,111,86,0.08)]
          "
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        </span>

        {!isLast && (
          <span
            className="
              absolute left-1/2 top-8 bottom-0
              w-px -translate-x-1/2
              bg-gradient-to-b from-[var(--color-accent-dark)] via-[var(--color-accent)] to-transparent
            "
          />
        )}
      </div>

      <div className="pb-2">
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl leading-tight text-[var(--color-accent-dark)]">
              {event.title}
            </h3>
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/70 text-lg">
              <Icon size={18} strokeWidth={1.8} />
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
            {event.description}
          </p>
        </div>
      </div>
    </RevealOnView>
  );
}
