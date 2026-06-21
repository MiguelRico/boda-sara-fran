import { useEffect, useMemo, useState } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import HeaderSection from "../ui/HeaderSection";
import { siteContent } from "../../config/siteContent";
import useIsMobileView from "../../hooks/useIsMobileView";

function getTimeLeft(targetDate) {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function CountdownCard({ label, value }) {
  return (
    <div className="premium-card px-4 py-8 text-center">
      <span className="section-text block font-serif text-5xl">{value}</span>

      <span className="section-eyebrow mt-4 block">{label}</span>
    </div>
  );
}

export default function CountdownSection() {
  const { countdown } = siteContent.details;
  const isMobileView = useIsMobileView();
  const targetDate = useMemo(() => new Date(siteContent.weddingDate.iso), []);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));
  const contentClassName = isMobileView
    ? "mx-auto max-w-4xl text-center"
    : "mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl flex-col justify-center text-center";
  const gridClassName = isMobileView
    ? "mt-4 grid grid-cols-2 gap-4"
    : "grid grid-cols-4 gap-5";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  const items = [
    { label: countdown.labels.days, value: timeLeft.days },
    { label: countdown.labels.hours, value: timeLeft.hours },
    { label: countdown.labels.minutes, value: timeLeft.minutes },
    { label: countdown.labels.seconds, value: timeLeft.seconds },
  ];

  return (
    <CinematicSection id="countdown">
      <div className={contentClassName}>
        <HeaderSection
          eyebrow={countdown.eyebrow}
          title={countdown.title}
          text={countdown.text}
          showTitleAndTextOnMobile
        />

        <div className={gridClassName}>
          {items.map((item) => (
            <CountdownCard key={item.label} {...item} />
          ))}
        </div>

        <p className="section-eyebrow mt-6">
          {siteContent.weddingDate.display}
        </p>
      </div>
    </CinematicSection>
  );
}
