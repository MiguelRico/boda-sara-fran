import { Home, Search } from "lucide-react";
import IconButton from "../ui/IconButton";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
} from "./FormPrimitives";
import { rsvpContent } from "../../constants/rsvpContent";

export default function SearchInvitationCard({
  email,
  emailError,
  loading,
  onEmailChange,
  onSearchInvitation,
  hideTextOnMobile = false,
  isMobileView = false,
}) {
  const textClassName = hideTextOnMobile || isMobileView
    ? "hidden sm:block mt-3 text-sm leading-relaxed"
    : " mt-3 text-sm leading-relaxed";
  return (
    <FormCard className="mt-6">
      <div className="mb-4">
        <p className="section-eyebrow mb-3">{rsvpContent.searchInvitation.eyebrow}</p>

        <h2 className="font-serif text-3xl">{rsvpContent.searchInvitation.title}</h2>

        <p className={textClassName}>
          {rsvpContent.searchInvitation.text}
        </p>
      </div>

      <div className="mb-4">
        <Label>{rsvpContent.searchInvitation.emailLabel}</Label>

        <input
          className={inputClassName}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={rsvpContent.searchInvitation.emailPlaceholder}
          type="email"
          value={email}
        />

        <FieldError>{emailError}</FieldError>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row-reverse">
        <IconButton
          className="flex-1"
          disabled={loading}
          icon={<Search size={16} strokeWidth={1.8} />}
          onClick={onSearchInvitation}
          showText="always"
          tone="primary"
          type="button"
        >
          Buscar mi confirmación
        </IconButton>

        <IconButton
          className="flex-1"
          icon={<Home size={16} strokeWidth={1.8} />}
          showText="always"
          to="/"
          tone="terciary"
        >
          Volver al inicio
        </IconButton>
      </div>
    </FormCard>
  );
}
