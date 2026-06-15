export default function MapLink({ href }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        inline-flex items-center gap-2
        rounded-full border border-[var(--color-border-strong)]
        bg-white/70 px-3 py-1.5
        text-[0.65rem] uppercase tracking-[0.22em]
        text-[var(--color-accent-dark)]
        transition-all duration-300
        hover:border-[var(--color-border)]
        hover:bg-white
      "
    >
      Mapa
    </a>
  );
}
