import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../cinematic/CinematicStaggeredRevealItem";
import IconButton from "../ui/IconButton";
import { siteContent } from "../../constants/siteContent";
import { CalendarCheck, Map } from "lucide-react";

export default function HeroSection() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, {
    once: true,
    amount: 0.35,
  });
  const { coupleName, home, weddingDate } = siteContent;

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
          <div className="mt-8 mb-2 h-px w-20 bg-[var(--color-accent-dark)]" />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={heroInView}>
          <p className="section-text">{home.hero.text}</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={heroInView}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <IconButton
              icon={<CalendarCheck size={16} strokeWidth={1.8} />}
              showText="always"
              tone="primary"
              to="/rsvp"
            >
              {home.hero.primaryAction}
            </IconButton>

            <IconButton
              icon={<Map size={16} strokeWidth={1.8} />}
              showText="always"
              to="/details#history"
              tone="secondary"
            >
              {home.hero.secondaryAction}
            </IconButton>
          </div>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={5} isVisible={heroInView}>
          <div className="mt-14 flex flex-col items-center gap-3 text-[var(--color-accent-dark)]">
            <span className="text-[0.65rem] uppercase tracking-[0.35em]">
              {home.hero.scrollHint}
            </span>

            <span className="h-10 w-px bg-[var(--color-accent-dark)]" />
          </div>
        </CinematicStaggeredRevealItem>
      </div>
    </CinematicSection>
  );
}
