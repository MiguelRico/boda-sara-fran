import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

export default function CollapsiblePanel({
  activeFilters = [],
  children,
  className = "",
  compact = true,
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
      className={`border border-[var(--color-border)] bg-white/35 ${
        compact ? "rounded-[1rem] p-2" : "rounded-[1.25rem] p-3"
      } ${className}`}
    >
      <div>
        <div
          className={`flex items-center justify-between ${
            compact ? "gap-2" : "gap-4"
          }`}
        >
          {activeFilters.length > 0 ? (
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
              {activeFilters.map((filter) => (
                <button
                  aria-label={`Quitar filtro ${filter.label}`}
                  className="grid min-w-0 max-w-full grid-cols-[11px_minmax(0,1fr)_11px] items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-accent)] px-2 py-0.5 text-[0.62rem] font-medium text-white shadow-[var(--shadow-button)] transition hover:bg-[var(--color-accent)]/75"
                  key={filter.key || filter.label}
                  onClick={filter.onRemove}
                  type="button"
                >
                  <span aria-hidden="true" />
                  <span className="min-w-0 truncate text-center">
                    {filter.label}
                  </span>
                  <X className="shrink-0" size={11} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          ) : (
            <h3
              className={`font-serif text-[var(--color-accent-dark)] ${
                compact ? "text-lg leading-none" : "text-xl leading-none"
              }`}
            >
              {title}
            </h3>
          )}

          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              checked={open}
              className="peer sr-only"
              onChange={(event) => setOpen(event.target.checked)}
              type="checkbox"
            />

            <div
              className={`peer rounded-full bg-[var(--color-border-strong)] transition after:absolute after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] ${
                compact
                  ? "h-[1.125rem] w-8 after:left-[2px] after:top-[2px] after:h-3.5 after:w-3.5 peer-checked:after:translate-x-3.5"
                  : "h-5 w-9 after:left-[2px] after:top-[2px] after:h-4 after:w-4 peer-checked:after:translate-x-4"
              }`}
            />
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
            <div className={compact ? "mt-2" : "mt-3"}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
