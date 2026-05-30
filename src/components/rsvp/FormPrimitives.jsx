export const inputClassName =
  "w-full rounded-2xl border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-accent-dark)] outline-none transition-all duration-300 placeholder:text-[var(--color-accent)] focus:border-[var(--color-border)] focus:bg-[var(--color-bg)]/70 disabled:border-[var(--color-border-strong)] disabled:bg-[var(--color-accent-dark)] disabled:text-white";

export function FormCard({ children, className = "" }) {
  return <div className={`premium-card ${className}`}>{children}</div>;
}

export function FieldError({ children }) {
  if (!children) return null;

  return <p className="mt-2 text-sm text-red-500">{children}</p>;
}

export function Label({ children }) {
  return (
    <label className="mb-2 block text-sm text-[var(--color-accent-dark)]">
      {children}
    </label>
  );
}
