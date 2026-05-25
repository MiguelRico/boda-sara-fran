import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
} from "../ui/FormPrimitives";

export default function ContactDetailsCard({
  contact,
  errors,
  onContactChange,
}) {
  return (
    <FormCard>
      <p className="section-eyebrow mb-3">Contacto</p>

      <h2 className="mb-8 font-serif text-3xl text-[#2f2a25]">
        Datos de contacto
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label>Email de contacto *</Label>

          <input
            type="email"
            value={contact.email}
            onChange={(event) => onContactChange("email", event.target.value)}
            className={inputClassName}
            placeholder="Ej: ejemplo@email.com"
            disabled={Boolean(contact.email)}
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
            disabled={Boolean(contact.phone)}
          />

          <FieldError>{errors.phone}</FieldError>
        </div>
      </div>
    </FormCard>
  );
}
