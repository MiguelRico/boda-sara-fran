import { ChevronLeft, ChevronRight } from "lucide-react";

import IconButton from "./IconButton";

export default function Pagination({
  className = "mt-5",
  currentLabel = "Pagina",
  isMobileList = false,
  label,
  mobileLabel,
  onNext,
  onPrev,
  page,
  previousLabel = "Anterior",
  nextLabel = "Siguiente",
  totalPages,
}) {
  const pageLabel =
    label ||
    `${isMobileList && mobileLabel ? mobileLabel : currentLabel} ${page} de ${totalPages}`;

  return (
    <div
      className={`${className} rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4`}
    >
      <div className="flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center">{pageLabel}</p>

        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex">
          <IconButton
            className="w-full sm:w-auto"
            disabled={page === 1}
            icon={<ChevronLeft size={16} strokeWidth={1.8} />}
            label={previousLabel}
            onClick={onPrev}
            tone="secondary"
            type="button"
          >
            {previousLabel}
          </IconButton>
          <IconButton
            className="w-full sm:w-auto"
            disabled={page === totalPages}
            icon={<ChevronRight size={16} strokeWidth={1.8} />}
            label={nextLabel}
            onClick={onNext}
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
