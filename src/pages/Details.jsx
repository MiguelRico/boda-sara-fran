import CinematicPage from "../components/cinematic/CinematicPage";
import HistorySection from "../components/details/HistorySection";
import CountdownSection from "../components/details/CountdownSection";
import TimelineSection from "../components/details/TimelineSection";
import CeremonySection from "../components/details/CeremonySection";
import TransportSection from "../components/details/TransportSection";
import CtaSection from "../components/home/CtaSection";

export default function Details() {
  return (
    <CinematicPage>
      <HistorySection />

      <CountdownSection />

      <CeremonySection />

      <TransportSection />

      <TimelineSection />

      <CtaSection />
    </CinematicPage>
  );
}
