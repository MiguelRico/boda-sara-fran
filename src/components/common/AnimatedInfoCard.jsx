import { Link } from "react-router-dom";
import RevealOnView from "../ui/RevealOnView";

function InfoCard({ title, subtitle, description, to, emoji, className = "" }) {
  return (
    <Link
      to={to}
      className={`
        group relative block h-full cursor-pointer overflow-hidden
        rounded-[2rem] border border-[#eadccb]
        bg-white/55 p-7 shadow-[0_24px_70px_rgba(77,56,40,0.08)]
        backdrop-blur-sm transition-all duration-700
        hover:-translate-y-1 hover:border-[#d8c1ad] hover:bg-white/80
        sm:p-8
        ${className}
      `}
    >
      <div className="pointer-events-none absolute right-6 top-6 text-5xl opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
        {emoji}
      </div>

      <div className="relative flex h-full flex-col">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#556b52] bg-[#fbf7f1]/70 text-xl">
            {emoji}
          </span>

          <p className="section-eyebrow">{subtitle}</p>
        </div>

        <h3 className="font-serif text-3xl leading-tight text-[#556b52] sm:text-4xl">
          {title}
        </h3>

        <p className="mt-5 flex-1 text-sm leading-relaxed text-[#6f8b6b] sm:text-base">
          {description}
        </p>

        <div className="mt-10 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.22em] text-[#556b52]">
            Ver detalles
          </span>

          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-accent-dark)] transition-all duration-500 group-hover:translate-x-1 group-hover:border-[var(--color-accent)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AnimatedInfoCard({ card, index }) {
  return (
    <RevealOnView
      as="article"
      amount={0.7}
      margin="0px 0px -12% 0px"
      delay={index * 0.06}
      className="h-full"
    >
      <InfoCard {...card} />
    </RevealOnView>
  );
}
