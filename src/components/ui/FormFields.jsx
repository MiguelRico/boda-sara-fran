import { CalendarDays } from "lucide-react";

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

  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <input
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`${inputClassName} ${
            isDateField
              ? "pr-11 [&::-webkit-calendar-picker-indicator]:opacity-0"
              : ""
          }`}
          disabled={disabled}
          inputMode={inputMode}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        {isDateField && (
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-accent-dark)]"
            size={17}
            strokeWidth={1.8}
          />
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
