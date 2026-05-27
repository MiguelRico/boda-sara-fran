export const inputClassName =
  "w-full rounded-2xl border border-[#6f8b6b] bg-[#f5f8f2]/70 px-4 py-3 text-[#2f2a25] outline-none transition-all duration-300 placeholder:text-[#a89889] focus:border-[#556b52] focus:bg-white";

export function FormCard({ children, className = "" }) {
  return <div className={`premium-card ${className}`}>{children}</div>;
}

export function FieldError({ children }) {
  if (!children) return null;

  return <p className="mt-2 text-sm text-red-500">{children}</p>;
}

export function Label({ children }) {
  return (
    <label className="mb-2 block text-sm text-[#2f2a25]">{children}</label>
  );
}
