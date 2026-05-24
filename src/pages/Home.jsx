import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";

export default function Home() {
  return (
    <CinematicPage>
      <CinematicSection className="surface-soft">
        <div className="text-center">
          <p className="section-eyebrow">Nuestra boda</p>

          <h1 className="hero-title">Sara & Fran</h1>

          <p className="section-text">
            Una celebración elegante, íntima y diseñada para vivirse con calma.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection>
        <div className="text-center">
          <p className="section-eyebrow">Invitación</p>

          <h2 className="section-title">
            Una experiencia pensada para emocionar
          </h2>

          <p className="section-text">
            Iremos construyendo cada sección poco a poco, manteniendo una
            narrativa visual limpia, cálida y sofisticada.
          </p>
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}
