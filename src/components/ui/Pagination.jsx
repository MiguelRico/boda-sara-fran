import { ChevronLeft, ChevronRight } from "lucide-react";

import IconButton from "./IconButton";

export default function Pagination({
  className = "mt-5",
  isMobileView = false,
  onNext,
  onPrev,
  page,
  previousLabel = "Anterior",
  nextLabel = "Siguiente",
  totalPages,
}) {
  const pageLabel = `${page} / ${totalPages}`;
  void isMobileView;

  return (
    <div
      className={`${className} rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4`}
    >
      <div className="flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex items-center">
          <IconButton
            className="w-full sm:w-auto"
            disabled={page === 1}
            icon={<ChevronLeft size={16} strokeWidth={1.8} />}
            label={previousLabel}
            onClick={onPrev}
            tabIndex={-1}
            tone="secondary"
            type="button"
          >
            {previousLabel}
          </IconButton>

          <p className="text-center">{pageLabel}</p>

          <IconButton
            className="w-full sm:w-auto"
            disabled={page === totalPages}
            icon={<ChevronRight size={16} strokeWidth={1.8} />}
            label={nextLabel}
            onClick={onNext}
            tabIndex={-1}
            tone="secondary"
            type="button"
          >
            {nextLabel}
          </IconButton>
        </div>
      </div>
    </div>
  );
}
