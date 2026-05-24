import CinematicSection from "../cinematic/CinematicSection";
import HistoryCarousel from "./HistoryCarousel";

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
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Nuestra historia</p>

          <h1 className="section-title">Una historia construida poco a poco</h1>

          <p className="section-text">
            Entre viajes, momentos sencillos y recuerdos compartidos, llegamos
            hasta este día con muchísima ilusión.
          </p>
        </div>

        <HistoryCarousel images={historyImages} />
      </div>
    </CinematicSection>
  );
}
