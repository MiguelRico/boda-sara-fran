export default function Spinner({ text = "Preparando todo..." }) {
  return (
    <div className="spinner-overlay">
      <div className="premium-card spinner-card">
        <div className="spinner-circle">
          <img
            src="/spinner/wedding-spinner.webp"
            alt=""
            className="wedding-spinner-image"
            aria-hidden="true"
          />
        </div>

        <p className="section-eyebrow mb-3">Un momento</p>

        <p className="spinner-title">{text}</p>

        <p className="spinner-description">
          Estamos gestionando tu confirmación con cuidado.
        </p>
      </div>
    </div>
  );
}
