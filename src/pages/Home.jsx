import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import StaggeredRevealItem from "../components/cinematic/StaggeredRevealItem";
import Hero from "../components/common/Hero";
import FinalCTA from "../components/common/FinalCTA";
import InfoCard from "../components/common/InfoCard";

const infoCards = [
  {
    title: "Ceremonia",
    subtitle: "18:00 · Aguas del Pino",
    description:
      "Una ceremonia al aire libre rodeados de naturaleza, música y una puesta de sol inolvidable.",
    to: "/details#ceremony",
    emoji: "💍",
  },
  {
    title: "Transporte",
    subtitle: "Huelva y Corrales",
    description:
      "Consulta los horarios de ida y vuelta para disfrutar sin preocuparte por el desplazamiento.",
    to: "/details#transport",
    emoji: "🚌",
  },
  {
    title: "Celebración",
    subtitle: "Cena y fiesta",
    description:
      "Después de la ceremonia nos espera una noche especial para brindar, cenar y bailar juntos.",
    to: "/details#timeline",
    emoji: "✨",
  },
];

function AnimatedInfoCard({ card, index, isVisible }) {
  return (
    <StaggeredRevealItem
      as="article"
      index={index}
      isVisible={isVisible}
      className="h-full"
    >
      <InfoCard {...card} />
    </StaggeredRevealItem>
  );
}

export default function Home() {
  const infoGridRef = useRef(null);
  const infoGridInView = useInView(infoGridRef, {
    once: true,
    amount: 0.35,
  });

  return (
    <CinematicPage>
      <Hero />

      <CinematicSection id="detalles">
        <div>
          <div
            ref={infoGridRef}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {infoCards.map((card, index) => (
              <AnimatedInfoCard
                key={card.title}
                card={card}
                index={index}
                isVisible={infoGridInView}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <FinalCTA />
    </CinematicPage>
  );
}
