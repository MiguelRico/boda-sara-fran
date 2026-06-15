import { ChevronLeft, ChevronRight } from "lucide-react";

import { uiContent } from "../../constants/uiContent";
import IconButton from "./IconButton";

export default function Pagination({
  className = "mt-5",
  onNext,
  onPrev,
  page,
  previousLabel = uiContent.actions.previous,
  nextLabel = uiContent.actions.next,
  totalPages,
}) {
  const pageLabel = `${page} / ${totalPages}`;

  return (
    <div
      className={`${className} rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4`}
    >
      <div className="flex flex-col gap-3 text-sm text-[var(--color-muted)]">
        <div className="grid w-full grid-cols-3 items-center gap-3">
          <IconButton
            className="w-full"
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
            className="w-full"
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
