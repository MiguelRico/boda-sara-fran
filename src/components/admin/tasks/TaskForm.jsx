import { Save } from "lucide-react";

import IconButton from "../../ui/IconButton";
import { TextField } from "../../ui/FormFields";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
  selectClassName,
} from "../../rsvp/FormPrimitives";
import { adminContent } from "../../../constants/adminContent";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_RESPONSIBLES,
  TASK_STATUSES,
} from "../../../constants/tasks";

export default function TaskForm({
  errors = {},
  form,
  onChange,
  onSubmit,
  submitDisabled = false,
}) {
  const content = adminContent.tasks.form;

  return (
    <form className="mt-4 space-y-5" onSubmit={onSubmit}>
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <IconButton
          className="w-full"
          disabled={submitDisabled}
          icon={<Save size={16} strokeWidth={1.8} />}
          keepTextOnAdminSubpages
          label={adminContent.tasks.actions.save}
          showText="always"
          tone="primary"
          type="submit"
        >
          {adminContent.tasks.actions.save}
        </IconButton>
      </div>

      <FormCard>
        <div className="grid gap-5">
          <div>
            <Label>{content.fields.title}</Label>
            <input
              className={inputClassName}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder={content.placeholders.title}
              value={form.title}
            />
            <FieldError>{errors.title}</FieldError>
          </div>

          <TextField
            label={content.fields.maxDate}
            onChange={(value) => onChange("maxDate", value)}
            type="date"
            value={form.maxDate}
          />
        </div>

        <div className="mt-5 grid gap-5">
          <SelectField
            error={errors.category}
            label={content.fields.category}
            onChange={(value) => onChange("category", value)}
            options={TASK_CATEGORIES}
            value={form.category}
          />
          <SelectField
            error={errors.priority}
            label={content.fields.priority}
            onChange={(value) => onChange("priority", value)}
            options={TASK_PRIORITIES}
            value={form.priority}
          />
          <SelectField
            error={errors.responsible}
            label={content.fields.responsible}
            onChange={(value) => onChange("responsible", value)}
            options={TASK_RESPONSIBLES}
            value={form.responsible}
          />
          <SelectField
            error={errors.status}
            label={content.fields.status}
            onChange={(value) => onChange("status", value)}
            options={TASK_STATUSES}
            value={form.status}
          />
        </div>

        <div className="mt-5">
          <Label>{content.fields.description}</Label>
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder={content.placeholders.description}
            value={form.description}
          />
        </div>
      </FormCard>
    </form>
  );
}

function SelectField({ error, label, onChange, options, value }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        className={selectClassName}
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
