import CinematicSection from "../cinematic/CinematicSection";
import ImageCarousel from "../common/ImageCarousel";
import HeaderSection from "../common/HeaderSection";

const historyImages = [
  {
    src: "/carousel/image0.jpeg",
    alt: "Sara y Fran celebrando su historia",
    caption: "El inicio de una historia que fue creciendo poco a poco.",
  },
  {
    src: "/carousel/image1.jpeg",
    alt: "Sara y Fran celebrando su historia",
    caption: "Pequeños momentos que se fueron convirtiendo en hogar.",
  },
  {
    src: "/carousel/image2.jpeg",
    alt: "Sara y Fran celebrando su historia",
    caption: "Y ahora, un nuevo capítulo que queremos vivir contigo.",
  },
  {
    src: "/carousel/image3.jpeg",
    alt: "Sara y Fran celebrando su historia",
    caption: "Un sí que hizo todavía más grande todo lo que estaba por venir.",
  },
  {
    src: "/carousel/image4.jpeg",
    alt: "Sara y Fran celebrando su historia",
    caption:
      "Viajes, risas y ciudades que ya forman parte de nuestra historia.",
  },
  {
    src: "/carousel/image5.jpeg",
    alt: "Sara y Fran celebrando su historia",
    caption: "Celebrar la vida juntos siempre ha sido nuestro mejor plan.",
  },
];

export default function HistorySection() {
  return (
    <CinematicSection id="history" className="surface-soft">
      <div>
        <HeaderSection
          eyebrow="Una historia construida poco a poco"
          title="Nuestra historia"
          titleAs="h1"
          text="Entre viajes, momentos sencillos y recuerdos compartidos, llegamos hasta este día con muchísima ilusión."
        />

        <ImageCarousel
          images={historyImages}
          className="mx-auto mt-4 max-w-4xl"
          imageClassName="aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[16/9] text-center"
          imageLoading="eager"
        />
      </div>
    </CinematicSection>
  );
}
