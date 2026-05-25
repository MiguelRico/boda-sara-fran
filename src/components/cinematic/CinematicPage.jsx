import FinalCTA from "../common/FinalCTA";
import Hero from "../common/Hero";

export default function CinematicPage({ children, className = "" }) {
  return (
    <main className={`cinematic-page ${className}`}>
      <Hero />
      {children}
      <FinalCTA />
    </main>
  );
}
