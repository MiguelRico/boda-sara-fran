export default function Spinner({ text = "Preparando todo..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbf7f1]/85 px-6 backdrop-blur-md">
      <div className="premium-card max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-[#eadccb] bg-[#f7efe6] shadow-[0_16px_45px_rgba(77,56,40,0.12)]">
          <div className="wedding-spinner-sprite" aria-hidden="true" />
        </div>

        <p className="section-eyebrow mb-3">Un momento</p>

        <p className="font-serif text-3xl text-[#2f2a25]">{text}</p>

        <p className="mt-4 text-sm leading-relaxed text-[#7b6b5d]">
          Estamos gestionando tu confirmación con cuidado.
        </p>
      </div>
    </div>
  );
}
