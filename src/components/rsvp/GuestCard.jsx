import { Trash2 } from "lucide-react";
import IconButton from "../ui/IconButton";
import CollapsiblePanel from "../ui/CollapsiblePanel";
import {
  COMMON_ALLERGIES,
  GUEST_MENU_OPTIONS,
  OUTBOUND_BUS_OPTIONS,
  RETURN_BUS_OPTIONS,
} from "../../constants/rsvp";
import { rsvpContent } from "../../constants/rsvpContent";
import { isMenuModuleEnabled } from "../../config/features";
import useIsMobileView from "../../hooks/useIsMobileView";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
  selectClassName,
} from "./FormPrimitives";

export default function GuestCard({
  canRemove,
  card = true,
  errors,
  guest,
  index,
  onGuestChange,
  onRemoveGuest,
  showHeader = true,
  variant = "public",
}) {
  const isMobileView = useIsMobileView();
  const isAdmin = variant === "admin";
  const isPublicDesktop = variant === "public" && !isMobileView;
  const nameError = errors[`guest_name_${index}`];
  const lastnameError = errors[`guest_lastname_${index}`];
  const menuError = errors[`guest_menu_${index}`];
  const commentsError = errors[`guest_comments_${index}`];
  const nameGridClassName = isPublicDesktop ? "grid grid-cols-2 gap-5" : "grid gap-5";
  const detailsGridClassName = isPublicDesktop
    ? "mt-4 grid grid-cols-2 items-start gap-5"
    : "";
  const commentsClassName = isPublicDesktop ? "" : "mt-4";
  const guestOptionsClassName = isPublicDesktop ? "pt-7" : "";
  const content = (
    <>
      {showHeader && (
        <div className="flex items-center justify-between gap-4">
          <p className={`section-eyebrow ${canRemove ? "mb-0" : ""}`}>
            {rsvpContent.form.guestLabel(index + 1)}
          </p>

          {canRemove && (
            <IconButton
              icon={<Trash2 size={16} strokeWidth={1.8} />}
              label={rsvpContent.form.removeGuestLabel(index + 1)}
              onClick={() => onRemoveGuest(index)}
              tone="danger"
            />
          )}
        </div>
      )}

      <div className={nameGridClassName}>
        <div>
          <Label>{rsvpContent.guest.fields.name.label}</Label>

          <input
            type="text"
            value={guest.name}
            onChange={(event) =>
              onGuestChange(index, "name", event.target.value)
            }
            className={inputClassName}
            placeholder={rsvpContent.guest.fields.name.placeholder}
          />

          <FieldError>{nameError}</FieldError>
        </div>

        <div>
          <Label>{rsvpContent.guest.fields.lastname.label}</Label>

          <input
            type="text"
            value={guest.lastname}
            onChange={(event) =>
              onGuestChange(index, "lastname", event.target.value)
            }
            className={inputClassName}
            placeholder={rsvpContent.guest.fields.lastname.placeholder}
          />

          <FieldError>{lastnameError}</FieldError>
        </div>
      </div>

      {isMenuModuleEnabled && (
        <div className="mt-4">
          <Label>{rsvpContent.guest.fields.menu.label}</Label>

          <div className="form-choice-group grid grid-cols-2 gap-3">
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

          <FieldError>{menuError}</FieldError>
        </div>
      )}

      <div className={detailsGridClassName}>
        <div className={commentsClassName}>
          <Label>{rsvpContent.guest.fields.comments.label}</Label>

          <textarea
            rows={2}
            value={guest.comments}
            onChange={(event) =>
              onGuestChange(index, "comments", event.target.value)
            }
            className={`${inputClassName} resize-none`}
            placeholder={rsvpContent.guest.fields.comments.placeholder}
          />

          <FieldError>{commentsError}</FieldError>
        </div>

        <div className={guestOptionsClassName}>
          <CollapsiblePanel className={isPublicDesktop ? "" : "mt-2"} title="Intolerancias">
            <p className="text-xs leading-relaxed text-[var(--color-accent)]">
              {rsvpContent.guest.panels.allergies.text}
            </p>
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ALLERGIES.map((allergy) => {
                  const checked = guest.allergies.includes(allergy);

                  return (
                    <label
                      key={allergy}
                      className={`
                        flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-xs transition-all duration-300
                        ${
                          checked
                            ? "border-[var(--color-border-strong)] bg-[var(--color-accent-dark)] text-white"
                            : "border-[var(--color-border)] bg-white/45 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white"
                        }
                      `}
                    >
                      <input
                        checked={checked}
                        className="hidden"
                        onChange={() => onGuestChange(index, "allergies", allergy)}
                        type="checkbox"
                      />

                      {allergy}
                    </label>
                  );
                })}
              </div>

              <textarea
                className={`${inputClassName} mt-3 resize-none`}
                onChange={(event) =>
                  onGuestChange(index, "otherAllergies", event.target.value)
                }
                placeholder={rsvpContent.guest.fields.otherAllergies.placeholder}
                rows={2}
                value={guest.otherAllergies}
              />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel className="mt-3" title="Transporte">
            <p className="text-xs leading-relaxed text-[var(--color-accent)]">
              {rsvpContent.guest.panels.bus.text}
            </p>
            <div className="mt-3 grid gap-3">
              <BusSelect
                label={rsvpContent.guest.fields.outboundBus.label}
                value={guest.outboundBus}
                options={OUTBOUND_BUS_OPTIONS}
                onChange={(value) => onGuestChange(index, "outboundBus", value)}
              />

              <BusSelect
                label={rsvpContent.guest.fields.returnBus.label}
                value={guest.returnBus}
                options={RETURN_BUS_OPTIONS}
                onChange={(value) => onGuestChange(index, "returnBus", value)}
              />
            </div>
          </CollapsiblePanel>
        </div>
      </div>

      {isAdmin && (
        <CollapsiblePanel className="mt-3" title="Mesa y asiento">
          <p className="text-xs leading-relaxed text-[var(--color-accent)]">
            {rsvpContent.guest.panels.seating.text}
          </p>
          <div className="mt-3 grid gap-3">
            <div>
              <Label>{rsvpContent.guest.fields.table.label}</Label>

              <input
                className={inputClassName}
                onChange={(event) =>
                  onGuestChange(index, "table", event.target.value)
                }
                placeholder={rsvpContent.guest.fields.table.placeholder}
                type="text"
                value={guest.table}
              />
            </div>

            <div>
              <Label>{rsvpContent.guest.fields.seat.label}</Label>

              <input
                className={inputClassName}
                onChange={(event) =>
                  onGuestChange(index, "seat", event.target.value)
                }
                placeholder={rsvpContent.guest.fields.seat.placeholder}
                type="text"
                value={guest.seat}
              />
            </div>
          </div>
        </CollapsiblePanel>
      )}
    </>
  );

  return card ? <FormCard>{content}</FormCard> : content;
}

function BusSelect({ label, onChange, options, value }) {
  return (
    <div>
      <Label>{label}</Label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
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
