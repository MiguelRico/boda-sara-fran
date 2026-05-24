import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import FinalCTA from "../components/common/FinalCTA";
import HistorySection from "../components/details/HistorySection";
import CountdownSection from "../components/details/CountdownSection";
import TimelineSection from "../components/details/TimelineSection";
import CeremonySection from "../components/details/CeremonySection";
import TransportSection from "../components/details/TransportSection";

export default function Details() {
  return (
    <CinematicPage>
      <HistorySection />

      <CountdownSection />

      <CeremonySection />

      <TransportSection />

      <TimelineSection />

      <FinalCTA />
    </CinematicPage>
  );
}
