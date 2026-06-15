import { useState } from "react";
import { CircleHelp, Mail, Phone } from "lucide-react";

import IconButton from "../ui/IconButton";
import StatusDialog from "../ui/StatusDialog";
import { siteContent } from "../../config/siteContent";
import { uiContent } from "../../constants/uiContent";
import { getEmailHref, getPhoneHref } from "../../utils/contactLinks";

export default function HelpAccessButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { help } = siteContent;

  return (
    <>
      <div className="fixed left-3 top-3 z-50">
        <IconButton
          className="bg-white/70 shadow-[0_18px_45px_rgba(52,69,49,0.12)] backdrop-blur-md hover:bg-white/90"
          icon={<CircleHelp size={18} strokeWidth={1.8} />}
          label={help.openLabel}
          onClick={() => setIsOpen(true)}
          type="button"
          tone="terciary"
        >
          {help.buttonText}
        </IconButton>
      </div>

      <StatusDialog
        closeText={uiContent.actions.close}
        eyebrow={help.eyebrow}
        message={help.text}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        role="dialog"
        title={help.title}
      >
        <div className="mt-6 grid gap-3">
          {help.contacts.map((contact) => (
            <div
              className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4 text-left"
              key={contact.name}
            >
              <h3 className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
                {contact.name}
              </h3>

              <div className="mt-4 grid gap-3">
                <IconButton
                  className="w-full justify-start"
                  disabled={!contact.phone}
                  href={contact.phone ? getPhoneHref(contact.phone) : undefined}
                  icon={<Phone size={16} strokeWidth={1.8} />}
                  showText="always"
                  tone="terciary"
                >
                  {contact.phone || help.phonePending}
                </IconButton>

                <IconButton
                  className="w-full justify-start"
                  disabled={!contact.email}
                  href={contact.email ? getEmailHref(contact.email) : undefined}
                  icon={<Mail size={16} strokeWidth={1.8} />}
                  showText="always"
                  tone="terciary"
                >
                  {contact.email || help.emailPending}
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </StatusDialog>
    </>
  );
}
