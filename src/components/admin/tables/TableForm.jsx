import {
  AlertTriangle,
  BriefcaseBusiness,
  HeartHandshake,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";

import {
  DEFAULT_TABLE_SHAPE,
  tableFormContent,
  TABLE_GROUP_OPTIONS,
  TABLE_SHAPE_OPTIONS,
} from "../../../constants/tables";
import { tableContent } from "../../../constants/tableContent";
import { FieldError, FormCard, Label } from "../../rsvp/FormPrimitives";
import { SelectField, TextareaField, TextField } from "../../ui/FormFields";
import IconButton from "../../ui/IconButton";

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
  onChange,
  onDelete,
  onSubmit,
  seatReductionWarning = [],
  submitDisabled = false,
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
      <div className="mb-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <div className="grid w-full grid-cols-1 gap-3">
          {onDelete && (
            <IconButton
              className="w-full"
              disabled={loading}
              icon={<Trash2 size={16} strokeWidth={1.8} />}
              keepTextOnAdminSubpages
              label={tableContent.form.deleteLabel}
              onClick={onDelete}
              showText="always"
              tone="danger"
              type="button"
            >
              {tableContent.form.deleteText}
            </IconButton>
          )}

          <IconButton
            className="w-full"
            disabled={loading || submitDisabled}
            icon={<Save size={16} strokeWidth={1.8} />}
            keepTextOnAdminSubpages
            label={content.submitText}
            showText="always"
            tone="primary"
            type="submit"
          >
            {content.submitText}
          </IconButton>
        </div>
      </div>

      <FormCard>
        <div className="mt-2 grid gap-5">
          <TextField
            error={errors.name}
            label={content.fields.name.label}
            onChange={(value) => onChange("name", value)}
            placeholder={content.fields.name.placeholder}
            value={form.name}
          />

          <div>
            <Label>{content.fields.group.label}</Label>

            <div className="form-choice-group grid grid-cols-1 gap-3">
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
        <div className="mt-5 grid gap-5">
          <div>
            <Label>{content.fields.shape.label}</Label>

            <div className="form-choice-group grid grid-cols-2 gap-3">
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
            <SelectField
              error={errors.seatCount}
              label={content.fields.seatCount.label}
              onChange={(value) => onChange("seatCount", Number(value))}
              options={seatOptions.map((seatCount) => ({
                label: seatCount,
                value: seatCount,
              }))}
              value={form.seatCount}
            />
            {seatReductionWarning.length > 0 && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 shrink-0"
                    size={16}
                    strokeWidth={1.8}
                  />
                  <div>
                    <p className="font-medium">
                      {tableContent.form.seatReductionWarning}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {seatReductionWarning.map((guest) => (
                        <li key={`${guest.seat}-${guest.name}`}>
                          {tableContent.form.seatReductionItem(guest)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-5">
          <TextareaField
            error={errors.notes}
            label={content.fields.notes.label}
            onChange={(value) => onChange("notes", value)}
            placeholder={content.fields.notes.placeholder}
            rows={4}
            value={form.notes}
          />
        </div>
      </FormCard>
    </form>
  );
}
