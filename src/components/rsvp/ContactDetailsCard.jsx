import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";
import { rsvpContent } from "../../constants/rsvpContent";

export default function ContactDetailsCard({
  contact,
  disableFilledFields = true,
  errors,
  onContactChange,
}) {
  const disabledFields =
    typeof disableFilledFields === "object"
      ? disableFilledFields
      : {
          email: disableFilledFields,
          confirmationName: disableFilledFields,
          phone: disableFilledFields,
        };

  return (
    <FormCard>
      <p className="section-eyebrow">{rsvpContent.contact.eyebrow}</p>

      <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
        {rsvpContent.contact.title}
      </h2>

      <div className="grid gap-5 md:grid-cols-3 mt-4">
        <div>
          <Label>{rsvpContent.contact.fields.confirmationName.label}</Label>

          <input
            type="text"
            value={contact.confirmationName}
            onChange={(event) =>
              onContactChange("confirmationName", event.target.value)
            }
            className={inputClassName}
            placeholder={
              rsvpContent.contact.fields.confirmationName.placeholder
            }
            disabled={disabledFields.confirmationName}
          />

          <FieldError>{errors.confirmationName}</FieldError>
        </div>

        <div>
          <Label>{rsvpContent.contact.fields.email.label}</Label>

          <input
            type="email"
            value={contact.email}
            onChange={(event) => onContactChange("email", event.target.value)}
            className={inputClassName}
            placeholder={rsvpContent.contact.fields.email.placeholder}
            disabled={disabledFields.email}
          />

          <FieldError>{errors.email}</FieldError>
        </div>

        <div>
          <Label>{rsvpContent.contact.fields.phone.label}</Label>

          <input
            type="tel"
            value={contact.phone}
            onChange={(event) => onContactChange("phone", event.target.value)}
            className={inputClassName}
            placeholder={rsvpContent.contact.fields.phone.placeholder}
            disabled={disabledFields.phone}
          />

          <FieldError>{errors.phone}</FieldError>
        </div>
      </div>
    </FormCard>
  );
}
