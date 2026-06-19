import MapLink from "./MapLink";
import useIsMobileView from "../../../hooks/useIsMobileView";

export default function TransportTime({ item }) {
  const isMobileView = useIsMobileView();

  if (!isMobileView) {
    return (
      <div className="h-full rounded-[1.5rem] border border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 p-4">
        <div className="grid h-full grid-rows-[auto_1fr] gap-3">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <span className="font-serif text-3xl leading-none">
              {item.time}
            </span>

            {item.mapUrl ? (
              <MapLink
                className="!h-9 !min-h-9 w-full !px-3 !py-2 !shadow-none"
                href={item.mapUrl}
              />
            ) : (
              <span aria-hidden="true" className="h-9 w-full" />
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr] items-baseline gap-3">
            <h4 className="section-title font-serif text-[1.65rem] leading-tight">
              {item.label}
            </h4>

            <p className="text-xs leading-relaxed">{item.description}</p>
          </div>
        </div>
      </div>
    );
  }

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
