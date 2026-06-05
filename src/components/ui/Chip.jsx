export default function Chip({
  className = "",
  href,
  icon,
  onClick,
  strong = false,
  target,
  tone = "default",
  value,
  valueClassName = "truncate",
}) {
  const isSecondary = tone === "secondary";
  const isLink = Boolean(href);
  const Component = isLink ? "a" : "span";
  const toneClass = isSecondary
    ? "border-[var(--color-border-strong)] bg-[var(--color-accent)] font-medium text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-accent)]/75"
    : strong
      ? "border-[var(--color-border-strong)] bg-white/60 font-medium text-[var(--color-accent-dark)]"
      : "border-[var(--color-border)] bg-white/45 text-[var(--color-muted)]";
  const interactiveClass = isLink
    ? "cursor-pointer transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-dark)]/35"
    : "";

  return (
    <Component
      className={`flex w-full max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 ${toneClass} ${interactiveClass} ${className}`}
      href={href || undefined}
      onClick={(event) => {
        if (isLink) {
          event.stopPropagation();
        }

        onClick?.(event);
      }}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      target={target}
    >
      {icon && (
        <span
          className={`shrink-0 ${
            isSecondary ? "text-white" : "text-[var(--color-accent-dark)]"
          }`}
        >
          {icon}
        </span>
      )}
      <span className={valueClassName}>{value}</span>
    </Component>
  );
}
