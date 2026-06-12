export const inputClassName =
  "w-full rounded-2xl border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-accent-dark)] outline-none transition-all duration-300 placeholder:text-[var(--color-accent)] focus:border-[var(--color-border)] focus:bg-[var(--color-bg)]/70 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:placeholder:text-gray-400";
export const selectClassName = `${inputClassName} appearance-none rounded-xl bg-white bg-[linear-gradient(45deg,transparent_50%,var(--color-accent-dark)_50%),linear-gradient(135deg,var(--color-accent-dark)_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-1rem)_calc(50%-2px),calc(100%-0.72rem)_calc(50%-2px)] bg-no-repeat py-2.5 pr-9 text-sm`;

export function FormCard({ children, className = "" }) {
  return <div className={`premium-card ${className}`}>{children}</div>;
}

export function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="form-field-error mt-2 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50/80 px-3 py-2 text-left text-xs leading-relaxed text-red-700 shadow-[0_10px_24px_rgba(127,29,29,0.05)]">
      <span
        aria-hidden="true"
        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"
      />
      <span>{children}</span>
    </p>
  );
}

export function Label({ children }) {
  return (
    <label className="mb-2 block text-sm text-[var(--color-accent-dark)]">
      {children}
    </label>
  );
}
