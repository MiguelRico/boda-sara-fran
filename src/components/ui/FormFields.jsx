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
  onChange,
  placeholder,
  type = "text",
  value,
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={inputClassName}
        disabled={disabled}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
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
