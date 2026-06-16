import { CalendarDays } from "lucide-react";
import { useRef } from "react";

import {
  FieldError,
  inputClassName,
  Label,
  selectClassName,
} from "../rsvp/FormPrimitives";

export function TextField({
  autoComplete,
  autoFocus,
  disabled = false,
  error,
  inputMode,
  label,
  onBlur,
  onChange,
  placeholder,
  type = "text",
  value,
}) {
  const isDateField = type === "date";
  const inputRef = useRef(null);
  const openDatePicker = () => {
    if (disabled) return;

    const input = inputRef.current;

    if (!input) return;

    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <input
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`${inputClassName} ${
            isDateField
              ? "appearance-none pr-11 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
              : ""
          }`}
          disabled={disabled}
          inputMode={inputMode}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          ref={inputRef}
          type={type}
          value={value}
        />
        {isDateField && (
          <button
            aria-label={label || "Abrir selector de fecha"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-accent-dark)] transition hover:bg-[var(--color-bg-soft)] disabled:pointer-events-none disabled:text-gray-400"
            disabled={disabled}
            onClick={openDatePicker}
            type="button"
          >
            <CalendarDays aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function SelectField({
  disabled = false,
  error,
  label,
  onChange,
  options,
  value,
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        className={selectClassName}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextareaField({
  disabled = false,
  error,
  label,
  onChange,
  placeholder,
  rows = 3,
  value,
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea
        className={`${inputClassName} resize-none`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}
