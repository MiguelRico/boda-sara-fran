import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import ImageCarousel from "../ui/ImageCarousel";
import { siteContent } from "../../config/siteContent";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function HistorySection() {
  const { history } = siteContent.details;
  const isMobileView = useIsMobileView();
  const contentClassName = isMobileView
    ? ""
    : "grid min-h-[calc(100svh-3rem)] w-full items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]";
  const carouselClassName = isMobileView
    ? "mx-auto mt-4 max-w-4xl"
    : "mx-auto w-full max-w-5xl";
  const imageClassName = isMobileView
    ? "aspect-[4/5] w-full text-center"
    : "aspect-[16/10] max-h-[58svh] w-full text-center";

  return (
    <CinematicSection id="history" className="surface-soft">
      <div className={contentClassName}>
        <HeaderSection
          eyebrow={history.eyebrow}
          title={history.title}
          titleAs="h1"
          text={history.text}
          showTitleAndTextOnMobile
        />

        <ImageCarousel
          images={history.images}
          className={carouselClassName}
          imageClassName={imageClassName}
          imageLoading="eager"
        />
      </div>
    </CinematicSection>
  );
}
