import CinematicSection from "../cinematic/CinematicSection";

const transportRoutes = [
  {
    title: "Ida",
    subtitle: "Salida hacia Aguas del Pino",
    times: [
      {
        time: "18:00",
        label: "Huelva",
        description: "Salida desde el punto acordado.",
        mapUrl: "https://maps.app.goo.gl/fRcvoUKdD2bMizG6A",
      },
      {
        time: "18:20",
        label: "Corrales",
        description: "Parada para recoger invitados.",
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
      <p className="text-xs uppercase tracking-[0.28em] text-[#9b7a61]">
        {route.subtitle}
      </p>

      <div className="mt-8 space-y-5">
        {route.times.map((item) => (
          <div
            key={`${item.time}-${item.label}`}
            className="
              rounded-[1.5rem]
              border border-[#eadccb]
              bg-[#fbf7f1]/70
              p-5
            "
          >
            <div>
              <div className="flex items-start gap-4">
                <span className="min-w-[4.5rem] font-serif text-3xl leading-none text-[#8f6f56]">
                  {item.time}
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-serif text-2xl leading-tight text-[#2f2a25]">
                      {item.label}
                    </h4>

                    {item.mapUrl && (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                        ml-auto inline-flex items-center gap-2
                        rounded-full border border-[#eadccb]
                        bg-white/70 px-3 py-1.5
                        text-[0.65rem] uppercase tracking-[0.22em]
                        text-[#8f6f56]
                        transition-all duration-300
                        hover:border-[#d8c1ad]
                        hover:bg-white
                    "
                      >
                        Mapa
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#7b6b5d]">
                {item.description}
              </p>
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
            Hemos organizado autobuses para que puedas disfrutar de la
            celebración sin preocuparte por el desplazamiento.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {transportRoutes.map((route) => (
            <TransportCard key={route.title} route={route} />
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-[#7b6b5d]">
          Los puntos de salida y regreso serán los mismos para ambos trayectos.
        </p>
      </div>
    </CinematicSection>
  );
}
