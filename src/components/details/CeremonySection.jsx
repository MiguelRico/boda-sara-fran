import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import ImageCarousel from "../ui/ImageCarousel";
import IconButton from "../ui/IconButton";
import { siteContent } from "../../config/siteContent";
import { MapPin } from "lucide-react";

export default function CeremonySection() {
  const { ceremony } = siteContent.details;

  return (
    <CinematicSection id="ceremony" className="surface-soft">
      <div className="mx-auto max-w-6xl">
        <HeaderSection
          eyebrow={ceremony.eyebrow}
          title={ceremony.title}
          text={ceremony.text}
        >
          <p className="text-eyebrow mt-4">{ceremony.address}</p>

          <div className="mt-4">
            <IconButton
              href={ceremony.mapUrl}
              icon={<MapPin size={16} strokeWidth={1.8} />}
              showText
              target="_blank"
              tone="primary"
            >
              {ceremony.mapLabel}
            </IconButton>
          </div>
        </HeaderSection>

        <ImageCarousel
          images={ceremony.images}
          className="mx-auto mt-4 w-full max-w-4xl"
          imageClassName="aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[4/3]"
        />
      </div>
    </CinematicSection>
  );
}



