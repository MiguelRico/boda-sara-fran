const DEFAULT_COLORS = [
  "#344531",
  "#556b52",
  "#6f8b6b",
  "#879d7e",
  "#bccdb5",
  "#c7d4bf",
  "#9caf88",
  "#71816d",
  "#dfe8d7",
];

export default function VerticalBarChart({
  colors = DEFAULT_COLORS,
  items = [],
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="min-w-0 overflow-hidden pb-1">
      <div
        className="grid min-w-0 items-end gap-1"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, index) => {
          const color = colors[index % colors.length];
          const height = item.value
            ? Math.max((item.value / maxValue) * 100, 7)
            : 0;

          return (
            <div
              aria-label={`${item.label}: ${item.value} de ${total}`}
              className="flex min-w-0 flex-col items-center"
              key={item.label}
            >
              <span className="mb-1 rounded-full border border-[var(--color-border)] bg-white/65 px-1 py-0.5 text-[0.56rem] font-medium leading-none text-[var(--color-accent-dark)]">
                {item.value}
              </span>
              <div className="flex h-24 w-full items-end justify-center border-b border-[var(--color-border-strong)] px-0.5">
                <span
                  className="block w-full max-w-4 rounded-t-md rounded-b-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_12px_rgba(52,69,49,0.12)]"
                  style={{
                    backgroundColor: color,
                    height: `${height}%`,
                  }}
                />
              </div>
              <span
                className="mt-1 flex h-14 max-w-full items-center justify-start overflow-hidden text-[0.56rem] font-medium leading-none text-[var(--color-muted)]"
                style={{
                  textOrientation: "mixed",
                  transform: "rotate(180deg)",
                  writingMode: "vertical-rl",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
