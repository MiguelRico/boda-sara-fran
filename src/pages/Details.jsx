import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import FinalCTA from "../components/common/FinalCTA";
import HistorySection from "../components/details/HistorySection";
import CountdownSection from "../components/details/CountdownSection";

export default function Details() {
  return (
    <CinematicPage>
      <HistorySection />

      <CountdownSection />

      <CinematicSection id="timeline" className="surface-soft">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="section-eyebrow">Timeline</p>

            <h2 className="section-title">El ritmo del día</h2>

            <p className="section-text">
              Una primera estructura para ordenar los momentos principales de la
              celebración.
            </p>
          </div>

          <div className="mt-14 space-y-5">
            {[
              ["18:00", "Ceremonia"],
              ["20:00", "Cóctel"],
              ["22:00", "Cena"],
              ["00:00", "Fiesta"],
            ].map(([time, title]) => (
              <div key={time} className="premium-card flex items-center gap-6">
                <span className="font-serif text-3xl text-[#8f6f56]">
                  {time}
                </span>

                <div>
                  <h3 className="font-serif text-2xl text-[#2f2a25]">
                    {title}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-[#7b6b5d]">
                    Contenido pendiente de definir.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CinematicSection>

      <CinematicSection id="ceremonia">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Ceremonia</p>

          <h2 className="section-title">Un momento para recordar</h2>

          <p className="section-text">
            Aquí añadiremos lugar, hora, mapa y detalles prácticos de la
            ceremonia.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection id="transporte" className="surface-soft">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Transporte</p>

          <h2 className="section-title">Llegar y volver con tranquilidad</h2>

          <p className="section-text">
            Aquí incluiremos los horarios de autobuses de ida y vuelta.
          </p>
        </div>
      </CinematicSection>

      <CinematicSection id="celebracion">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Celebración</p>

          <h2 className="section-title">Cena, brindis y fiesta</h2>

          <p className="section-text">
            Aquí definiremos los detalles de la cena, la fiesta y cualquier
            información importante para los invitados.
          </p>
        </div>
      </CinematicSection>

      <FinalCTA />
    </CinematicPage>
  );
}
