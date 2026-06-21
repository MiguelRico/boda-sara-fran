import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../cinematic/CinematicStaggeredRevealItem";
import IconButton from "../ui/IconButton";
import { siteContent } from "../../config/siteContent";
import { CalendarCheck, Home } from "lucide-react";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function CtaSection() {
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, {
    once: true,
    amount: 0.35,
  });
  const isMobileView = useIsMobileView();
  const { cta } = siteContent.home;
  const contentClassName = isMobileView
    ? "mx-auto max-w-3xl text-center"
    : "mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-5xl flex-col items-center justify-center text-center";
  const actionsClassName = isMobileView
    ? "mt-4 flex flex-col items-center justify-center gap-4"
    : "mt-4 flex flex-row items-center justify-center gap-4";

  return (
    <CinematicSection className="surface-warm" reveal={false}>
      <div ref={ctaRef} className={contentClassName}>
        <CinematicStaggeredRevealItem index={0} isVisible={ctaInView}>
          <p className="section-eyebrow">{cta.eyebrow}</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={1} isVisible={ctaInView}>
          <h2 className="section-title">{cta.title}</h2>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={2} isVisible={ctaInView}>
          <p className="section-text">{cta.text}</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={ctaInView}>
          <div className={actionsClassName}>
            <IconButton
              icon={<CalendarCheck size={16} strokeWidth={1.8} />}
              showText="always"
              tone="primary"
              to="/rsvp"
            >
              {cta.primaryAction}
            </IconButton>

            <IconButton
              icon={<Home size={16} strokeWidth={1.8} />}
              showText="always"
              to="/"
              tone="terciary"
            >
              {cta.secondaryAction}
            </IconButton>
          </div>
        </CinematicStaggeredRevealItem>
      </div>
    </CinematicSection>
  );
}
