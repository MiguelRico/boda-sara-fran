import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import Hero from "../components/common/Hero";
import FinalCTA from "../components/common/FinalCTA";
import InfoCard from "../components/ui/InfoCard";
import RevealOnView from "../components/ui/RevealOnView";

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

function AnimatedInfoCard({ card, index }) {
  return (
    <RevealOnView
      as="article"
      amount={0.7}
      margin="0px 0px -12% 0px"
      delay={index * 0.06}
      className="h-full"
    >
      <InfoCard {...card} />
    </RevealOnView>
  );
}

export default function Home() {
  return (
    <CinematicPage>
      <Hero />

      <CinematicSection id="detalles">
        <div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {infoCards.map((card, index) => (
              <AnimatedInfoCard
                key={card.title}
                card={card}
                index={index}
              />
            ))}
          </div>
        </div>
      </CinematicSection>

      <FinalCTA />
    </CinematicPage>
  );
}
