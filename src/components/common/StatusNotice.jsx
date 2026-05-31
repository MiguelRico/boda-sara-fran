import { AlertTriangle } from "lucide-react";

export default function StatusNotice({ children, className = "", tone = "info" }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50/70 text-red-700"
      : "border-[var(--color-border)] bg-white/55 text-[var(--color-accent-dark)]";

  return (
    <div
      className={`premium-card mb-5 flex items-start gap-4 text-sm leading-relaxed ${toneClass} ${className}`}
    >
      {tone === "error" && (
        <AlertTriangle className="mt-1 shrink-0" size={20} strokeWidth={1.8} />
      )}
      <p>{children}</p>
    </div>
  );
}
