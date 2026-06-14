import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";
import { rsvpContent } from "../../constants/rsvpContent";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

export default function ContactDetailsCard({
  contact,
  disableFilledFields = true,
  errors,
  forceMobileLayout = false,
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

      <div
        className={`mt-4 grid gap-5 ${
          forceMobileLayout ? "" : "md:grid-cols-3"
        }`}
      >
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
            inputMode="numeric"
            pattern="[0-9]*"
            type="tel"
            value={contact.phone}
            onChange={(event) =>
              onContactChange("phone", onlyDigits(event.target.value))
            }
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
