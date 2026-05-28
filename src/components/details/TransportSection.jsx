import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../common/HeaderSection";
import TransportCard from "./transport/TransportCard";

const transportRoutes = [
  {
    title: "Ida",
    subtitle: "Salida hacia Aguas del Pino",
    times: [
      {
        time: "18:00",
        label: "Huelva",
        description: "Hotel NH Luz",
        mapUrl: "https://maps.app.goo.gl/fRcvoUKdD2bMizG6A",
      },
      {
        time: "18:20",
        label: "Corrales",
        description: "Comercial Colón",
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
        label: "Primera",
        description: "Corrales - Huelva",
      },
      {
        time: "06:00",
        label: "Última",
        description: "Corrales - Huelva",
      },
    ],
  },
];

export default function TransportSection() {
  return (
    <CinematicSection id="transport">
      <div className="mx-auto max-w-5xl">
        <HeaderSection
          eyebrow="Llegar y volver con tranquilidad"
          title="Transporte"
          text="Los puntos de salida y regreso serán los mismos para ambos trayectos."
        />

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {transportRoutes.map((route) => (
            <TransportCard key={route.title} route={route} />
          ))}
        </div>
      </div>
    </CinematicSection>
  );
}
