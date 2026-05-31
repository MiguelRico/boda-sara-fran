import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import AnimatedInfoCard from "../components/ui/AnimatedInfoCard";
import HeroSection from "../components/home/HeroSection";
import { siteContent } from "../config/siteContent";

export default function Home() {
  return (
    <CinematicPage>
      <HeroSection />

      <CinematicSection id="detalles">
        <div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {siteContent.home.cards.map((card, index) => (
              <AnimatedInfoCard key={card.title} card={card} index={index} />
            ))}
          </div>
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}
