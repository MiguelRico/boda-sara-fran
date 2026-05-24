import CinematicRevealItem from "./CinematicRevealItem";

export default function CinematicSection({
  id,
  children,
  className = "",
  innerClassName = "",
  reveal = true,
}) {
  return (
    <section id={id} className={`cinematic-section ${className}`}>
      <div className={`cinematic-container ${innerClassName}`}>
        {reveal ? (
          <CinematicRevealItem>{children}</CinematicRevealItem>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
