import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";

export default function ContactDetailsCard({
  contact,
  disableFilledFields = true,
  errors,
  onContactChange,
}) {
  return (
    <FormCard>
      <p className="section-eyebrow mb-4">Contacto</p>

      <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
        Datos de contacto
      </h2>

      <div className="mt-4 grid gap-5 md:grid-cols-3">
        <div>
          <Label>Nombre de grupo *</Label>

          <input
            type="text"
            value={contact.groupName}
            onChange={(event) =>
              onContactChange("groupName", event.target.value)
            }
            className={inputClassName}
            placeholder="Ej: Familia Garcia"
            disabled={disableFilledFields && Boolean(contact.groupName)}
          />

          <FieldError>{errors.groupName}</FieldError>
        </div>

        <div>
          <Label>Email de contacto *</Label>

          <input
            type="email"
            value={contact.email}
            onChange={(event) => onContactChange("email", event.target.value)}
            className={inputClassName}
            placeholder="Ej: ejemplo@email.com"
            disabled={disableFilledFields && Boolean(contact.email)}
          />

          <FieldError>{errors.email}</FieldError>
        </div>

        <div>
          <Label>Teléfono de contacto *</Label>

          <input
            type="tel"
            value={contact.phone}
            onChange={(event) => onContactChange("phone", event.target.value)}
            className={inputClassName}
            placeholder="Ej: 600123456"
            disabled={disableFilledFields && Boolean(contact.phone)}
          />

          <FieldError>{errors.phone}</FieldError>
        </div>
      </div>
    </FormCard>
  );
}
