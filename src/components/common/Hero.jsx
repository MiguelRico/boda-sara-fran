import CinematicSection from "../cinematic/CinematicSection";
import PrimaryButton from "./PrimaryButton";

export default function Hero() {
  return (
    <CinematicSection className="surface-soft" reveal={false}>
      <div className="relative mx-auto flex min-h-[calc(100svh-12rem)] max-w-5xl flex-col items-center justify-center text-center">
        <p className="section-eyebrow">22 de Agosto de 2026</p>

        <h1 className="hero-title">
          Sara <span className="mx-2">&</span> Fran
        </h1>

        <div className="mt-8 mb-8 h-px w-20 bg-[#d8c1ad]" />

        <p className="section-text">
          Después de muchos viajes, cafés improvisados y momentos compartidos,
          queremos celebrar el día más importante de nuestra historia con las
          personas que más queremos.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <PrimaryButton to="/confirmar">Confirmar asistencia</PrimaryButton>

          <PrimaryButton to="/details" variant="secondary">
            Ver detalles
          </PrimaryButton>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 text-[#9b7a61]">
          <span className="text-[0.65rem] uppercase tracking-[0.35em]">
            Desliza
          </span>

          <span className="h-10 w-px bg-[#d8c1ad]" />
        </div>
      </div>
    </CinematicSection>
  );
}
