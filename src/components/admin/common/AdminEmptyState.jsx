export default function AdminEmptyState({ icon: Icon, text, title }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center">
      {Icon && (
        <Icon
          className="mx-auto text-[var(--color-accent-dark)]"
          size={28}
          strokeWidth={1.7}
        />
      )}
      <p className="mt-4 font-serif text-3xl text-[var(--color-accent-dark)]">
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {text}
      </p>
    </div>
  );
}
