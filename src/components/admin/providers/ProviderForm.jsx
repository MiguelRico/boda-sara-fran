import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Save, Trash2 } from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { PROVIDER_CATEGORIES } from "../../../constants/providers";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
  selectClassName,
} from "../../rsvp/FormPrimitives";
import CollapsiblePanel from "../../ui/CollapsiblePanel";
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
  selectedServiceId = "",
}) {
  const reduceMotion = useReducedMotion();
  const paymentTransition = { duration: reduceMotion ? 0.12 : 0.32 };
  const paymentVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      };
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
          disabled={loading}
          icon={<Save size={16} strokeWidth={1.8} />}
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
            <p className="section-eyebrow mb-2">
              {adminContent.providers.form.contactTitle}
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <ProviderField
                error={errors.name}
                label={adminContent.providers.form.fields.name}
                onChange={(value) => onChange("name", value)}
                value={form.name}
              />
              <div>
                <Label>{adminContent.providers.form.fields.category}</Label>
                <select
                  className={selectClassName}
                  onChange={(event) => onChange("category", event.target.value)}
                  value={form.category}
                >
                  {PROVIDER_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <ProviderField
                error={errors.phone}
                label={adminContent.providers.form.fields.phone}
                onChange={(value) => onChange("phone", value)}
                type="tel"
                value={form.phone}
              />
              <ProviderField
                error={errors.email}
                label={adminContent.providers.form.fields.email}
                onChange={(value) => onChange("email", value)}
                type="email"
                value={form.email}
              />
            </div>
          </FormCard>

          <CollapsiblePanel title="Datos opcionales">
            <div className="grid gap-5 md:grid-cols-2">
              <ProviderField
                label={adminContent.providers.form.fields.address}
                onChange={(value) => onChange("address", value)}
                value={form.address}
              />
              <ProviderField
                label={adminContent.providers.form.fields.web}
                onChange={(value) => onChange("web", value)}
                type="url"
                value={form.web}
              />
              <div className="md:col-span-2">
                <ProviderField
                  label={adminContent.providers.form.fields.accountNumber}
                  onChange={(value) => onChange("accountNumber", value)}
                  value={form.accountNumber}
                />
              </div>
            </div>
          </CollapsiblePanel>
        </>
      )}

      {showServiceFields && (
        <FormCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow mb-2">
                {adminContent.providers.form.servicesTitle}
              </p>
              <h3 className="font-serif text-3xl text-[var(--color-accent-dark)]">
                {mode === "service"
                  ? "1 servicio"
                  : `${form.services.length} servicios`}
              </h3>
            </div>
            {mode !== "service" && (
              <IconButton
                icon={<Plus size={16} strokeWidth={1.8} />}
                label={adminContent.providers.form.addService}
                onClick={onAddService}
                tone="secondary"
                type="button"
              />
            )}
          </div>

          <div className="mt-5 grid gap-4">
            {serviceEntries.map(({ service, serviceIndex }) => (
              <div
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4"
                key={service.id}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_10rem_8rem_auto] md:items-end">
                  <ProviderField
                    error={errors[`service_${serviceIndex}_name`]}
                    label={adminContent.providers.form.fields.serviceName}
                    onChange={(value) =>
                      onServiceChange(serviceIndex, "name", value)
                    }
                    value={service.name}
                  />
                  <ProviderField
                    error={errors[`service_${serviceIndex}_price`]}
                    label={adminContent.providers.form.fields.servicePrice}
                    onChange={(value) =>
                      onServiceChange(serviceIndex, "price", value)
                    }
                    type="number"
                    value={service.price}
                  />
                  <div>
                    <Label>
                      {adminContent.providers.form.fields.paymentCount}
                    </Label>
                    <select
                      className={selectClassName}
                      onChange={(event) =>
                        onServiceChange(
                          serviceIndex,
                          "paymentCount",
                          Number(event.target.value),
                        )
                      }
                      value={service.paymentCount}
                    >
                      {[1, 2, 3].map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </div>
                  {mode !== "service" && (
                    <IconButton
                      icon={<Trash2 size={16} strokeWidth={1.8} />}
                      label={adminContent.providers.form.deleteService}
                      onClick={() => onRemoveService(serviceIndex)}
                      tone="danger"
                      type="button"
                    />
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {service.payments
                      .slice(0, service.paymentCount)
                      .map((payment, paymentIndex) => (
                        <motion.div
                          animate="visible"
                          className="rounded-2xl border border-[var(--color-border)] bg-white/50 p-3"
                          exit="hidden"
                          initial="hidden"
                          key={paymentIndex}
                          layout
                          transition={paymentTransition}
                          variants={paymentVariants}
                        >
                          <p className="section-eyebrow mb-3">
                            {adminContent.providers.form.payment(paymentIndex + 1)}
                          </p>
                          <input
                            className={inputClassName}
                            onChange={(event) =>
                              onPaymentChange(
                                serviceIndex,
                                paymentIndex,
                                "amount",
                                event.target.value,
                              )
                            }
                            placeholder="Importe"
                            type="number"
                            value={payment.amount}
                          />
                          <input
                            className={`${inputClassName} mt-3`}
                            onChange={(event) =>
                              onPaymentChange(
                                serviceIndex,
                                paymentIndex,
                                "date",
                                event.target.value,
                              )
                            }
                            type="date"
                            value={payment.date}
                          />
                          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-soft)]/70 px-4 py-3 text-sm text-[var(--color-accent-dark)] transition hover:bg-white">
                            <span>Pagado</span>
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
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
                <FieldError>{errors[`service_${serviceIndex}_payments`]}</FieldError>
              </div>
            ))}
          </div>
        </FormCard>
      )}
    </form>
  );
}

function ProviderField({ error, label, onChange, type = "text", value }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        className={inputClassName}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}
