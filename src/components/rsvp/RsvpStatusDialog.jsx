export default function RsvpStatusDialog({ popup, onClose }) {
  if (!popup.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/30 px-5 backdrop-blur-sm">
      <div className="premium-card max-w-md text-center">
        <p className="section-eyebrow mb-3">
          {popup.type === "success" ? "Confirmado" : "Aviso"}
        </p>

        <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
          {popup.title}
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          {popup.message}
        </p>

        <button type="button" onClick={onClose} className="btn-primary mt-8">
          Entendido
        </button>
      </div>
    </div>
  );
}
