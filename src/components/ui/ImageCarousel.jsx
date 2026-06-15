import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "./IconButton";

export default function ImageCarousel({
  images = [],
  autoPlay = true,
  interval = 4500,
  className = "",
  imageClassName = "aspect-[4/5] w-full",
  imageLoading = "lazy",
  showSingleImageControls = false,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const showControls = hasMultipleImages || showSingleImageControls;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }, [images.length]);

  useEffect(() => {
    if (!autoPlay || !hasMultipleImages) return;

    const timer = window.setInterval(goToNext, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, interval, hasMultipleImages, goToNext]);

  if (!hasImages) return null;

  const currentImage = images[currentIndex];

  return (
    <div className={className}>
      <div className="premium-card p-3">
        <div
          className={`relative overflow-hidden rounded-[1.7rem] ${imageClassName}`}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={currentImage.src}
              src={currentImage.src}
              alt={currentImage.alt}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading={imageLoading}
              sizes="(min-width: 1024px) 896px, (min-width: 640px) calc(100vw - 6rem), calc(100vw - 2.5rem)"
              draggable="false"
              initial={{ opacity: 0, scale: 1.045, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.018, filter: "blur(4px)" }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>

          {showControls && (
            <>
              <IconButton
                className="
                  absolute left-3 top-1/2 z-10
                  h-10 w-10 -translate-y-1/2 border-white/50 bg-white/70
                  text-[var(--color-accent-dark)] backdrop-blur-md
                  hover:scale-105 hover:bg-white
                "
                icon={<ChevronLeft size={18} strokeWidth={1.8} />}
                label="Imagen anterior"
                onClick={goToPrevious}
                type="button"
              />

              <IconButton
                className="
                  absolute right-3 top-1/2 z-10
                  h-10 w-10 -translate-y-1/2 border-white/50 bg-white/70
                  text-[var(--color-accent)] backdrop-blur-md
                  hover:scale-105 hover:bg-white
                "
                icon={<ChevronRight size={18} strokeWidth={1.8} />}
                label="Imagen siguiente"
                onClick={goToNext}
                type="button"
              />
            </>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center bg-gradient-to-t from-transparent to-black/35 p-5 text-center">
            <AnimatePresence mode="wait">
              {currentImage.caption && (
                <motion.p
                  key={currentImage.caption}
                  className="mx-auto max-w-xl text-center text-sm leading-relaxed text-white/90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {currentImage.caption}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {images.map((image, index) => (
            <IconButton
              key={image.src}
              className={`
                !h-2.5 min-h-0 border-0 p-0 shadow-none hover:translate-y-0
                ${
                  index === currentIndex
                    ? "!w-8 bg-[var(--color-accent-dark)]"
                    : "!w-2.5 bg-[var(--color-accent)]"
                }
              `}
              icon={<span className="sr-only">Imagen {index + 1}</span>}
              label={`Ir a imagen ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
