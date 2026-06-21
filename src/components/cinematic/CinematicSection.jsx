import CinematicRevealItem from "./CinematicRevealItem";
import useIsMobileView from "../../hooks/useIsMobileView";

export default function CinematicSection({
  id,
  children,
  className = "",
  innerClassName = "",
  reveal = true,
}) {
  const isMobileView = useIsMobileView();
  const containerClassName = [
    "cinematic-container",
    !isMobileView ? "cinematic-container--browser" : "",
    innerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={`cinematic-section ${className}`}>
      <div className={containerClassName}>
        {reveal ? (
          <CinematicRevealItem>{children}</CinematicRevealItem>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
