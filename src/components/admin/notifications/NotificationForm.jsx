import { Save } from "lucide-react";

import IconButton from "../../ui/IconButton";
import {
  FieldError,
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
}) {
  const content = adminContent.notifications.form;

  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">{content.eyebrow}</p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {content.title}
      </h2>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-[1fr_12rem_12rem]">
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

          <div>
            <Label>{content.fields.date}</Label>
            <input
              className={inputClassName}
              onChange={(event) => onChange("date", event.target.value)}
              type="date"
              value={form.date}
            />
            <FieldError>{errors.date}</FieldError>
          </div>

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

        <div>
          <Label>{content.fields.detail}</Label>
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            onChange={(event) => onChange("detail", event.target.value)}
            placeholder={content.placeholders.detail}
            value={form.detail}
          />
        </div>

        <IconButton
          className="w-full"
          icon={<Save size={16} strokeWidth={1.8} />}
          showText="always"
          tone="primary"
          type="submit"
        >
          {content.save}
        </IconButton>
      </form>
    </section>
  );
}
