export default function Card({
  actions,
  children,
  decorativeText,
  detail,
  eyebrow,
  title,
  titleRef,
  titleStyle,
}) {
  const hasActions = Boolean(actions);
  const hasChildren = Boolean(children);

  return (
    <article
      className="
        group relative block h-full overflow-hidden rounded-[2rem]
        border border-[var(--color-border-strong)] bg-white/55 p-5
        shadow-[0_24px_70px_rgba(77,56,40,0.08)] backdrop-blur-sm
        transition-all duration-700 hover:-translate-y-1
        hover:border-[var(--color-border)] hover:bg-white/80 sm:p-6
      "
    >
      {decorativeText && (
        <div className="pointer-events-none absolute right-6 top-6 text-5xl opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:opacity-[0.12]">
          {decorativeText}
        </div>
      )}

      <div className="relative flex h-full flex-col">
        <div>
          <p className="section-eyebrow mb-2">{eyebrow}</p>
          <div
            className={`flex flex-col gap-3 ${
              hasChildren ? "mb-4" : ""
            } ${hasActions ? "sm:flex-row sm:items-center sm:justify-between" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <h3
                className="break-words font-serif text-3xl leading-none text-[var(--color-text)] sm:text-4xl"
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

            {hasActions && actions}
          </div>
        </div>

        {hasChildren && children}
      </div>
    </article>
  );
}
