import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";

import Hero from "../components/common/Hero";
import InfoCard from "../components/common/InfoCard";
import FinalCTA from "../components/common/FinalCTA";

export default function Home() {
  return (
    <CinematicPage>
      <Hero />

      <CinematicSection id="detalles">
        <div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">Información</p>

            <h2 className="section-title">
              Todo lo importante en un mismo lugar
            </h2>

            <p className="section-text">
              Hemos preparado una experiencia sencilla y elegante para que
              puedas consultar cada detalle de la celebración.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            <InfoCard
              title="Ceremonia"
              subtitle="18:00 · Aguas del Pino"
              description="Una ceremonia al aire libre rodeados de naturaleza, música y una puesta de sol inolvidable."
              to="/details#ceremonia"
            />

            <InfoCard
              title="Transporte"
              subtitle="Autobuses"
              description="Consulta los horarios de salida y vuelta para disfrutar sin preocuparte por el desplazamiento."
              to="/details#transporte"
            />

            <InfoCard
              title="Celebración"
              subtitle="Cena y fiesta"
              description="Después de la ceremonia nos espera una noche especial para brindar, cenar y bailar juntos."
              to="/details#celebracion"
            />
          </div>
        </div>
      </CinematicSection>

      <FinalCTA />
    </CinematicPage>
  );
}
