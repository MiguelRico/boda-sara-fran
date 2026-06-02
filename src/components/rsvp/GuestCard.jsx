import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import IconButton from "../ui/IconButton";
import {
  COMMON_ALLERGIES,
  GUEST_MENU_OPTIONS,
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
  variant = "public",
}) {
  const reduceMotion = useReducedMotion();
  const [showSeatingPanel, setShowSeatingPanel] = useState(false);
  const [showAllergiesPanel, setShowAllergiesPanel] = useState(false);
  const [showBusPanel, setShowBusPanel] = useState(false);
  const isAdmin = variant === "admin";
  const panelHidden = reduceMotion
    ? { height: 0, opacity: 0 }
    : { height: 0, opacity: 0, y: -8, filter: "blur(4px)" };
  const panelVisible = reduceMotion
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
        <Label>Menú *</Label>

        <div className="grid grid-cols-2 gap-3">
          {GUEST_MENU_OPTIONS.map((menuOption) => {
            const checked = guest.menu === menuOption;

            return (
              <label
                key={menuOption}
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
                  checked={checked}
                  className="hidden"
                  name={`guest_menu_${index}`}
                  onChange={() => onGuestChange(index, "menu", menuOption)}
                  type="radio"
                />

                {menuOption}
              </label>
            );
          })}
        </div>

        <FieldError>{errors[`guest_menu_${index}`]}</FieldError>
      </div>

      <div className="mt-4">
        <Label>Comentarios adicionales</Label>

        <textarea
          rows={2}
          value={guest.comments}
          onChange={(event) =>
            onGuestChange(index, "comments", event.target.value)
          }
          className={`${inputClassName} resize-none`}
          placeholder="Cualquier indicación que debamos tener en cuenta"
        />

        <FieldError>{errors[`guest_comments_${index}`]}</FieldError>
      </div>

      <div className="mt-2 rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-[var(--color-accent-dark)]">
              Intolerancias
            </h3>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              checked={showAllergiesPanel}
              className="peer sr-only"
              onChange={(event) => setShowAllergiesPanel(event.target.checked)}
              type="checkbox"
            />

            <div className="peer h-6 w-11 rounded-full bg-[var(--color-border-strong)] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] peer-checked:after:translate-x-full" />
          </label>
        </div>

        <AnimatePresence initial={false}>
          {showAllergiesPanel && (
            <motion.div
              animate={panelVisible}
              className="overflow-hidden"
              exit={panelHidden}
              initial={panelHidden}
              key="allergies-options"
              transition={{
                duration: reduceMotion ? 0.18 : 0.46,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
                Indica cualquier necesidad alimentaria para que podamos tenerla
                en cuenta.
              </p>
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const checked = guest.allergies.includes(allergy);

                    return (
                      <label
                        key={allergy}
                        className={`
                          flex cursor-pointer text-center items-center justify-center rounded-2xl border px-4 py-3 text-sm transition-all duration-300
                          ${
                            checked
                              ? "border-[var(--color-border-strong)] bg-[var(--color-accent-dark)] text-white"
                              : "border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white"
                          }
                        `}
                      >
                        <input
                          checked={checked}
                          className="hidden"
                          onChange={() =>
                            onGuestChange(index, "allergies", allergy)
                          }
                          type="checkbox"
                        />

                        {allergy}
                      </label>
                    );
                  })}
                </div>

                <textarea
                  className={`${inputClassName} mt-4 resize-none`}
                  onChange={(event) =>
                    onGuestChange(index, "otherAllergies", event.target.value)
                  }
                  placeholder="Otros comentarios alimentarios"
                  rows={3}
                  value={guest.otherAllergies}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-[var(--color-accent-dark)]">
              Transporte
            </h3>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={showBusPanel}
              onChange={(event) => setShowBusPanel(event.target.checked)}
              className="peer sr-only"
            />

            <div className="peer h-6 w-11 rounded-full bg-[var(--color-border-strong)] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] peer-checked:after:translate-x-full" />
          </label>
        </div>

        <AnimatePresence initial={false}>
          {showBusPanel && (
            <motion.div
              key="bus-options"
              initial={panelHidden}
              animate={panelVisible}
              exit={panelHidden}
              transition={{
                duration: reduceMotion ? 0.18 : 0.46,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
                Tendremos autobús para facilitar el desplazamiento de ida y
                vuelta.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <BusSelect
                  label="Autobús de ida"
                  value={guest.outboundBus}
                  options={OUTBOUND_BUS_OPTIONS}
                  onChange={(value) =>
                    onGuestChange(index, "outboundBus", value)
                  }
                />

                <BusSelect
                  label="Autobús de vuelta"
                  value={guest.returnBus}
                  options={RETURN_BUS_OPTIONS}
                  onChange={(value) => onGuestChange(index, "returnBus", value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isAdmin && (
        <div className="mt-4 rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl text-[var(--color-accent-dark)]">
                Mesa y asiento
              </h3>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                checked={showSeatingPanel}
                className="peer sr-only"
                onChange={(event) => setShowSeatingPanel(event.target.checked)}
                type="checkbox"
              />

              <div className="peer h-6 w-11 rounded-full bg-[var(--color-border-strong)] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] peer-checked:after:translate-x-full" />
            </label>
          </div>

          <AnimatePresence initial={false}>
            {showSeatingPanel && (
              <motion.div
                animate={panelVisible}
                className="overflow-hidden"
                exit={panelHidden}
                initial={panelHidden}
                key="seating-options"
                transition={{
                  duration: reduceMotion ? 0.18 : 0.46,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-accent)]">
                  Datos internos para organizar la disposición de invitados.
                </p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <Label>Mesa</Label>

                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        onGuestChange(index, "table", event.target.value)
                      }
                      placeholder="Ej: 4"
                      type="text"
                      value={guest.table}
                    />
                  </div>

                  <div>
                    <Label>Asiento</Label>

                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        onGuestChange(index, "seat", event.target.value)
                      }
                      placeholder="Ej: 7"
                      type="text"
                      value={guest.seat}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
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
