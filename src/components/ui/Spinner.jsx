import { createPortal } from "react-dom";
import useViewportScrollLock from "../../hooks/useViewportScrollLock";
import { uiContent } from "../../constants/uiContent";

export default function Spinner({ text = uiContent.spinner.defaultText }) {
  useViewportScrollLock();

  const spinner = (
    <div className="spinner-overlay">
      <div
        className="premium-card spinner-card"
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        <div className="spinner-circle">
          <img
            src="/spinner/wedding-spinner.webp"
            alt=""
            className="wedding-spinner-image"
            aria-hidden="true"
          />
        </div>

        <p className="section-eyebrow">{uiContent.spinner.eyebrow}</p>

        <p className="section-text">{text}</p>
      </div>
    </div>
  );

  return createPortal(spinner, document.body);
}
