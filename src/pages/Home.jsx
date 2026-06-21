import { BusFront, HeartHandshake, Sparkles } from "lucide-react";

import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";
import HeroSection from "../components/home/HeroSection";
import { siteContent } from "../config/siteContent";
import useIsMobileView from "../hooks/useIsMobileView";

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
  const isMobileView = useIsMobileView();
  const cardsGridClassName = isMobileView
    ? "grid grid-cols-1 gap-5"
    : "grid grid-cols-3 gap-5";
  const cards = siteContent.home.cards.map((card, index) => (
    <AnimatedInfoCard
      key={card.title}
      card={{
        ...getHomeCard(card),
        showAction: isMobileView,
      }}
      index={index}
    />
  ));

  return (
    <CinematicPage>
      <HeroSection cards={cards} />

      {isMobileView && (
        <CinematicSection id="detalles">
          <div>
            <div className={cardsGridClassName}>
              {cards}
            </div>
          </div>
        </CinematicSection>
      )}
    </CinematicPage>
  );
}
