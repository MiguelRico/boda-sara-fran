import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ImageCarousel({
  images = [],
  autoPlay = true,
  interval = 4500,
  className = "",
  imageClassName = "aspect-[4/5] w-full object-cover sm:aspect-[16/10] lg:aspect-[16/9]",
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
      <div className="premium-card p-3 sm:p-4">
        <div
          className={`relative grid overflow-hidden rounded-[1.7rem] ${imageClassName}`}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={currentImage.src}
              src={currentImage.src}
              alt={currentImage.alt}
              className="col-start-1 row-start-1 h-full w-full object-cover"
              loading={imageLoading}
              initial={{ opacity: 0, scale: 1.045, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.018, filter: "blur(4px)" }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>

          {showControls && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Imagen anterior"
                className="
                  absolute left-3 top-1/2 z-10
                  flex h-10 w-10 -translate-y-1/2 items-center justify-center
                  rounded-full border border-white/50 bg-white/70
                  text-[var(--color-accent-dark)] backdrop-blur-md
                  transition-all duration-300
                  hover:scale-105 hover:bg-white
                  sm:left-5 sm:h-12 sm:w-12
                "
              >
                &lsaquo;
              </button>

              <button
                type="button"
                onClick={goToNext}
                aria-label="Imagen siguiente"
                className="
                  absolute right-3 top-1/2 z-10
                  flex h-10 w-10 -translate-y-1/2 items-center justify-center
                  rounded-full border border-white/50 bg-white/70
                  text-[var(--color-accent)] backdrop-blur-md
                  transition-all duration-300
                  hover:scale-105 hover:bg-white
                  sm:right-5 sm:h-12 sm:w-12
                "
              >
                &rsaquo;
              </button>
            </>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-5 sm:p-7">
            <AnimatePresence mode="wait">
              {currentImage.caption && (
                <motion.p
                  key={currentImage.caption}
                  className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base"
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
            <button
              key={image.src}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir a imagen ${index + 1}`}
              className={`
                h-2.5 rounded-full transition-all duration-500
                ${
                  index === currentIndex
                    ? "w-8 bg-[var(--color-accent-dark)]"
                    : "w-2.5 bg-[var(--color-accent)]"
                }
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}
