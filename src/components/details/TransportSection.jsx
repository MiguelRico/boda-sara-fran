import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import { siteContent } from "../../constants/siteContent";
import TransportCard from "./transport/TransportCard";

export default function TransportSection() {
  const { transport } = siteContent.details;

  return (
    <CinematicSection id="transport">
      <div className="mx-auto max-w-5xl">
        <HeaderSection
          eyebrow={transport.eyebrow}
          title={transport.title}
          text={transport.text}
        />

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {transport.routes.map((route) => (
            <TransportCard key={route.title} route={route} />
          ))}
        </div>
      </div>
    </CinematicSection>
  );
}

