import { motion, useReducedMotion } from "framer-motion";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
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

function AnimatedInfoCard({ card, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 24, filter: "blur(8px)" }
      }
      whileInView={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        duration: 0.8,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <InfoCard {...card} />
    </motion.article>
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
