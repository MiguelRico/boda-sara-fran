import AdminEmptyState from "./AdminEmptyState";

export default function SelectableCardPage({
  className = "grid gap-4",
  emptyIcon,
  emptyState,
  getKey,
  items,
  renderCard,
}) {
  if (!items.length) {
    return (
      <AdminEmptyState
        icon={emptyIcon}
        text={emptyState?.text}
        title={emptyState?.title}
      />
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={getKey(item, { index })}>{renderCard(item, index)}</div>
      ))}
    </div>
  );
}
