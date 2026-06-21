import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../cinematic/CinematicStaggeredRevealItem";
import IconButton from "../ui/IconButton";
import { siteContent } from "../../config/siteContent";
import { CalendarCheck, Map } from "lucide-react";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function HeroSection({ cards }) {
  const isMobileView = useIsMobileView();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, {
    once: true,
    amount: 0.35,
  });
  const { coupleName, home, weddingDate } = siteContent;
  const actionsClassName = isMobileView
    ? "flex flex-col items-center justify-center gap-4"
    : "flex flex-row items-center justify-center gap-4";

  return (
    <CinematicSection id="init" className="surface-soft" reveal={false}>
      <div
        ref={heroRef}
        className="relative mx-auto flex min-h-[calc(100svh-12rem)] max-w-5xl flex-col items-center justify-center text-center"
      >
        <CinematicStaggeredRevealItem index={0} isVisible={heroInView}>
          <p className="section-eyebrow">{weddingDate.hero}</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={1} isVisible={heroInView}>
          <h1 className="hero-title">{coupleName}</h1>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={2} isVisible={heroInView}>
          <div className="mt-4 mb-4 h-px w-20 bg-[var(--color-accent-dark)]" />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={heroInView}>
          <p className="mt-0 section-text">{home.hero.text}</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={heroInView}>
          <div className={actionsClassName}>
            <IconButton
              icon={<Map size={16} strokeWidth={1.8} />}
              showText="always"
              to="/details#history"
              tone="secondary"
            >
              {home.hero.secondaryAction}
            </IconButton>

            <IconButton
              icon={<CalendarCheck size={16} strokeWidth={1.8} />}
              showText="always"
              tone="primary"
              to="/rsvp"
            >
              {home.hero.primaryAction}
            </IconButton>
          </div>
        </CinematicStaggeredRevealItem>

        {isMobileView ? (
          <CinematicStaggeredRevealItem index={5} isVisible={heroInView}>
            <div className="mt-14 flex flex-col items-center gap-3 text-[var(--color-accent-dark)]">
              <span className="text-[0.65rem] uppercase tracking-[0.35em]">
                {home.hero.scrollHint}
              </span>

              <span className="h-10 w-px bg-[var(--color-accent-dark)]" />
            </div>
          </CinematicStaggeredRevealItem>
        ) : (
          <CinematicStaggeredRevealItem index={5} isVisible={heroInView}>
            <div className="mt-5 grid w-full grid-cols-3 gap-5">{cards}</div>
          </CinematicStaggeredRevealItem>
        )}
      </div>
    </CinematicSection>
  );
}
