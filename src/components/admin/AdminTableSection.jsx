import PaginatedContent from "../ui/PaginatedContent";
import Pagination from "../ui/Pagination";
import TableSectionSkeleton from "../ui/TableSectionSkeleton";

export default function AdminTableSection({
  actions,
  children,
  className = "",
  contentRef,
  count,
  eyebrow,
  filters,
  getKey,
  isMobileView = false,
  loading = false,
  lockPageHeight = false,
  mobilePageLabel,
  onNextPage,
  onPrevPage,
  page,
  pageDirection = 1,
  paginationLabel,
  pageLabel,
  pageSize,
  renderMeasurePage,
  renderPage,
  sectionRef,
  skeletonConfig = {},
  sourceItemsCount,
  title,
  totalPages,
  items = [],
}) {
  const hasResults = items.length > 0;
  const hasSourceItems = (sourceItemsCount ?? items.length) > 0;
  const hasPagination = !loading && hasResults && page && pageSize && totalPages;
  const hasPaginationSlot =
    skeletonConfig.pagination ??
    Boolean(
      pageLabel || paginationLabel || mobilePageLabel || page || totalPages,
    );
  const contentSkeletonConfig = skeletonConfig.content || {};

  return (
    <section className={`premium-card ${className}`} ref={sectionRef}>
      <div className="mb-4">
        <p className="section-eyebrow mb-2">{eyebrow}</p>
        <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
          {title}
        </h2>

        {!loading && (count || actions) && (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {count && (
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                {count}
              </p>
            )}

            {actions && (
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <TableSectionSkeleton
          actions={skeletonConfig.actions ?? Boolean(actions)}
          cardCount={contentSkeletonConfig.count ?? skeletonConfig.cardCount}
          columnsClassName={contentSkeletonConfig.columnsClassName}
          count={skeletonConfig.count ?? Boolean(count)}
          filters={skeletonConfig.filters ?? Boolean(filters)}
          itemClassName={contentSkeletonConfig.itemClassName}
          lines={contentSkeletonConfig.lines}
          pagination={hasPaginationSlot}
        />
      ) : (
        <>
          {filters && hasSourceItems && <div className="mb-4">{filters}</div>}

          {hasPagination && (
            <Pagination
              className="mb-4"
              currentLabel={pageLabel}
              isMobileView={isMobileView}
              label={paginationLabel}
              mobileLabel={mobilePageLabel}
              onNext={onNextPage}
              onPrev={onPrevPage}
              page={page}
              totalPages={totalPages}
            />
          )}

          <div ref={contentRef}>
            {renderPage ? (
              <PaginatedContent
                allItems={items}
                direction={pageDirection}
                getKey={getKey}
                lockHeight={lockPageHeight}
                page={page}
                pageSize={pageSize}
                renderMeasurePage={renderMeasurePage}
                renderPage={renderPage}
                totalPages={totalPages}
              />
            ) : (
              children
            )}
          </div>
        </>
      )}
    </section>
  );
}
