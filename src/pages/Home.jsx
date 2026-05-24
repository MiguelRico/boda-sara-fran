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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <InfoCard
              title="Transporte"
              subtitle="Huelva y Corrales"
              description="Consulta los horarios de ida y vuelta para disfrutar sin preocuparte por el desplazamiento."
              emoji="🚌"
              to="/details#transporte"
            />
            <InfoCard
              title="Ceremonia"
              subtitle="18:00 · Aguas del Pino"
              description="Una ceremonia al aire libre rodeados de naturaleza, música y una puesta de sol inolvidable."
              to="/details#ceremonia"
              emoji="💍"
            />

            <InfoCard
              title="Celebración"
              subtitle="Cena y fiesta"
              description="Después de la ceremonia nos espera una noche especial para brindar, cenar y bailar juntos."
              to="/details#celebracion"
              emoji="✨"
            />
          </div>
        </div>
      </CinematicSection>

      <FinalCTA />
    </CinematicPage>
  );
}
