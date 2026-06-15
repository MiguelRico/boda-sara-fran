import MapLink from "./MapLink";

export default function TransportTime({ item }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 p-4">
      <div className="flex flex-col gap-3">
        <span className="font-serif text-3xl leading-none">
          {item.time}
        </span>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="section-title font-serif text-[1.65rem] leading-tight">
              {item.label}
            </h4>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          <p className="text-xs leading-relaxed">{item.description}</p>

          <MapLink href={item.mapUrl} />
        </div>
      </div>
    </div>
  );
}
