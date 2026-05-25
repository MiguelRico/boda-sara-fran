import CinematicSection from "../cinematic/CinematicSection";
import ImageCarousel from "../ui/ImageCarousel";
import SectionHeader from "../ui/SectionHeader";

const historyImages = [
  {
    src: "/carousel/image-1.jpg",
    alt: "Sara y Fran en uno de sus primeros recuerdos juntos",
    caption: "El inicio de una historia que fue creciendo poco a poco.",
  },
  {
    src: "/carousel/image-2.jpg",
    alt: "Sara y Fran compartiendo un momento especial",
    caption: "Pequeños momentos que se fueron convirtiendo en hogar.",
  },
  {
    src: "/carousel/image-3.jpg",
    alt: "Sara y Fran celebrando su historia",
    caption: "Y ahora, un nuevo capítulo que queremos vivir contigo.",
  },
  {
    src: "/carousel/image-4.jpg",
    alt: "Sara y Fran celebrando su historia",
    caption: "Y ahora, un nuevo capítulo que queremos vivir contigo.",
  },
];

export default function HistorySection() {
  return (
    <CinematicSection id="history" className="surface-soft">
      <div>
        <SectionHeader
          eyebrow="Una historia construida poco a poco"
          title="Nuestra historia"
          titleAs="h1"
          text="Entre viajes, momentos sencillos y recuerdos compartidos, llegamos hasta este día con muchísima ilusión."
        />

        <ImageCarousel
          images={historyImages}
          className="mx-auto mt-14 max-w-4xl"
          imageClassName="aspect-[4/5] w-full object-cover transition-opacity duration-700 sm:aspect-[16/10] lg:aspect-[16/9]"
          imageLoading="eager"
        />
      </div>
    </CinematicSection>
  );
}
