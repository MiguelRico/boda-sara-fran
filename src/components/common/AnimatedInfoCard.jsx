import RevealOnView from "../ui/RevealOnView";
import InfoCard from "./InfoCard";

export default function AnimatedInfoCard({ card, index }) {
  return (
    <RevealOnView
      as="article"
      amount={0.7}
      margin="0px 0px -12% 0px"
      delay={index * 0.06}
      className="h-full"
    >
      <InfoCard {...card} />
    </RevealOnView>
  );
}
