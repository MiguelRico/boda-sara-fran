import CinematicSection from "../cinematic/CinematicSection";

const transportRoutes = [
  {
    title: "Ida",
    subtitle: "Salida hacia Aguas del Pino",
    times: [
      {
        time: "18:00",
        label: "Huelva",
        description: "Hotel NH Luz.",
        mapUrl: "https://maps.app.goo.gl/fRcvoUKdD2bMizG6A",
      },
      {
        time: "18:20",
        label: "Corrales",
        description: "Comercial Colón.",
        mapUrl: "https://maps.app.goo.gl/Mz4nGyrVyjGyE5N49",
      },
    ],
  },
  {
    title: "Vuelta",
    subtitle: "Regreso tras la celebración",
    times: [
      {
        time: "03:00",
        label: "Primera vuelta",
        description: "Para quienes prefieran volver antes.",
      },
      {
        time: "06:00",
        label: "Última vuelta",
        description: "Regreso al finalizar la fiesta.",
      },
    ],
  },
];

function TransportCard({ route }) {
  return (
    <article className="premium-card h-full">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9b7a61]">
        {route.subtitle}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:block sm:space-y-5">
        {route.times.map((item) => (
          <div
            key={`${item.time}-${item.label}`}
            className="
              rounded-[1.5rem]
              border border-[#eadccb]
              bg-[#fbf7f1]/70
              p-4 sm:p-5
            "
          >
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <span className="font-serif text-3xl leading-none text-[#8f6f56] sm:min-w-[4.5rem]">
                  {item.time}
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-serif text-[1.65rem] leading-tight text-[#2f2a25] sm:text-2xl">
                      {item.label}
                    </h4>{" "}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col items-start gap-3 sm:mt-0 sm:flex-row sm:items-start sm:gap-4">
                <p className="text-sm leading-relaxed text-[#7b6b5d] sm:mt-2">
                  {item.description}
                </p>

                {item.mapUrl && (
                  <a
                    href={item.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                    inline-flex items-center gap-2
                    rounded-full border border-[#eadccb]
                    bg-white/70 px-3 py-1.5
                    text-[0.65rem] uppercase tracking-[0.22em]
                    text-[#8f6f56]
                    transition-all duration-300
                    hover:border-[#d8c1ad]
                    hover:bg-white
                    sm:ml-auto
                    "
                  >
                    Mapa
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function TransportSection() {
  return (
    <CinematicSection id="transport">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Transporte</p>

          <h2 className="section-title">Llegar y volver con tranquilidad</h2>

          <p className="section-text">
            Los puntos de salida y regreso serán los mismos para ambos
            trayectos.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {transportRoutes.map((route) => (
            <TransportCard key={route.title} route={route} />
          ))}
        </div>
      </div>
    </CinematicSection>
  );
}
