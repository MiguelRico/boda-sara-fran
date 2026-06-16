import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Euro,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { PROVIDER_CATEGORIES } from "../../../constants/providers";
import { FieldError, FormCard } from "../../rsvp/FormPrimitives";
import CollapsiblePanel from "../../ui/CollapsiblePanel";
import { SelectField, TextField } from "../../ui/FormFields";
import IconButton from "../../ui/IconButton";

export default function ProviderForm({
  errors,
  form,
  loading,
  mode = "provider",
  onAddService,
  onChange,
  onPaymentChange,
  onRemoveService,
  onServiceChange,
  onSubmit,
  serviceIsEditing = false,
  selectedServiceId = "",
  submitDisabled = false,
}) {
  const reduceMotion = useReducedMotion();
  const paymentListHidden = reduceMotion
    ? { opacity: 0, height: 0 }
    : { opacity: 0, height: 0, y: -6, filter: "blur(4px)" };
  const paymentListVisible = reduceMotion
    ? { opacity: 1, height: "auto" }
    : { opacity: 1, height: "auto", y: 0, filter: "blur(0px)" };
  const showProviderFields = mode !== "service";
  const showServiceFields = mode !== "provider";
  const serviceEntries = form.services
    .map((service, serviceIndex) => ({ service, serviceIndex }))
    .filter(
      ({ service }) => mode !== "service" || service.id === selectedServiceId,
    );

  return (
    <form className="mt-4 space-y-5" noValidate onSubmit={onSubmit}>
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
        <IconButton
          className="w-full"
          disabled={loading || submitDisabled}
          icon={<Save size={16} strokeWidth={1.8} />}
          keepTextOnAdminSubpages
          label={adminContent.providers.form.save}
          showText="always"
          tone="primary"
          type="submit"
        >
          {adminContent.providers.form.save}
        </IconButton>
      </div>

      {showProviderFields && (
        <>
          <FormCard>
            <div className="grid gap-5">
              <TextField
                error={errors.name}
                label={adminContent.providers.form.fields.name}
                onChange={(value) => onChange("name", value)}
                value={form.name}
              />
              <SelectField
                label={adminContent.providers.form.fields.category}
                onChange={(value) => onChange("category", value)}
                options={PROVIDER_CATEGORIES}
                value={form.category}
              />
              <TextField
                error={errors.phone}
                label={adminContent.providers.form.fields.phone}
                onChange={(value) => onChange("phone", value)}
                type="tel"
                value={form.phone}
              />
              <TextField
                error={errors.email}
                label={adminContent.providers.form.fields.email}
                onChange={(value) => onChange("email", value)}
                type="email"
                value={form.email}
              />
            </div>

            <CollapsiblePanel className="mt-5" title="Datos opcionales">
              <div className="grid gap-5">
                <TextField
                  label={adminContent.providers.form.fields.address}
                  onChange={(value) => onChange("address", value)}
                  value={form.address}
                />
                <TextField
                  label={adminContent.providers.form.fields.web}
                  onChange={(value) => onChange("web", value)}
                  type="url"
                  value={form.web}
                />
                <TextField
                  label={adminContent.providers.form.fields.accountNumber}
                  onChange={(value) => onChange("accountNumber", value)}
                  value={form.accountNumber}
                />
              </div>
            </CollapsiblePanel>
          </FormCard>
        </>
      )}

      {showServiceFields && (
        <div className="grid gap-4">
          {mode !== "service" && (
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
              <IconButton
                className="w-full"
                icon={<Plus size={16} strokeWidth={1.8} />}
                keepTextOnAdminSubpages
                label={adminContent.providers.form.addService}
                onClick={onAddService}
                showText="always"
                tone="secondary"
                type="button"
              >
                {adminContent.providers.form.addService}
              </IconButton>
            </div>
          )}

          {serviceEntries.map(({ service, serviceIndex }) => (
            <FormCard
              className="border border-[var(--color-border)]"
              key={service.id}
            >
              <div className="grid gap-4">
                <TextField
                  error={errors[`service_${serviceIndex}_name`]}
                  label={adminContent.providers.form.fields.serviceName}
                  onChange={(value) =>
                    onServiceChange(serviceIndex, "name", value)
                  }
                  value={service.name}
                />
                <TextField
                  disabled
                  error={errors[`service_${serviceIndex}_price`]}
                  label={adminContent.providers.form.fields.servicePrice}
                  onChange={() => {}}
                  value={getServicePaymentDisplayTotal(service)}
                />
                <SelectField
                  label={adminContent.providers.form.fields.paymentCount}
                  onChange={(value) =>
                    onServiceChange(serviceIndex, "paymentCount", Number(value))
                  }
                  options={[1, 2, 3].map((count) => ({
                    label: count,
                    value: count,
                  }))}
                  value={service.paymentCount}
                />
                {mode !== "service" && (
                  <IconButton
                    className="w-full"
                    icon={<Trash2 size={16} strokeWidth={1.8} />}
                    keepTextOnAdminSubpages
                    label={adminContent.providers.form.deleteService}
                    onClick={() => onRemoveService(serviceIndex)}
                    showText="always"
                    tone="danger"
                    type="button"
                  >
                    {adminContent.providers.form.deleteService}
                  </IconButton>
                )}
              </div>

              <div className="mt-4 grid gap-3">
                <AnimatePresence initial={false}>
                  {service.payments
                    .slice(0, service.paymentCount)
                    .map((payment, paymentIndex) => {
                      return (
                        <motion.div
                          animate={paymentListVisible}
                          className="overflow-hidden"
                          exit={paymentListHidden}
                          initial={paymentListHidden}
                          key={`${serviceIndex}-${paymentIndex}`}
                          transition={{
                            duration: reduceMotion ? 0.18 : 0.34,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <PaymentPanel
                            defaultOpen={
                              mode === "service" && serviceIsEditing
                                ? false
                                : paymentIndex === 0
                            }
                            payment={payment}
                          >
                            <ProviderPaymentFields
                              onPaymentChange={onPaymentChange}
                              payment={payment}
                              paymentIndex={paymentIndex}
                              serviceIndex={serviceIndex}
                            />
                          </PaymentPanel>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
              <FieldError>
                {errors[`service_${serviceIndex}_payments`]}
              </FieldError>
            </FormCard>
          ))}
        </div>
      )}
    </form>
  );
}

function PaymentPanel({ children, defaultOpen, payment }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const panelHidden = reduceMotion
    ? { opacity: 0, height: 0 }
    : { opacity: 0, height: 0, y: -8, filter: "blur(6px)" };
  const panelVisible = reduceMotion
    ? { opacity: 1, height: "auto" }
    : { opacity: 1, height: "auto", y: 0, filter: "blur(0px)" };

  return (
    <section className="rounded-[1rem] border border-[var(--color-border)] bg-white/35 p-2">
      <button
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <PaymentSummary payment={payment} />
        <span className="flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-full bg-[var(--color-border-strong)] text-white transition">
          <ChevronDown
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            size={16}
            strokeWidth={1.8}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={panelVisible}
            className="overflow-hidden"
            exit={panelHidden}
            initial={panelHidden}
            key="provider-payment-content"
            transition={{
              duration: reduceMotion ? 0.18 : 0.46,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="mt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PaymentSummary({ payment }) {
  const statusLabel = payment.paid
    ? adminContent.providers.overview.metrics.paid
    : adminContent.providers.overview.metrics.pending;
  const statusTone = payment.paid
    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-[var(--shadow-button)]"
    : "border-amber-200 bg-amber-100 text-amber-700";

  return (
    <div className="grid min-w-0 grid-cols-2 gap-1">
      <SummaryPill
        icon={
          payment.paid ? (
            <CheckCircle2 size={12} strokeWidth={2} />
          ) : (
            <Clock3 size={12} strokeWidth={2} />
          )
        }
        label={statusLabel}
        toneClassName={statusTone}
        value={statusLabel}
      />
      <SummaryPill
        icon={<Euro size={12} strokeWidth={2} />}
        label={adminContent.providers.form.fields.paymentAmount}
        toneClassName="border-[var(--color-border-strong)] bg-white/45 text-[var(--color-muted)]"
        value={formatPaymentCurrency(payment.amount)}
      />
    </div>
  );
}

function SummaryPill({ icon, label, toneClassName, value }) {
  const hasValue = value != null && value !== "";

  return (
    <span
      aria-label={hasValue ? `${label}: ${value}` : label}
      className={`inline-flex min-h-7 min-w-0 max-w-full items-center justify-center gap-1 rounded-full border px-2 py-1 text-center text-[0.68rem] font-semibold leading-none ${toneClassName}`}
      title={hasValue ? `${label}: ${value}` : label}
    >
      <span className="shrink-0">{icon}</span>
      {hasValue && (
        <span className="min-w-0 whitespace-normal break-words">{value}</span>
      )}
    </span>
  );
}

function formatPaymentCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(Number(String(value || "").replace(",", ".")) || 0);
}

function getServicePaymentDisplayTotal(service) {
  const total = service.payments
    .slice(0, service.paymentCount)
    .reduce(
      (sum, payment) =>
        sum + (Number(String(payment.amount || "").replace(",", ".")) || 0),
      0,
    );

  return total.toFixed(2);
}

function ProviderPaymentFields({
  onPaymentChange,
  payment,
  paymentIndex,
  serviceIndex,
}) {
  return (
    <div className="grid gap-3">
      <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 px-4 py-3 text-sm text-[var(--color-accent-dark)] transition hover:bg-white">
        <span>{adminContent.providers.form.fields.paymentPaid}</span>
        <input
          checked={payment.paid}
          className="peer sr-only"
          onChange={(event) =>
            onPaymentChange(
              serviceIndex,
              paymentIndex,
              "paid",
              event.target.checked,
            )
          }
          type="checkbox"
        />
        <span className="relative h-6 w-11 rounded-full bg-[var(--color-border-strong)] transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent-dark)] peer-checked:after:translate-x-full" />
      </label>
      <TextField
        inputMode="decimal"
        label={adminContent.providers.form.fields.paymentAmount}
        onChange={(value) =>
          onPaymentChange(serviceIndex, paymentIndex, "amount", value)
        }
        value={payment.amount}
      />
      <TextField
        label={adminContent.providers.form.fields.paymentDate}
        onChange={(value) =>
          onPaymentChange(serviceIndex, paymentIndex, "date", value)
        }
        type="date"
        value={payment.date}
      />
    </div>
  );
}
