import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { uiContent } from "../../constants/uiContent";
import IconButton from "./IconButton";

export default function ErrorScreen({
  actionText = uiContent.error.reloadAction,
  eyebrow = uiContent.error.eyebrow,
  message = uiContent.error.message,
  onAction,
  showHomeAction = true,
  title = uiContent.error.title,
}) {
  const handleReload = () => {
    if (onAction) {
      onAction();
      return;
    }

    window.location.reload();
  };

  return (
    <main className="cinematic-page flex min-h-dvh items-center justify-center px-4 py-8">
      <section
        aria-live="assertive"
        className="premium-card w-full max-w-md text-center"
        role="alert"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500">
          <AlertTriangle size={22} strokeWidth={1.8} />
        </div>

        <p className="section-eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-serif text-3xl text-[var(--color-accent-dark)]">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          {message}
        </p>

        <div className="mt-8 grid gap-3">
          <IconButton
            className="w-full"
            icon={<RefreshCw size={16} strokeWidth={1.8} />}
            onClick={handleReload}
            showText="always"
            tone="primary"
            type="button"
          >
            {actionText}
          </IconButton>

          {showHomeAction && (
            <IconButton
              className="w-full"
              icon={<Home size={16} strokeWidth={1.8} />}
              showText="always"
              to="/"
              tone="terciary"
            >
              {uiContent.error.homeAction}
            </IconButton>
          )}
        </div>
      </section>
    </main>
  );
}
