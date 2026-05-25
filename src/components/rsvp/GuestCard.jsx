import {
  COMMON_ALLERGIES,
  OUTBOUND_BUS_OPTIONS,
  RETURN_BUS_OPTIONS,
} from "../../constants/rsvp";
import { FieldError, FormCard, inputClassName, Label } from "./RsvpFormPrimitives";

export default function GuestCard({
  canRemove,
  errors,
  guest,
  index,
  onGuestChange,
  onRemoveGuest,
}) {
  return (
    <FormCard>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow mb-3">Invitado {index + 1}</p>

          <h3 className="font-serif text-3xl text-[#2f2a25]">
            Información del invitado
          </h3>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemoveGuest(index)}
            className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-xs uppercase tracking-[0.18em] text-red-500 transition hover:bg-red-100"
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label>Nombre *</Label>

          <input
            type="text"
            value={guest.name}
            onChange={(event) =>
              onGuestChange(index, "name", event.target.value)
            }
            className={inputClassName}
            placeholder="Ej: Sara"
          />

          <FieldError>{errors[`guest_name_${index}`]}</FieldError>
        </div>

        <div>
          <Label>Apellidos *</Label>

          <input
            type="text"
            value={guest.lastname}
            onChange={(event) =>
              onGuestChange(index, "lastname", event.target.value)
            }
            className={inputClassName}
            placeholder="Ej: García"
          />

          <FieldError>{errors[`guest_lastname_${index}`]}</FieldError>
        </div>
      </div>

      <div className="mt-8">
        <Label>Intolerancias o alergias</Label>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {COMMON_ALLERGIES.map((allergy) => {
            const checked = guest.allergies.includes(allergy);

            return (
              <label
                key={allergy}
                className={`
                  flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm transition-all duration-300
                  ${
                    checked
                      ? "border-[#8f6f56] bg-[#8f6f56] text-white"
                      : "border-[#eadccb] bg-[#fbf7f1]/70 text-[#7b6b5d] hover:border-[#d8c1ad] hover:bg-white"
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked}
                  onChange={() => onGuestChange(index, "allergies", allergy)}
                />

                {allergy}
              </label>
            );
          })}
        </div>

        <textarea
          rows={3}
          value={guest.otherAllergies}
          onChange={(event) =>
            onGuestChange(index, "otherAllergies", event.target.value)
          }
          placeholder="Otras alergias, intolerancias o comentarios alimentarios"
          className={`${inputClassName} mt-4 resize-none`}
        />
      </div>

      <div className="mt-8">
        <Label>Comentarios adicionales</Label>

        <textarea
          rows={4}
          value={guest.comments}
          onChange={(event) =>
            onGuestChange(index, "comments", event.target.value)
          }
          className={`${inputClassName} resize-none`}
          placeholder="Cualquier indicación que debamos tener en cuenta"
        />

        <FieldError>{errors[`guest_comments_${index}`]}</FieldError>
      </div>

      <div className="mt-8 rounded-[2rem] border border-[#eadccb] bg-[#fbf7f1]/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-[#2f2a25]">
              Servicio de autobús
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#7b6b5d]">
              Tendremos autobús para facilitar el desplazamiento de ida y
              vuelta.
            </p>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={guest.busNeeded}
              onChange={(event) =>
                onGuestChange(index, "busNeeded", event.target.checked)
              }
              className="peer sr-only"
            />

            <div className="peer h-6 w-11 rounded-full bg-[#d8c1ad] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#8f6f56] peer-checked:after:translate-x-full" />
          </label>
        </div>

        {guest.busNeeded && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <BusSelect
              label="Horario ida"
              value={guest.outboundBus}
              options={OUTBOUND_BUS_OPTIONS}
              onChange={(value) => onGuestChange(index, "outboundBus", value)}
            />

            <BusSelect
              label="Horario vuelta"
              value={guest.returnBus}
              options={RETURN_BUS_OPTIONS}
              onChange={(value) => onGuestChange(index, "returnBus", value)}
            />
          </div>
        )}
      </div>
    </FormCard>
  );
}

function BusSelect({ label, onChange, options, value }) {
  return (
    <div>
      <Label>{label}</Label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
