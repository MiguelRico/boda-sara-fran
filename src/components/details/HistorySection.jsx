import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import ImageCarousel from "../ui/ImageCarousel";
import { siteContent } from "../../config/siteContent";

export default function HistorySection() {
  const { history } = siteContent.details;

  return (
    <CinematicSection id="history" className="surface-soft">
      <div>
        <HeaderSection
          eyebrow={history.eyebrow}
          title={history.title}
          titleAs="h1"
          text={history.text}
        />

        <ImageCarousel
          images={history.images}
          className="mx-auto mt-4 max-w-4xl"
          imageClassName="aspect-[4/5] w-full text-center"
          imageLoading="eager"
        />
      </div>
    </CinematicSection>
  );
}
