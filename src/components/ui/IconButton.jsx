import { Link } from "react-router-dom";

const toneClasses = {
  danger: "border-red-200 bg-red-50 text-red-500 hover:bg-red-100",
  primary:
    "border-[var(--color-accent)] bg-[var(--color-accent-dark)] text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-accent-dark)]/75",
  secondary:
    "border-[var(--color-border-strong)] bg-[var(--color-accent)] text-white  hover:bg-[var(--color-accent)]/75",
  terciary:
    "border-[var(--color-border-strong)] bg-white/45 text-[var(--color-muted)] hover:bg-white/75",
};

export default function IconButton({
  children,
  className = "",
  disabled = false,
  href,
  icon,
  keepTextOnAdminSubpages = false,
  label,
  onClick,
  showText = true,
  target,
  to,
  tone = "secondary",
  type = "button",
  ...props
}) {
  const isAdminSubpage =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin/");
  const effectiveShowText =
    isAdminSubpage && !keepTextOnAdminSubpages ? false : showText;
  const accessibleLabel =
    label || (typeof children === "string" ? children : "");
  const hasText = Boolean(
    effectiveShowText &&
      (typeof children === "string" || typeof children === "number"),
  );
  const textClass = effectiveShowText === "always" ? "inline" : "hidden";
  const content = (
    <>
      {(icon || !hasText) && (
        <span className="inline-flex shrink-0 items-center justify-center">
          {icon || children}
        </span>
      )}
      {hasText && (
        <span
          className={`${textClass} min-w-0 truncate text-[0.68rem] uppercase tracking-[0.22em]`}
        >
          {children}
        </span>
      )}
    </>
  );
  const toneClass = toneClasses[tone] ?? toneClasses.secondary;
  const sizeClass = hasText
    ? effectiveShowText === "always"
      ? "min-h-11 gap-2 px-5 py-3"
      : "h-10 w-10"
    : "h-10 w-10";
  const baseClass = `inline-flex shrink-0 items-center justify-center rounded-full border font-sans transition-all duration-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:shadow-none disabled:hover:translate-y-0 ${toneClass} ${sizeClass} ${className}`;

  if (to) {
    return (
      <Link
        aria-label={accessibleLabel}
        className={baseClass}
        title={accessibleLabel}
        to={to}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        aria-label={accessibleLabel}
        className={baseClass}
        href={href}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        target={target}
        title={accessibleLabel}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      aria-label={accessibleLabel}
      className={baseClass}
      disabled={disabled}
      onClick={onClick}
      title={accessibleLabel}
      type={type}
      {...props}
    >
      {content}
    </button>
  );
}
