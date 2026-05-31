import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../common/HeaderSection";
import ImageCarousel from "../common/ImageCarousel";
import PrimaryButton from "../common/PrimaryButton";
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
            <PrimaryButton
              href={ceremony.mapUrl}
              icon={<MapPin size={16} strokeWidth={1.8} />}
              target="_blank"
            >
              {ceremony.mapLabel}
            </PrimaryButton>
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
