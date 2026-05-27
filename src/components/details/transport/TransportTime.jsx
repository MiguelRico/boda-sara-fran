import MapLink from "./MapLink";

export default function TransportTime({ item }) {
  return (
    <div className="rounded-[1.5rem] border border-[#eadccb] bg-[#edf3e8]/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span className="font-serif text-3xl leading-none text-[#8f6f56] sm:min-w-[4.5rem]">
          {item.time}
        </span>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-serif text-[1.65rem] leading-tight text-[#2f2a25] sm:text-2xl">
              {item.label}
            </h4>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-start gap-3 sm:mt-0 sm:flex-row sm:items-start sm:gap-4">
        <p className="text-xs leading-relaxed text-[#7b6b5d] sm:mt-2">
          {item.description}
        </p>

        <MapLink href={item.mapUrl} />
      </div>
    </div>
  );
}
