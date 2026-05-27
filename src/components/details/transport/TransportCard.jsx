import TransportTime from "./TransportTime";

export default function TransportCard({ route }) {
  return (
    <article className="premium-card h-full">
      <p className="text-xs uppercase tracking-[0.2em] text-[#556b52]">
        {route.subtitle}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:block sm:space-y-5">
        {route.times.map((item) => (
          <TransportTime key={`${item.time}-${item.label}`} item={item} />
        ))}
      </div>
    </article>
  );
}
