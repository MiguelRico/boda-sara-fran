import { useEffect, useState } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import PrimaryButton from "../common/PrimaryButton";

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

const MAP_EMBED_URL =
  "https://www.google.com/maps?q=Aguas%20del%20Pino%2C%20Ctra%20A-5052%2C%20km%204%2C%20Punta%20Umbr%C3%ADa%2C%20Huelva&output=embed";

function CeremonyCarousel({ images = [], autoPlay = true, interval = 4500 }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = images.length > 0;

  const goToPrevious = () => {
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const timer = window.setInterval(goToNext, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  if (!hasImages) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="premium-card p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-[1.7rem]">
        <img
          key={currentImage.src}
          src={currentImage.src}
          alt={currentImage.alt}
          className="aspect-[4/5] w-full object-cover sm:aspect-[16/10] lg:aspect-[4/3]"
          loading="lazy"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Imagen anterior"
              className="
                absolute left-3 top-1/2 z-10
                flex h-10 w-10 -translate-y-1/2 items-center justify-center
                rounded-full border border-white/50 bg-white/75
                text-[#8f6f56] backdrop-blur-md
                transition-all duration-300 hover:scale-105 hover:bg-white
              "
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Imagen siguiente"
              className="
                absolute right-3 top-1/2 z-10
                flex h-10 w-10 -translate-y-1/2 items-center justify-center
                rounded-full border border-white/50 bg-white/75
                text-[#8f6f56] backdrop-blur-md
                transition-all duration-300 hover:scale-105 hover:bg-white
              "
            >
              ›
            </button>
          </>
        )}

        {currentImage.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-5">
            <p className="max-w-xl text-sm leading-relaxed text-white/90">
              {currentImage.caption}
            </p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir a imagen ${index + 1}`}
              className={`
                h-2.5 rounded-full transition-all duration-500
                ${
                  index === currentIndex
                    ? "w-8 bg-[#8f6f56]"
                    : "w-2.5 bg-[#d8c1ad]"
                }
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CeremonySection() {
  return (
    <CinematicSection id="ceremony" className="surface-soft">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Ceremonia</p>

          <h2 className="section-title">Un lugar para recordar</h2>

          <p className="section-text">
            La ceremonia tendrá lugar en Aguas del Pino, un espacio rodeado de
            naturaleza y con vistas al entorno del Río Piedras.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-[#7b6b5d]">
            Aguas del Pino, Ctra. A-5052, km 4 · Punta Umbría, Huelva.
          </p>

          <div className="mt-10">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Cómo llegar
            </a>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <CeremonyCarousel images={ceremonyImages} />
        </div>
      </div>
    </CinematicSection>
  );
}
