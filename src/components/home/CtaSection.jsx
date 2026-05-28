import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../cinematic/CinematicStaggeredRevealItem";
import PrimaryButton from "../common/PrimaryButton";

export default function CtaSection() {
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, {
    once: true,
    amount: 0.35,
  });

  return (
    <CinematicSection className="surface-warm" reveal={false}>
      <div ref={ctaRef} className="mx-auto max-w-3xl text-center">
        <CinematicStaggeredRevealItem index={0} isVisible={ctaInView}>
          <p className="section-eyebrow">Te esperamos</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={1} isVisible={ctaInView}>
          <h2 className="section-title">Queremos celebrarlo contigo</h2>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={2} isVisible={ctaInView}>
          <p className="section-text">
            Nos ayudará mucho saber si podrás acompañarnos en este día tan
            especial.
          </p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={ctaInView}>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton to="/rsvp#search">
              Confirmar asistencia
            </PrimaryButton>

            <PrimaryButton to="/" variant="secondary">
              Volver al inicio
            </PrimaryButton>
          </div>
        </CinematicStaggeredRevealItem>
      </div>
    </CinematicSection>
  );
}
