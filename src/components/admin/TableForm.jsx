import {
  BriefcaseBusiness,
  HeartHandshake,
  Save,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import {
  DEFAULT_TABLE_SHAPE,
  tableFormContent,
  TABLE_GROUP_OPTIONS,
  TABLE_SHAPE_OPTIONS,
} from "../../constants/tables";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
} from "../rsvp/FormPrimitives";
import IconButton from "../ui/IconButton";

const groupIcons = {
  briefcase: BriefcaseBusiness,
  heart: HeartHandshake,
  users: UsersRound,
};

const getShapeOption = (shape) =>
  TABLE_SHAPE_OPTIONS.find((option) => option.value === shape) ||
  TABLE_SHAPE_OPTIONS.find((option) => option.value === DEFAULT_TABLE_SHAPE);

export default function TableForm({
  content = tableFormContent,
  errors = {},
  form,
  loading = false,
  onCancel,
  onChange,
  onDelete,
  onSubmit,
}) {
  const shapeOption = getShapeOption(form.shape);
  const seatOptions = Array.from(
    { length: shapeOption.seatRange.max - shapeOption.seatRange.min + 1 },
    (_, index) => shapeOption.seatRange.min + index,
  );

  const handleShapeChange = (shape) => {
    const nextShape = getShapeOption(shape);
    const nextSeatCount = Math.min(
      Math.max(
        Number(form.seatCount) || nextShape.seatRange.min,
        nextShape.seatRange.min,
      ),
      nextShape.seatRange.max,
    );

    onChange("shape", nextShape.value);
    onChange("seatCount", nextSeatCount);
  };

  return (
    <form className="mt-4" noValidate onSubmit={onSubmit}>
      <FormCard>
        <p className="section-eyebrow mb-4">{content.eyebrow}</p>

        <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
          {content.title}
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <Label>{content.fields.name.label}</Label>

            <input
              className={inputClassName}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder={content.fields.name.placeholder}
              type="text"
              value={form.name}
            />

            <FieldError>{errors.name}</FieldError>
          </div>

          <div>
            <Label>{content.fields.group.label}</Label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TABLE_GROUP_OPTIONS.map((option) => {
                const checked = form.group === option.value;
                const GroupIcon = groupIcons[option.icon] || UsersRound;

                return (
                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center text-sm transition-all duration-300 ${
                      checked
                        ? "border-[var(--color-border-strong)] bg-[var(--color-accent-dark)] text-white"
                        : "border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white"
                    }`}
                    key={option.value}
                  >
                    <input
                      checked={checked}
                      className="hidden"
                      name="table_group"
                      onChange={() => onChange("group", option.value)}
                      type="radio"
                    />

                    <GroupIcon size={16} strokeWidth={1.8} />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>

            <FieldError>{errors.group}</FieldError>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <Label>{content.fields.shape.label}</Label>

            <div className="grid grid-cols-2 gap-3">
              {TABLE_SHAPE_OPTIONS.map((option) => {
                const checked = form.shape === option.value;

                return (
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm transition-all duration-300 ${
                      checked
                        ? "border-[var(--color-border-strong)] bg-[var(--color-accent-dark)] text-white"
                        : "border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white"
                    }`}
                    key={option.value}
                  >
                    <input
                      checked={checked}
                      className="hidden"
                      name="table_shape"
                      onChange={() => handleShapeChange(option.value)}
                      type="radio"
                    />

                    {option.label}
                  </label>
                );
              })}
            </div>

            <FieldError>{errors.shape}</FieldError>
          </div>

          <div>
            <Label>{content.fields.seatCount.label}</Label>

            <select
              className={`${inputClassName} bg-white`}
              onChange={(event) =>
                onChange("seatCount", Number(event.target.value))
              }
              value={form.seatCount}
            >
              {seatOptions.map((seatCount) => (
                <option key={seatCount} value={seatCount}>
                  {seatCount}
                </option>
              ))}
            </select>

            <FieldError>{errors.seatCount}</FieldError>
          </div>
        </div>

        <div className="mt-5">
          <Label>{content.fields.notes.label}</Label>

          <textarea
            className={`${inputClassName} resize-none`}
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder={content.fields.notes.placeholder}
            rows={4}
            value={form.notes}
          />

          <FieldError>{errors.notes}</FieldError>
        </div>

        <div
          className={`mt-6 flex flex-col gap-4 sm:grid ${
            onDelete ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          <IconButton
            disabled={loading}
            icon={<Save size={16} strokeWidth={1.8} />}
            label={content.submitText}
            showText="always"
            tone="primary"
            type="submit"
          >
            {content.submitText}
          </IconButton>

          {onDelete && (
            <IconButton
              disabled={loading}
              icon={<Trash2 size={16} strokeWidth={1.8} />}
              label="Eliminar mesa"
              onClick={onDelete}
              showText="always"
              tone="danger"
              type="button"
            >
              Eliminar mesa
            </IconButton>
          )}

          <IconButton
            disabled={loading}
            icon={<X size={16} strokeWidth={1.8} />}
            label={content.cancelText}
            onClick={onCancel}
            showText="always"
            tone="secondary"
            type="button"
          >
            {content.cancelText}
          </IconButton>
        </div>
      </FormCard>
    </form>
  );
}
