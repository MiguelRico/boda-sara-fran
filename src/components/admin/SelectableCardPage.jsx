import AdminEmptyState from "./AdminEmptyState";
import CardGrid from "./CardGrid";

export default function SelectableCardPage({
  desktopClassName = "hidden gap-4 md:grid lg:grid-cols-2",
  emptyIcon,
  emptyState,
  getKey,
  items,
  mobileClassName = "grid gap-4 md:hidden",
  renderCard,
  renderMobileCard = renderCard,
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
    <>
      <CardGrid
        className={desktopClassName}
        getKey={getKey}
        items={items}
        renderCard={renderCard}
      />
      <div className={mobileClassName}>
        {items.map((item, index) => (
          <div key={getKey(item, { index })}>
            {renderMobileCard(item, index)}
          </div>
        ))}
      </div>
    </>
  );
}
