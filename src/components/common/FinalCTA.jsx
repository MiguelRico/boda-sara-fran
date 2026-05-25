import CinematicSection from "../cinematic/CinematicSection";
import PrimaryButton from "./PrimaryButton";

export default function FinalCTA() {
  return (
    <CinematicSection className="surface-warm">
      <div className="mx-auto max-w-3xl text-center">
        <p className="section-eyebrow">Te esperamos</p>

        <h2 className="section-title">Queremos celebrarlo contigo</h2>

        <p className="section-text">
          Nos ayudará mucho saber si podrás acompañarnos en este día tan
          especial.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <PrimaryButton to="/rsvp#search">Confirmar asistencia</PrimaryButton>

          <PrimaryButton to="/" variant="secondary">
            Volver al inicio
          </PrimaryButton>
        </div>
      </div>
    </CinematicSection>
  );
}
