export default function SelectableCardFrame({
  children,
  className = "",
  onClick,
  selected = false,
}) {
  return (
    <div
      className={`rounded-[2rem] transition ${
        selected ? "ring-2 ring-[var(--color-accent-dark)]" : "ring-0"
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
