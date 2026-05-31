export default function IconButton({
  children,
  className = "",
  label,
  onClick,
  tone = "default",
  type = "button",
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
      : "border-[var(--color-border-strong)] bg-white/55 text-[var(--color-accent-dark)] hover:bg-white";

  return (
    <button
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${toneClass} ${className}`}
      onClick={onClick}
      title={label}
      type={type}
    >
      {children}
    </button>
  );
}
