import PaginatedContent from "../ui/PaginatedContent";
import Pagination from "../ui/Pagination";

export default function AdminTableSection({
  actions,
  children,
  className = "",
  contentRef,
  count,
  eyebrow,
  filters,
  getKey,
  isMobileList = false,
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
  skeleton,
  title,
  totalPages,
  items = [],
}) {
  const hasPagination = !loading && page && pageSize && totalPages;

  return (
    <section className={`premium-card ${className}`} ref={sectionRef}>
      <div className="mb-5">
        <p className="section-eyebrow mb-2">{eyebrow}</p>
        <h2 className="font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
          {title}
        </h2>

        {(count || actions) && (
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

      {filters && <div className="mb-5">{filters}</div>}

      {hasPagination && (
        <Pagination
          className="mb-5"
          currentLabel={pageLabel}
          isMobileList={isMobileList}
          label={paginationLabel}
          mobileLabel={mobilePageLabel}
          onNext={onNextPage}
          onPrev={onPrevPage}
          page={page}
          totalPages={totalPages}
        />
      )}

      <div ref={contentRef}>
        {loading ? (
          skeleton
        ) : renderPage ? (
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
    </section>
  );
}
