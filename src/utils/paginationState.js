const toPositiveInteger = (value) => {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

export const DEFAULT_TABLE_PAGE_SIZE = 1;

export function getPaginationState({ items = [], page, pageSize, totalPages }) {
  const itemCount = Array.isArray(items) ? items.length : 0;
  const safePageSize =
    toPositiveInteger(pageSize) || DEFAULT_TABLE_PAGE_SIZE;
  const computedTotalPages = Math.max(Math.ceil(itemCount / safePageSize), 1);
  const safeTotalPages =
    itemCount > 0 ? computedTotalPages : toPositiveInteger(totalPages) || 1;
  const requestedPage = toPositiveInteger(page) || 1;
  const safePage = Math.min(Math.max(requestedPage, 1), safeTotalPages);

  return {
    page: safePage,
    pageSize: safePageSize,
    totalPages: safeTotalPages,
  };
}
