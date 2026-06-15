import { BusFront, HeartHandshake, Sparkles } from "lucide-react";

import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";
import HeroSection from "../components/home/HeroSection";
import { siteContent } from "../config/siteContent";

const homeCardIcons = {
  "bus-front": BusFront,
  "heart-handshake": HeartHandshake,
  sparkles: Sparkles,
};

const getHomeCard = (card) => {
  const Icon = homeCardIcons[card.icon];

  if (!Icon) return card;

  return {
    ...card,
    backgroundIcon: <Icon size={72} strokeWidth={1.5} />,
    icon: <Icon size={22} strokeWidth={1.8} />,
  };
};

export default function Home() {
  return (
    <CinematicPage>
      <HeroSection />

      <CinematicSection id="detalles">
        <div>
          <div className="grid grid-cols-1 gap-5">
            {siteContent.home.cards.map((card, index) => (
              <AnimatedInfoCard
                key={card.title}
                card={getHomeCard(card)}
                index={index}
              />
            ))}
          </div>
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}
