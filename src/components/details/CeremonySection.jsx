import CinematicSection from "../cinematic/CinematicSection";
import ImageCarousel from "../common/ImageCarousel";
import HeaderSection from "../common/HeaderSection";

const ceremonyImages = [
  {
    src: "/carousel/aguas-del-pino-1.jpg",
    alt: "Exterior de Aguas del Pino",
    caption: "Un entorno natural con vistas al Río Piedras.",
  },
  {
    src: "/carousel/aguas-del-pino-2.jpg",
    alt: "Ceremonia exterior en Aguas del Pino",
    caption: "Una ceremonia al aire libre, rodeada de luz y naturaleza.",
  },
];

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Aguas%20del%20Pino%2C%20Ctra%20A-5052%2C%20km%204%2C%20Punta%20Umbr%C3%ADa%2C%20Huelva";

export default function CeremonySection() {
  return (
    <CinematicSection id="ceremony" className="surface-soft">
      <div className="mx-auto max-w-6xl">
        <HeaderSection
          eyebrow="Un lugar para recordar"
          title="Ceremonia"
          text="Un espacio rodeado de naturaleza y con vistas al entorno del Río Piedras."
        >
          <p className="text-eyebrow mt-4">
            Aguas del Pino, Ctra. A-5052, km 4 · Punta Umbría, Huelva.
          </p>

          <div className="mt-4">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Cómo llegar
            </a>
          </div>
        </HeaderSection>

        <ImageCarousel
          images={ceremonyImages}
          className="mx-auto mt-4 w-full max-w-4xl"
          imageClassName="aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[4/3]"
        />
      </div>
    </CinematicSection>
  );
}
