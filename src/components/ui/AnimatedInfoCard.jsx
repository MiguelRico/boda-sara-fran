import { Link } from "react-router-dom";
import RevealOnView from "../ui/RevealOnView";

function InfoCard({
  title,
  subtitle,
  description,
  to,
  emoji,
  backgroundIcon,
  className = "",
  inlineTitleDescription = false,
  showAction = Boolean(to),
  style,
  summaryView = false,
}) {
  const Component = to ? Link : "div";
  const componentProps = to ? { to } : {};
  const cardSizeClass = summaryView
    ? "inline-flex w-fit max-w-full items-center justify-center"
    : "block h-full";

  return (
    <Component
      {...componentProps}
      style={style}
      className={`
        group relative ${cardSizeClass} overflow-hidden
        rounded-[2rem] border border-[var(--color-border-strong)]
        bg-white/55 p-7 shadow-[0_24px_70px_rgba(77,56,40,0.08)]
        backdrop-blur-sm transition-all duration-700
        hover:-translate-y-1 hover:border-[var(--color-border)] hover:bg-white/80
        sm:p-8
        ${to ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {summaryView ? (
        <div className="relative flex min-w-0 flex-col items-center justify-center gap-3 text-center">
          <div className="flex min-w-0 items-center justify-center gap-3 sm:flex-col">
            {emoji && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border-strong)] bg-white/70 text-xl">
                {emoji}
              </span>
            )}

            {title && (
              <p className="font-serif text-3xl leading-tight text-[var(--color-text)] sm:text-4xl">
                {title}
              </p>
            )}
          </div>

          {description && (
            <p className="min-w-0 break-words text-sm leading-relaxed text-[var(--color-accent)] sm:text-base">
              {description}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute right-6 top-6 text-5xl text-[var(--color-accent-dark)] opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
            {backgroundIcon || emoji}
          </div>

          <div className="relative flex h-full flex-col">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/70 text-xl text-[var(--color-accent-dark)]">
                {emoji}
              </span>

              <p className="section-eyebrow mb-0">{subtitle}</p>
            </div>

            {inlineTitleDescription ? (
              <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="font-serif text-3xl leading-tight text-[var(--color-text)] sm:text-4xl">
                  {title}
                </h3>

                <p className="text-sm leading-relaxed text-[var(--color-accent)] sm:text-base">
                  {description}
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-3xl leading-tight text-[var(--color-text)] sm:text-4xl">
                  {title}
                </h3>

                <p className="mt-5 flex-1 text-sm leading-relaxed text-[var(--color-accent)] sm:text-base">
                  {description}
                </p>
              </>
            )}

            {showAction && (
              <div className="mt-10 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent-dark)]">
                  Ver detalles
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-accent-dark)] transition-all duration-500 group-hover:translate-x-1 group-hover:border-[var(--color-border)]">
                  {">"}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </Component>
  );
}

export default function AnimatedInfoCard({ card, index }) {
  return (
    <RevealOnView
      as="article"
      amount={0.7}
      margin="0px 0px -12% 0px"
      delay={index * 0.06}
      className={card.summaryView ? "h-auto w-fit max-w-full" : "h-full"}
    >
      <InfoCard {...card} />
    </RevealOnView>
  );
}
