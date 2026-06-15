export default function Card({
  actions,
  actionsPlacement = "inline",
  children,
  decorativeText,
  detail,
  eyebrow,
  title,
  titleRef,
  titleStyle,
}) {
  const hasActions = Boolean(actions);
  const hasInlineActions = hasActions && actionsPlacement !== "overlay";
  const hasChildren = Boolean(children);

  return (
    <article
      className="
        group relative block h-full overflow-hidden rounded-[2rem]
        border border-[var(--color-border-strong)] bg-white/55 p-5
        shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-sm
        transition-all duration-700
      "
    >
      {decorativeText && (
        <div className="pointer-events-none absolute right-6 top-6 text-5xl opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
          {decorativeText}
        </div>
      )}

      {hasActions && actionsPlacement === "overlay" && (
        <div className="absolute right-5 top-4 z-20">{actions}</div>
      )}

      <div className="relative flex h-full flex-col">
        <div>
          <p
            className={`section-eyebrow mb-4 ${hasActions ? "mt-4" : ""} ${
              actionsPlacement === "overlay" ? "pr-24" : ""
            }`}
          >
            {eyebrow}
          </p>
          <div
            className={`flex gap-3 ${hasInlineActions ? "items-start justify-between" : "flex-col"}`}
          >
            <div className="min-w-0 flex-1">
              <h3
                className="break-words font-serif text-2xl leading-none text-[var(--color-text)]"
                ref={titleRef}
                style={titleStyle}
              >
                {title}
              </h3>
              {detail && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
                  {detail}
                </p>
              )}
            </div>

            {hasInlineActions && actions}
          </div>
        </div>

        {hasChildren && <div>{children}</div>}
      </div>
    </article>
  );
}
