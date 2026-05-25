import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import HeroSection from "../components/home/HeroSection";
import CtaSection from "../components/home/CtaSection";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";

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

export default function Home() {
  return (
    <CinematicPage>
      <HeroSection />

      <CinematicSection id="detalles">
        <div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {infoCards.map((card, index) => (
              <AnimatedInfoCard key={card.title} card={card} index={index} />
            ))}
          </div>
        </div>
      </CinematicSection>

      <CtaSection />
    </CinematicPage>
  );
}
