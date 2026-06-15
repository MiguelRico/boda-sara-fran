import { FormCard } from "./FormPrimitives";
import { Plus } from "lucide-react";
import IconButton from "../ui/IconButton";
import { rsvpContent } from "../../constants/rsvpContent";

export default function CreateInvitationCard({
  onCreateNew,
  hideTextOnMobile = false,
  isMobileView = false,
}) {
  const textClassName =
    hideTextOnMobile || isMobileView
      ? "hidden"
      : "mt-3 text-sm leading-relaxed";
  return (
    <FormCard>
      <div className="mb-4">
        <p className="section-eyebrow mb-3">
          {rsvpContent.createInvitation.eyebrow}
        </p>

        <h2 className="font-serif text-3xl">
          {rsvpContent.createInvitation.title}
        </h2>

        <p className={textClassName}>{rsvpContent.createInvitation.text}</p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <IconButton
          className="flex-1"
          icon={<Plus size={16} strokeWidth={1.8} />}
          showText="always"
          tone="primary"
          type="button"
          onClick={onCreateNew}
        >
          {rsvpContent.createInvitation.action}
        </IconButton>
      </div>
    </FormCard>
  );
}
