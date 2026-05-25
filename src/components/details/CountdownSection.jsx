import { useEffect, useMemo, useState } from "react";
import CinematicSection from "../cinematic/CinematicSection";
import SectionHeader from "../ui/SectionHeader";

const WEDDING_DATE = "2026-08-22T18:00:00";

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
    <div className="premium-card px-4 py-8 text-center sm:px-6 sm:py-10">
      <span className="block font-serif text-5xl leading-none text-[#2f2a25] sm:text-6xl lg:text-7xl">
        {value}
      </span>

      <span className="mt-4 block text-[0.65rem] uppercase tracking-[0.28em] text-[#9b7a61]">
        {label}
      </span>
    </div>
  );
}

export default function CountdownSection() {
  const targetDate = useMemo(() => new Date(WEDDING_DATE), []);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  const items = [
    { label: "Días", value: timeLeft.days },
    { label: "Horas", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Seg", value: timeLeft.seconds },
  ];

  return (
    <CinematicSection id="countdown">
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeader
          eyebrow="Cada vez queda menos"
          title="Cuenta atrás"
          text="El tiempo avanza hacia un día que queremos vivir rodeados de las personas que más queremos."
        />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <CountdownCard key={item.label} {...item} />
          ))}
        </div>

        <p className="mt-10 text-sm leading-relaxed text-[#7b6b5d]">
          22 de agosto de 2026 · 18:00
        </p>
      </div>
    </CinematicSection>
  );
}
