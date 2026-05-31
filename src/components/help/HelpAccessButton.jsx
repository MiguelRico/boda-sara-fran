import { useState } from "react";
import { CircleHelp, Mail, Phone } from "lucide-react";

import IconButton from "../ui/IconButton";
import StatusDialog from "../ui/StatusDialog";
import { siteContent } from "../../config/siteContent";

function formatPhoneHref(phone) {
  const normalizedPhone = phone.replace(/[^\d+]/g, "");

  return normalizedPhone ? `tel:${normalizedPhone}` : "";
}

export default function HelpAccessButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { help } = siteContent;

  return (
    <>
      <div className="fixed left-3 top-3 z-50 sm:left-5 sm:top-5">
        <IconButton
          className="bg-white/70 shadow-[0_18px_45px_rgba(52,69,49,0.12)] backdrop-blur-md hover:bg-white/90"
          icon={<CircleHelp size={18} strokeWidth={1.8} />}
          label="Abrir ayuda"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Ayuda
        </IconButton>
      </div>

      <StatusDialog
        closeText="Cerrar"
        eyebrow={help.eyebrow}
        message={help.text}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        role="dialog"
        title={help.title}
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  href={
                    contact.phone ? formatPhoneHref(contact.phone) : undefined
                  }
                  icon={<Phone size={16} strokeWidth={1.8} />}
                  showText="always"
                  tone="secondary"
                >
                  {contact.phone || "Telefono pendiente"}
                </IconButton>

                <IconButton
                  className="w-full justify-start"
                  disabled={!contact.email}
                  href={contact.email ? `mailto:${contact.email}` : undefined}
                  icon={<Mail size={16} strokeWidth={1.8} />}
                  showText="always"
                  tone="secondary"
                >
                  {contact.email || "Email pendiente"}
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </StatusDialog>
    </>
  );
}
