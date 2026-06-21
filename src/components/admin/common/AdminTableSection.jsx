import PaginatedContent from "../../ui/PaginatedContent";
import Pagination from "../../ui/Pagination";
import TableSectionSkeleton from "../../ui/TableSectionSkeleton";
import { getPaginationState } from "../../../utils/paginationState";

export default function AdminTableSection({
  actions,
  actionsFullWidth = false,
  children,
  className = "",
  contentRef,
  count,
  eyebrow,
  filters,
  getKey,
  headerActions,
  loading = false,
  lockPageHeight = false,
  mobilePageLabel,
  onNextPage,
  onPrevPage,
  page,
  pageDirection = 1,
  paginationInlineWithTitle = false,
  paginationLabel,
  pageLabel,
  pageSize,
  renderMeasurePage,
  renderPage,
  sectionRef,
  skeletonConfig = {},
  summary,
  title,
  totalPages,
  items = [],
}) {
  const hasResults = items.length > 0;
  const hasFilterSlot = Boolean(filters);
  const pagination = getPaginationState({
    items,
    page,
    pageSize,
    totalPages,
  });
  const hasPagination =
    !loading &&
    (hasResults || hasFilterSlot) &&
    page &&
    pageSize &&
    pagination.totalPages > 1;
  const hasPaginationSlot =
    skeletonConfig.pagination ??
    Boolean(
      pageLabel || paginationLabel || mobilePageLabel || page || totalPages,
    );
  const contentSkeletonConfig = skeletonConfig.content || {};
  const hasHeaderContent = Boolean(eyebrow || title || count || actions);
  const inlinePaginationPlaceholder =
    paginationInlineWithTitle && !hasPagination ? (
      <div
        aria-hidden="true"
        className="invisible mt-0 w-full rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-2"
      >
        <div className="grid w-full grid-cols-3 items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="h-8 rounded-full" />
          <span className="text-center">1 / 1</span>
          <span className="h-8 rounded-full" />
        </div>
      </div>
    ) : null;
  const headerPagination =
    hasPagination && paginationInlineWithTitle ? (
      <Pagination
        className="mt-0 w-full"
        compact
        currentLabel={pageLabel}
        label={paginationLabel}
        mobileLabel={mobilePageLabel}
        onNext={onNextPage}
        onPrev={onPrevPage}
        page={pagination.page}
        totalPages={pagination.totalPages}
      />
    ) : (
      inlinePaginationPlaceholder
    );
  const hasInlineHeaderControls = Boolean(headerPagination || headerActions);

  return (
    <section
      className={`premium-card admin-table-section pt-4 ${className}`}
      ref={sectionRef}
    >
      {hasHeaderContent && (
        <div className="mb-4">
          {eyebrow && <p className="section-eyebrow mb-2">{eyebrow}</p>}
          {(title || hasInlineHeaderControls) && hasInlineHeaderControls && (
            <div className="grid gap-3 md:grid-cols-[minmax(10rem,0.9fr)_minmax(16rem,1fr)_minmax(14rem,1fr)] md:items-center">
              {title && (
                <h2 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)] md:min-w-0">
                  {title}
                </h2>
              )}

              {headerPagination}
              {headerActions}
            </div>
          )}
          {title && !hasInlineHeaderControls && (
            <h2 className="font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
              {title}
            </h2>
          )}

          {!loading && (count || actions) && (
            <div className="mt-4 flex flex-col gap-3">
              {actions && (
                <div
                  className={`rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4 ${
                    actionsFullWidth ? "w-full" : ""
                  }`}
                >
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <TableSectionSkeleton
          actionCount={skeletonConfig.actionCount}
          actions={skeletonConfig.actions ?? Boolean(actions)}
          cardCount={contentSkeletonConfig.count ?? skeletonConfig.cardCount}
          columnsClassName={contentSkeletonConfig.columnsClassName}
          count={skeletonConfig.count ?? Boolean(count)}
          filters={skeletonConfig.filters ?? Boolean(filters && hasFilterSlot)}
          itemClassName={contentSkeletonConfig.itemClassName}
          lines={contentSkeletonConfig.lines}
          pagination={hasPaginationSlot}
        />
      ) : (
        <>
          {summary && <div className="mb-4">{summary}</div>}

          {filters && hasFilterSlot && <div className="mb-4">{filters}</div>}

          {hasPagination && !paginationInlineWithTitle && (
            <Pagination
              className="mb-4"
              currentLabel={pageLabel}
              label={paginationLabel}
              mobileLabel={mobilePageLabel}
              onNext={onNextPage}
              onPrev={onPrevPage}
              page={pagination.page}
              totalPages={pagination.totalPages}
            />
          )}

          <div ref={contentRef}>
            {renderPage ? (
              <PaginatedContent
                allItems={items}
                direction={pageDirection}
                getKey={getKey}
                lockHeight={lockPageHeight}
                page={pagination.page}
                pageSize={pagination.pageSize}
                renderMeasurePage={renderMeasurePage}
                renderPage={renderPage}
                totalPages={pagination.totalPages}
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
