import { useEffect, useState } from "react";

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
    if (!autoPlay || !hasMultipleImages) return;

    const timer = window.setInterval(goToNext, interval);

    return () => window.clearInterval(timer);
  }, [autoPlay, interval, hasMultipleImages, images.length]);

  if (!hasImages) return null;

  const currentImage = images[currentIndex];

  return (
    <div className={className}>
      <div className="premium-card p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-[1.7rem]">
          <img
            key={currentImage.src}
            src={currentImage.src}
            alt={currentImage.alt}
            className={imageClassName}
            loading={imageLoading}
          />

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
                  text-[#8f6f56] backdrop-blur-md
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
                  text-[#8f6f56] backdrop-blur-md
                  transition-all duration-300
                  hover:scale-105 hover:bg-white
                  sm:right-5 sm:h-12 sm:w-12
                "
              >
                &rsaquo;
              </button>
            </>
          )}

          {currentImage.caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-5 sm:p-7">
              <p className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                {currentImage.caption}
              </p>
            </div>
          )}
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
