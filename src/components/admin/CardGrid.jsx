import { getRenderKey } from "../../utils/renderKeys";

export default function CardGrid({
  className = "hidden gap-4 md:grid lg:grid-cols-2",
  emptyState,
  getKey = getRenderKey,
  items = [],
  renderCard,
}) {
  if (!items.length) return emptyState || null;

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={getKey(item, { index })}>{renderCard(item, index)}</div>
      ))}
    </div>
  );
}
