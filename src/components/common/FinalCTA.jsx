import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import StaggeredRevealItem from "../cinematic/StaggeredRevealItem";
import PrimaryButton from "./PrimaryButton";

export default function FinalCTA() {
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, {
    once: true,
    amount: 0.35,
  });

  return (
    <CinematicSection className="surface-warm" reveal={false}>
      <div ref={ctaRef} className="mx-auto max-w-3xl text-center">
        <StaggeredRevealItem index={0} isVisible={ctaInView}>
          <p className="section-eyebrow">Te esperamos</p>
        </StaggeredRevealItem>

        <StaggeredRevealItem index={1} isVisible={ctaInView}>
          <h2 className="section-title">Queremos celebrarlo contigo</h2>
        </StaggeredRevealItem>

        <StaggeredRevealItem index={2} isVisible={ctaInView}>
          <p className="section-text">
            Nos ayudará mucho saber si podrás acompañarnos en este día tan
            especial.
          </p>
        </StaggeredRevealItem>

        <StaggeredRevealItem index={3} isVisible={ctaInView}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton to="/rsvp#search">
              Confirmar asistencia
            </PrimaryButton>

            <PrimaryButton to="/" variant="secondary">
              Volver al inicio
            </PrimaryButton>
          </div>
        </StaggeredRevealItem>
      </div>
    </CinematicSection>
  );
}
