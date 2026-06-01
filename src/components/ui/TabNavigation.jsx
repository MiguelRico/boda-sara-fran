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
  if (!tabs.length) return null;

  return (
    <div
      className={`flex gap-2 border-b border-[var(--color-border)] ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "border-b-2 border-[var(--color-accent-dark)] text-[var(--color-accent-dark)]"
              : "border-b-2 border-transparent text-[var(--color-muted)] hover:text-[var(--color-accent-dark)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
