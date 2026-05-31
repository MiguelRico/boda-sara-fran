import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../cinematic/CinematicStaggeredRevealItem";
import PrimaryButton from "../common/PrimaryButton";
import { siteContent } from "../../config/siteContent";

export default function CtaSection() {
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, {
    once: true,
    amount: 0.35,
  });
  const { cta } = siteContent.home;

  return (
    <CinematicSection className="surface-warm" reveal={false}>
      <div ref={ctaRef} className="mx-auto max-w-3xl text-center">
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
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton to="/rsvp">{cta.primaryAction}</PrimaryButton>

            <PrimaryButton to="/" variant="secondary">
              {cta.secondaryAction}
            </PrimaryButton>
          </div>
        </CinematicStaggeredRevealItem>
      </div>
    </CinematicSection>
  );
}
