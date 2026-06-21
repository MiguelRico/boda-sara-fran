import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import ImageCarousel from "../ui/ImageCarousel";
import IconButton from "../ui/IconButton";
import { siteContent } from "../../config/siteContent";
import { MapPin } from "lucide-react";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function CeremonySection() {
  const { ceremony } = siteContent.details;
  const isMobileView = useIsMobileView();
  const contentClassName = isMobileView
    ? "mx-auto max-w-6xl"
    : "mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]";
  const carouselClassName = isMobileView
    ? "mx-auto mt-4 w-full max-w-4xl"
    : "mx-auto w-full max-w-5xl";
  const imageClassName = isMobileView
    ? "aspect-[4/5] w-full"
    : "aspect-[16/10] max-h-[58svh] w-full";

  return (
    <CinematicSection id="ceremony" className="surface-soft">
      <div className={contentClassName}>
        <HeaderSection
          eyebrow={ceremony.eyebrow}
          title={ceremony.title}
          text={ceremony.text}
          showTitleAndTextOnMobile
        >
          <p className="text-eyebrow mt-4">{ceremony.address}</p>

          <div className="mt-4">
            <IconButton
              href={ceremony.mapUrl}
              icon={<MapPin size={16} strokeWidth={1.8} />}
              showText="always"
              target="_blank"
              tone="primary"
            >
              {ceremony.mapLabel || "Como llegar"}
            </IconButton>
          </div>
        </HeaderSection>

        <ImageCarousel
          images={ceremony.images}
          className={carouselClassName}
          imageClassName={imageClassName}
        />
      </div>
    </CinematicSection>
  );
}
