import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Trash2 } from "lucide-react";
import IconButton from "../ui/IconButton";
import {
  COMMON_ALLERGIES,
  OUTBOUND_BUS_OPTIONS,
  RETURN_BUS_OPTIONS,
} from "../../constants/rsvp";
import { FieldError, FormCard, inputClassName, Label } from "./FormPrimitives";

export default function GuestCard({
  canRemove,
  errors,
  guest,
  index,
  onGuestChange,
  onRemoveGuest,
}) {
  const reduceMotion = useReducedMotion();
  const busPanelHidden = reduceMotion
    ? { height: 0, opacity: 0 }
    : { height: 0, opacity: 0, y: -8, filter: "blur(4px)" };
  const busPanelVisible = reduceMotion
    ? { height: "auto", opacity: 1 }
    : { height: "auto", opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <FormCard>
      <div className="flex items-center justify-between gap-4">
        <p className={`section-eyebrow ${canRemove ? "mb-0" : ""}`}>
          Invitado {index + 1}
        </p>

        {canRemove && (
          <IconButton
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label={`Eliminar invitado ${index + 1}`}
            onClick={() => onRemoveGuest(index)}
            tone="danger"
          />
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

      <div className="mt-4">
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
                      ? "border-[var(--color-border-strong)] bg-[var(--color-accent-dark)] text-white"
                      : "border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white"
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

      <div className="mt-2">
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

      <div className="mt-4 rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-[var(--color-accent-dark)]">
              Servicio de autobús
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
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

            <div className="peer h-6 w-11 rounded-full bg-[var(--color-border-strong)] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] peer-checked:after:translate-x-full" />
          </label>
        </div>

        <AnimatePresence initial={false}>
          {guest.busNeeded && (
            <motion.div
              key="bus-options"
              initial={busPanelHidden}
              animate={busPanelVisible}
              exit={busPanelHidden}
              transition={{
                duration: reduceMotion ? 0.18 : 0.46,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <BusSelect
                  label="Horario ida"
                  value={guest.outboundBus}
                  options={OUTBOUND_BUS_OPTIONS}
                  onChange={(value) =>
                    onGuestChange(index, "outboundBus", value)
                  }
                />

                <BusSelect
                  label="Horario vuelta"
                  value={guest.returnBus}
                  options={RETURN_BUS_OPTIONS}
                  onChange={(value) => onGuestChange(index, "returnBus", value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        className={inputClassName + " bg-white"}
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

