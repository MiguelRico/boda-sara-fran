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
          <h3 className="font-serif text-2xl text-[var(--color-accent-dark)]">
            {title}
          </h3>

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

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                aria-label={`Quitar filtro ${filter.label}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-button)] transition hover:bg-[var(--color-accent)]/75"
                key={filter.key || filter.label}
                onClick={filter.onRemove}
                type="button"
              >
                <span className="min-w-0 truncate">{filter.label}</span>
                <X className="shrink-0" size={13} strokeWidth={2.2} />
              </button>
            ))}
          </div>
        )}
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
