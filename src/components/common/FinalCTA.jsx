import CinematicSection from "../cinematic/CinematicSection";
import PrimaryButton from "./PrimaryButton";

export default function FinalCTA() {
  return (
    <CinematicSection className="surface-warm">
      <div className="mx-auto max-w-3xl text-center">
        <p className="section-eyebrow">Te esperamos</p>

        <h2 className="section-title">
          Nos haría mucha ilusión compartir este día contigo
        </h2>

        <p className="section-text">
          Muy pronto podrás confirmar asistencia, consultar horarios, transporte
          y todos los detalles importantes de la celebración.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <PrimaryButton to="/confirmar">Confirmar asistencia</PrimaryButton>

          <PrimaryButton to="#inicio" variant="secondary">
            Volver arriba
          </PrimaryButton>
        </div>
      </div>
    </CinematicSection>
  );
}
