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
import { AdminNotification } from "../../../models";
import { adminContent } from "../../../constants/adminContent";

export default function NotificationForm({
  errors = {},
  form,
  onChange,
  onSubmit,
  submitDisabled = false,
}) {
  const content = adminContent.notifications.form;

  return (
    <form className="mt-4 space-y-5" onSubmit={onSubmit}>
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <IconButton
          className="w-full"
          disabled={submitDisabled}
          icon={<Save size={16} strokeWidth={1.8} />}
          keepTextOnAdminSubpages
          label={content.save}
          showText="always"
          tone="primary"
          type="submit"
        >
          {content.save}
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
            error={errors.date}
            label={content.fields.date}
            onChange={(value) => onChange("date", value)}
            type="date"
            value={form.date}
          />

          <div>
            <Label>{content.fields.type}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onChange("type", event.target.value)}
              value={form.type}
            >
              {AdminNotification.types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <Label>{content.fields.detail}</Label>
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            onChange={(event) => onChange("detail", event.target.value)}
            placeholder={content.placeholders.detail}
            value={form.detail}
          />
        </div>
      </FormCard>
    </form>
  );
}
