import { motion, useReducedMotion } from "framer-motion";

/**
 * Componente genérico de navegación por tabs.
 * Reutilizable en cualquier parte de la aplicación.
 *
 * @example
 * const [activeTab, setActiveTab] = useState('tab1');
 * <TabNavigation
 *   tabs={[
 *     { id: 'tab1', label: 'Tab 1' },
 *     { id: 'tab2', label: 'Tab 2' },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 *   className="mb-6" // opcional
 * />
 */
export default function TabNavigation({
  tabs = [],
  activeTab,
  onChange,
  className = "",
}) {
  const reduceMotion = useReducedMotion();

  if (!tabs.length) return null;

  return (
    <div
      className={`flex w-full gap-1 border-b border-[var(--color-border)] mb-0 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative min-h-12 flex-1 overflow-hidden px-4 py-3 text-sm font-medium transition-colors duration-300 ${
            activeTab === tab.id
              ? "text-[var(--color-accent-dark)]"
              : "text-[var(--color-muted)] hover:text-[var(--color-accent-dark)]"
          }`}
        >
          {activeTab === tab.id && (
            <motion.span
              className="absolute inset-x-2 bottom-0 top-1 rounded-t-2xl border-x border-t border-[var(--color-border)] bg-white/45"
              layoutId="tab-navigation-active"
              transition={{
                duration: reduceMotion ? 0 : 0.38,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          )}
          {activeTab === tab.id && (
            <motion.span
              className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[var(--color-accent-dark)]"
              layoutId="tab-navigation-underline"
              transition={{
                duration: reduceMotion ? 0 : 0.38,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
