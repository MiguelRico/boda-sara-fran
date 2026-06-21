import { Home, Search } from "lucide-react";

import IconButton from "../ui/IconButton";
import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";
import { rsvpContent } from "../../constants/rsvpContent";
import useIsMobileView from "../../hooks/useIsMobileView";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

export default function SearchInvitationCard({
  email,
  emailError,
  loading,
  onEmailChange,
  onPhoneChange,
  phone = "",
  phoneError,
  onSearchInvitation,
  hideTextOnMobile = false,
  hideTextOnDesktop = false,
}) {
  const isMobileView = useIsMobileView();
  const textClassName =
    (hideTextOnMobile && isMobileView) || (hideTextOnDesktop && !isMobileView)
      ? "sr-only"
      : "mt-3 text-sm leading-relaxed";
  const eyebrowText =
    hideTextOnDesktop && !isMobileView
      ? rsvpContent.searchInvitation.text
      : rsvpContent.searchInvitation.eyebrow;
  const fieldsGridClassName = isMobileView
    ? "mb-4 grid gap-4"
    : "mb-4 grid grid-cols-2 gap-4";

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchInvitation();
  };

  return (
    <FormCard>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="section-eyebrow mb-3">
            {eyebrowText}
          </p>

          <h2 className="font-serif text-3xl">
            {rsvpContent.searchInvitation.title}
          </h2>

          <p className={textClassName}>{rsvpContent.searchInvitation.text}</p>
        </div>

        <div className={fieldsGridClassName}>
          <div>
            <Label>{rsvpContent.searchInvitation.emailLabel}</Label>

            <input
              className={inputClassName}
              inputMode="email"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={rsvpContent.searchInvitation.emailPlaceholder}
              type="email"
              value={email}
            />

            <FieldError>{emailError}</FieldError>
          </div>

          <div>
            <Label>{rsvpContent.searchInvitation.phoneLabel}</Label>

            <input
              className={inputClassName}
              inputMode="numeric"
              onChange={(event) =>
                onPhoneChange(onlyDigits(event.target.value))
              }
              pattern="[0-9]*"
              placeholder={rsvpContent.searchInvitation.phonePlaceholder}
              type="tel"
              value={phone}
            />

            <FieldError>{phoneError}</FieldError>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <IconButton
            className="flex-1"
            disabled={loading}
            icon={<Search size={16} strokeWidth={1.8} />}
            showText="always"
            tone="primary"
            type="submit"
          >
            {rsvpContent.searchInvitation.searchAction}
          </IconButton>

          {isMobileView && (
            <IconButton
              className="flex-1"
              icon={<Home size={16} strokeWidth={1.8} />}
              showText="always"
              to="/"
              tone="terciary"
            >
              {rsvpContent.searchInvitation.backHome}
            </IconButton>
          )}
        </div>
      </form>
    </FormCard>
  );
}
