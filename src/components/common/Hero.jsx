import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../cinematic/CinematicStaggeredRevealItem";
import PrimaryButton from "../ui/PrimaryButton";

export default function Hero() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, {
    once: true,
    amount: 0.35,
  });

  return (
    <CinematicSection id="init" className="surface-soft" reveal={false}>
      <div
        ref={heroRef}
        className="relative mx-auto flex min-h-[calc(100svh-12rem)] max-w-5xl flex-col items-center justify-center text-center"
      >
        <CinematicStaggeredRevealItem index={0} isVisible={heroInView}>
          <p className="section-eyebrow">22 de Agosto de 2026</p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={1} isVisible={heroInView}>
          <h1 className="hero-title">
            Sara <span className="mx-2">&</span> Fran
          </h1>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={2} isVisible={heroInView}>
          <div className="mt-8 mb-2 h-px w-20 bg-[#d8c1ad]" />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={heroInView}>
          <p className="section-text">
            Después de muchos viajes, cafés improvisados y momentos compartidos,
            queremos celebrar el día más importante de nuestra historia con las
            personas que más queremos.
          </p>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={heroInView}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton to="/rsvp#search">
              Confirmar asistencia
            </PrimaryButton>

            <PrimaryButton to="/details#history" variant="secondary">
              Ver detalles
            </PrimaryButton>
          </div>
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={5} isVisible={heroInView}>
          <div className="mt-14 flex flex-col items-center gap-3 text-[#9b7a61]">
            <span className="text-[0.65rem] uppercase tracking-[0.35em]">
              Desliza
            </span>

            <span className="h-10 w-px bg-[#d8c1ad]" />
          </div>
        </CinematicStaggeredRevealItem>
      </div>
    </CinematicSection>
  );
}
