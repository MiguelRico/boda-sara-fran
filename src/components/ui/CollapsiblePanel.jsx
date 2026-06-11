import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

export default function CollapsiblePanel({
  activeFilters = [],
  children,
  className = "",
  defaultOpen = false,
  title,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const panelHidden = reduceMotion
    ? { opacity: 0, height: 0 }
    : { opacity: 0, height: 0, y: -8, filter: "blur(6px)" };
  const panelVisible = reduceMotion
    ? { opacity: 1, height: "auto" }
    : { opacity: 1, height: "auto", y: 0, filter: "blur(0px)" };

  return (
    <div
      className={`rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 p-5 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-4">
          {activeFilters.length > 0 ? (
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
              {activeFilters.map((filter) => (
                <button
                  aria-label={`Quitar filtro ${filter.label}`}
                  className="inline-flex min-w-0 max-w-full items-center justify-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-accent)] px-2 py-1 text-[0.65rem] font-medium text-white shadow-[var(--shadow-button)] transition hover:bg-[var(--color-accent)]/75"
                  key={filter.key || filter.label}
                  onClick={filter.onRemove}
                  type="button"
                >
                  <span className="min-w-0 truncate">{filter.label}</span>
                  <X className="shrink-0" size={11} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          ) : (
            <h3 className="font-serif text-2xl text-[var(--color-accent-dark)]">
              {title}
            </h3>
          )}

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              checked={open}
              className="peer sr-only"
              onChange={(event) => setOpen(event.target.checked)}
              type="checkbox"
            />

            <div className="peer h-6 w-11 rounded-full bg-[var(--color-border-strong)] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] peer-checked:after:translate-x-full" />
          </label>
        </div>

      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={panelVisible}
            className="overflow-hidden"
            exit={panelHidden}
            initial={panelHidden}
            key="collapsible-panel-content"
            transition={{
              duration: reduceMotion ? 0.18 : 0.46,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="mt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
