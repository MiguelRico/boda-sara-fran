import TransportTime from "./TransportTime";

export default function TransportCard({ route }) {
  return (
    <article className="premium-card h-full">
      <p className="text-eyebrow">{route.subtitle}</p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {route.times.map((item) => (
          <TransportTime key={`${item.time}-${item.label}`} item={item} />
        ))}
      </div>
    </article>
  );
}
