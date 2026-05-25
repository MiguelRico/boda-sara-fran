import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";

import InfoCard from "../components/common/InfoCard";

export default function Home() {
  return (
    <CinematicPage>
      <CinematicSection id="detalles">
        <div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <InfoCard
              title="Ceremonia"
              subtitle="18:00 · Aguas del Pino"
              description="Una ceremonia al aire libre rodeados de naturaleza, música y una puesta de sol inolvidable."
              to="/details#ceremony"
              emoji="💍"
            />

            <InfoCard
              title="Transporte"
              subtitle="Huelva y Corrales"
              description="Consulta los horarios de ida y vuelta para disfrutar sin preocuparte por el desplazamiento."
              emoji="🚌"
              to="/details#transport"
            />

            <InfoCard
              title="Celebración"
              subtitle="Cena y fiesta"
              description="Después de la ceremonia nos espera una noche especial para brindar, cenar y bailar juntos."
              to="/details#timeline"
              emoji="✨"
            />
          </div>
        </div>
      </CinematicSection>

    </CinematicPage>
  );
}
