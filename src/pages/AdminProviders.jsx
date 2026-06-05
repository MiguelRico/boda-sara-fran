import { useInView } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BadgeEuro,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  Euro,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";

import { ADMIN_SESSION_KEY } from "../constants/admin";
import { adminContent } from "../constants/adminContent";
import {
  PROVIDER_CATEGORIES,
  PROVIDER_CATEGORY_LABELS,
} from "../constants/providers";
import {
  createEmptyProvider,
  createEmptyService,
  getProviderPaidTotal,
  getProviderTotal,
  loadProviders,
  normalizeProviders,
  persistProviders,
  validateProvider,
} from "../services/providersService";
import AdminTableSection from "../components/admin/AdminTableSection";
import Card from "../components/admin/Card";
import CardActions from "../components/admin/CardActions";
import CardGrid from "../components/admin/CardGrid";
import EditorDialog from "../components/admin/EditorDialog";
import {
  AdminMetricGrid,
} from "../components/admin/AdminMetricGrid";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import {
  FieldError,
  FormCard,
  inputClassName,
  Label,
  selectClassName,
} from "../components/rsvp/FormPrimitives";
import Chip from "../components/ui/Chip";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import DeleteDialog from "../components/ui/DeleteDialog";
import HeaderSection from "../components/ui/HeaderSection";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import useIsMobileView from "../hooks/useIsMobileView";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useSpinner from "../hooks/useSpinner";
import { downloadCsv } from "../utils/csvExport";
import { getEmailHref, getPhoneHref } from "../utils/contactLinks";

const desktopPageSize = 6;
const mobilePageSize = 1;

export default function AdminProviders() {
  const providersRef = useRef(null);
  const tableStartRef = useRef(null);
  const spinner = useSpinner();
  const isMobileView = useIsMobileView();
  const providersInView = useInView(providersRef, {
    once: true,
    amount: 0.1,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [savedProviders, setSavedProviders] = useState(() => loadProviders());
  const [providers, setProviders] = useState(savedProviders);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [editingProvider, setEditingProvider] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState({
    message: "",
    open: false,
    title: "",
    type: "success",
  });

  const filteredProviders = useMemo(
    () => filterProviders(providers, { category, query }),
    [category, providers, query],
  );
  const {
    currentPage,
    pageSize,
    pagedItems: pagedProviders,
    totalPages,
  } = usePagedData({
    desktopPageSize,
    items: filteredProviders,
    mobilePageSize,
    page,
  });
  const { handlePageChange, pageDirection } = usePageTransition({
    currentPage,
    onPageChange: setPage,
    totalPages,
  });
  const effectiveSelectedProviderId = pagedProviders.some(
    (provider) => provider.id === selectedProviderId,
  )
    ? selectedProviderId
    : pagedProviders[0]?.id || "";
  const selectedProvider =
    pagedProviders.find(
      (provider) => provider.id === effectiveSelectedProviderId,
    ) || null;
  const hasPendingChanges =
    JSON.stringify(savedProviders) !== JSON.stringify(providers);
  const stats = useMemo(() => buildProviderStats(providers), [providers]);

  const applyProviders = (nextProviders) => {
    setProviders(normalizeProviders(nextProviders));
  };
  const handleSavePendingChanges = async () => {
    try {
      spinner.show(adminContent.providers.spinner.save);
      const normalizedProviders = persistProviders(providers);

      setSavedProviders(normalizedProviders);
      setProviders(normalizedProviders);
    } catch (error) {
      console.error(error);
      setPopup({
        message: adminContent.providers.dialogs.saveError,
        open: true,
        title: adminContent.providers.dialogs.problemTitle,
        type: "error",
      });
    } finally {
      spinner.hide();
    }
  };
  const handleDiscardPendingChanges = () => {
    setProviders(savedProviders);
    setEditingProvider(null);
    setDeleteTarget(null);
  };
  const handleEditProvider = (provider) => {
    setErrors({});
    setEditingProvider(createEmptyProvider(provider));
  };
  const handleCreateProvider = () => {
    setErrors({});
    setEditingProvider(createEmptyProvider());
  };
  const handleDeleteProvider = () => {
    if (!deleteTarget) return;

    applyProviders(providers.filter((provider) => provider.id !== deleteTarget.id));
    setDeleteTarget(null);
  };
  const handleSubmitProvider = (event) => {
    event.preventDefault();

    const validationErrors = validateProvider(editingProvider);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    applyProviders(upsertProvider(providers, editingProvider));
    setEditingProvider(null);
  };
  const handleProviderChange = (field, value) => {
    setEditingProvider((current) => ({
      ...current,
      [field]: value,
    }));
  };
  const handleServiceChange = (serviceIndex, field, value) => {
    setEditingProvider((current) => ({
      ...current,
      services: current.services.map((service, index) =>
        index === serviceIndex ? { ...service, [field]: value } : service,
      ),
    }));
  };
  const handlePaymentChange = (serviceIndex, paymentIndex, field, value) => {
    setEditingProvider((current) => ({
      ...current,
      services: current.services.map((service, index) =>
        index === serviceIndex
          ? {
              ...service,
              payments: service.payments.map((payment, itemIndex) =>
                itemIndex === paymentIndex
                  ? { ...payment, [field]: value }
                  : payment,
              ),
            }
          : service,
      ),
    }));
  };
  const handleAddService = () => {
    setEditingProvider((current) => ({
      ...current,
      services: [...current.services, createEmptyService()],
    }));
  };
  const handleRemoveService = (serviceIndex) => {
    setEditingProvider((current) => ({
      ...current,
      services:
        current.services.length === 1
          ? current.services
          : current.services.filter((_, index) => index !== serviceIndex),
    }));
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <CinematicSection
        className="surface-soft"
        innerClassName="max-w-6xl py-6"
        reveal={false}
      >
        <div ref={providersRef}>
          <CinematicStaggeredRevealItem index={0} isVisible={providersInView}>
            <HeaderSection
              eyebrow={adminContent.providers.header.eyebrow}
              isMobileView={isMobileView}
              title={adminContent.providers.header.title}
              titleAs="h1"
              text={adminContent.providers.header.text}
            />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={2} isVisible={providersInView}>
            <ProvidersOverview stats={stats} />
          </CinematicStaggeredRevealItem>

          <CinematicStaggeredRevealItem index={3} isVisible={providersInView}>
            <AdminTableSection
              actions={
                <ProviderTableActions
                  hasPendingChanges={hasPendingChanges}
                  onCreate={handleCreateProvider}
                  onDelete={() => setDeleteTarget(selectedProvider)}
                  onDiscard={handleDiscardPendingChanges}
                  onEdit={() => handleEditProvider(selectedProvider)}
                  onExport={() => downloadProvidersCsv(providers)}
                  onSave={handleSavePendingChanges}
                  providers={providers}
                  saving={spinner.loading}
                  selectedProvider={selectedProvider}
                  showText={!isMobileView}
                />
              }
              contentRef={tableStartRef}
              eyebrow={adminContent.providers.list.eyebrow}
              filters={
                <ProviderFilters
                  category={category}
                  onCategoryChange={(value) => {
                    setCategory(value);
                    setPage(1);
                  }}
                  onQueryChange={(value) => {
                    setQuery(value);
                    setPage(1);
                  }}
                  query={query}
                />
              }
              getKey={(provider) => provider.id}
              isMobileView={isMobileView}
              items={filteredProviders}
              lockPageHeight={false}
              mobilePageLabel={adminContent.providers.list.mobilePageLabel}
              onNextPage={() =>
                handlePageChange(currentPage + 1, tableStartRef.current)
              }
              onPrevPage={() =>
                handlePageChange(currentPage - 1, tableStartRef.current)
              }
              page={currentPage}
              pageDirection={pageDirection}
              pageLabel={adminContent.providers.list.pageLabel}
              pageSize={pageSize}
              renderMeasurePage={(items) => (
                <ProviderCardsPage
                  items={items}
                  onSelect={() => {}}
                  selectedProviderId={effectiveSelectedProviderId}
                />
              )}
              renderPage={(items) => (
                <ProviderCardsPage
                  items={items}
                  onSelect={(provider) => setSelectedProviderId(provider.id)}
                  selectedProviderId={effectiveSelectedProviderId}
                />
              )}
              skeletonConfig={{
                content: {
                  columnsClassName: "lg:grid-cols-2",
                  itemClassName: "min-h-40",
                  lines: 3,
                },
                filters: true,
              }}
              title={adminContent.providers.list.title}
              totalPages={totalPages}
            />
          </CinematicStaggeredRevealItem>
        </div>
      </CinematicSection>

      {editingProvider && (
        <EditorDialog
          onClose={() => setEditingProvider(null)}
          title={
            providers.some((provider) => provider.id === editingProvider.id)
              ? adminContent.providers.dialogs.editTitle
              : adminContent.providers.dialogs.createTitle
          }
          titleId="provider-editor-title"
        >
          <ProviderForm
            errors={errors}
            form={editingProvider}
            loading={spinner.loading}
            onAddService={handleAddService}
            onChange={handleProviderChange}
            onPaymentChange={handlePaymentChange}
            onRemoveService={handleRemoveService}
            onServiceChange={handleServiceChange}
            onSubmit={handleSubmitProvider}
          />
        </EditorDialog>
      )}

      {deleteTarget && (
        <DeleteDialog
          message={adminContent.providers.dialogs.deleteMessage(
            deleteTarget.name,
          )}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteProvider}
          title={adminContent.providers.dialogs.deleteTitle}
        />
      )}

      <StatusDialog
        eyebrow={adminContent.providers.dialogs.warningEyebrow}
        message={popup.message}
        onClose={() => setPopup((current) => ({ ...current, open: false }))}
        open={popup.open}
        title={popup.title}
        type={popup.type}
      />
    </CinematicPage>
  );
}

function ProvidersOverview({ stats }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-2">
        {adminContent.providers.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-4xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.providers.overview.title}
      </h2>
      <AdminMetricGrid
        className="flex flex-wrap justify-between gap-2 sm:items-start sm:gap-3"
        items={[
          {
            emoji: <BriefcaseBusiness size={22} strokeWidth={1.8} />,
            label: adminContent.providers.overview.metrics.providers,
            value: stats.providerCount,
          },
          {
            emoji: <BadgeEuro size={22} strokeWidth={1.8} />,
            label: adminContent.providers.overview.metrics.services,
            value: stats.serviceCount,
          },
          {
            emoji: <Euro size={22} strokeWidth={1.8} />,
            label: adminContent.providers.overview.metrics.budget,
            value: formatCurrency(stats.totalBudget),
          },
          {
            emoji: <CalendarDays size={22} strokeWidth={1.8} />,
            label: adminContent.providers.overview.metrics.paid,
            value: formatCurrency(stats.totalPaid),
          },
        ]}
      />
    </section>
  );
}

function ProviderFilters({ category, onCategoryChange, onQueryChange, query }) {
  const selectedCategory = PROVIDER_CATEGORIES.find(
    (item) => item.value === category,
  );
  const activeFilters = [
    query.trim()
      ? { key: "query", label: query.trim(), onRemove: () => onQueryChange("") }
      : null,
    selectedCategory
      ? {
          key: "category",
          label: selectedCategory.label,
          onRemove: () => onCategoryChange(""),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      title={adminContent.providers.filters.eyebrow}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <Label>{adminContent.providers.filters.searchLabel}</Label>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)]"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className={`${inputClassName} pl-12`}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={adminContent.providers.filters.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div>
          <Label>{adminContent.providers.filters.categoryLabel}</Label>
          <select
            className={selectClassName}
            onChange={(event) => onCategoryChange(event.target.value)}
            value={category}
          >
            <option value="">
              {adminContent.providers.filters.allCategories}
            </option>
            {PROVIDER_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

function ProviderTableActions({
  hasPendingChanges,
  onCreate,
  onDelete,
  onDiscard,
  onEdit,
  onExport,
  onSave,
  providers,
  saving,
  selectedProvider,
  showText,
}) {
  return (
    <div className="grid w-full gap-3">
      <div className="grid w-full grid-cols-2 gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-3">
        <IconButton
          className="w-full"
          disabled={!hasPendingChanges}
          icon={<Undo2 size={16} strokeWidth={1.8} />}
          label={adminContent.providers.actions.discardChanges}
          onClick={onDiscard}
          showText={showText ? "always" : undefined}
          tone="secondary"
          type="button"
        >
          {showText ? adminContent.providers.actions.discardChanges : undefined}
        </IconButton>
        <IconButton
          className="w-full"
          disabled={!hasPendingChanges || saving}
          icon={<Save size={16} strokeWidth={1.8} />}
          label={adminContent.providers.actions.saveChanges}
          onClick={onSave}
          showText={showText ? "always" : undefined}
          tone="primary"
          type="button"
        >
          {showText ? adminContent.providers.actions.saveChanges : undefined}
        </IconButton>
      </div>

      <div className="grid w-full grid-cols-4 gap-3 sm:w-auto sm:grid-cols-4">
        <IconButton
          className="w-full"
          disabled={!providers.length}
          icon={<Download size={16} strokeWidth={1.8} />}
          label={adminContent.providers.actions.export}
          onClick={onExport}
          tone="terciary"
          type="button"
        >
          {showText ? adminContent.providers.actions.export : undefined}
        </IconButton>
        <CardActions
          className="contents"
          deleteLabel={adminContent.providers.actions.delete}
          editLabel={adminContent.providers.actions.edit}
          item={selectedProvider}
          onDelete={selectedProvider ? onDelete : null}
          onEdit={selectedProvider ? onEdit : null}
          showText={showText}
        />
        <IconButton
          className="w-full"
          icon={<Plus size={18} strokeWidth={2.4} />}
          label={adminContent.providers.actions.add}
          onClick={onCreate}
          tone="primary"
          type="button"
        >
          {showText ? adminContent.providers.actions.add : undefined}
        </IconButton>
      </div>
    </div>
  );
}

function ProviderCardsPage({ items, onSelect, selectedProviderId }) {
  if (!items.length) return <ProvidersEmptyState />;

  return (
    <>
      <CardGrid
        className="hidden gap-4 md:grid lg:grid-cols-2"
        getKey={(provider) => provider.id}
        items={items}
        renderCard={(provider) => (
          <ProviderCard
            onSelect={onSelect}
            provider={provider}
            selected={provider.id === selectedProviderId}
          />
        )}
      />
      <div className="grid gap-4 md:hidden">
        {items.map((provider) => (
          <ProviderCard
            key={provider.id}
            onSelect={onSelect}
            provider={provider}
            selected={provider.id === selectedProviderId}
          />
        ))}
      </div>
    </>
  );
}

function ProviderCard({ onSelect, provider, selected }) {
  const total = getProviderTotal(provider);
  const paid = getProviderPaidTotal(provider);

  return (
    <div
      className={`h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(provider)}
    >
      <Card
        decorativeText={provider.services.length}
        eyebrow={PROVIDER_CATEGORY_LABELS[provider.category]}
        title={provider.name || "Proveedor sin nombre"}
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Chip
            className="col-span-2"
            href={getEmailHref(provider.email)}
            icon={<Mail size={13} strokeWidth={1.8} />}
            tone="secondary"
            value={provider.email || "-"}
          />
          <Chip
            href={getPhoneHref(provider.phone)}
            icon={<Phone size={13} strokeWidth={1.8} />}
            tone="secondary"
            value={provider.phone || "-"}
          />
          <Chip
            icon={<BriefcaseBusiness size={13} strokeWidth={1.8} />}
            strong
            value={`${provider.services.length} servicios`}
          />
          <Chip
            icon={<Euro size={13} strokeWidth={1.8} />}
            strong
            value={formatCurrency(total)}
          />
          <Chip
            icon={<CalendarDays size={13} strokeWidth={1.8} />}
            value={`Pagado: ${formatCurrency(paid)}`}
          />
          {provider.web && (
            <Chip className="col-span-2" value={provider.web} />
          )}
        </div>
      </Card>
    </div>
  );
}

function ProvidersEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-6 text-center sm:p-8">
      <BriefcaseBusiness
        className="mx-auto text-[var(--color-accent-dark)]"
        size={28}
        strokeWidth={1.7}
      />
      <p className="mt-4 font-serif text-3xl text-[var(--color-accent-dark)]">
        {adminContent.providers.list.emptyTitle}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {adminContent.providers.list.emptyText}
      </p>
    </div>
  );
}

function ProviderForm({
  errors,
  form,
  loading,
  onAddService,
  onChange,
  onPaymentChange,
  onRemoveService,
  onServiceChange,
  onSubmit,
}) {
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
      </FormCard>

      <FormCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">
              {adminContent.providers.form.servicesTitle}
            </p>
            <h3 className="font-serif text-3xl text-[var(--color-accent-dark)]">
              {form.services.length} servicios
            </h3>
          </div>
          <IconButton
            icon={<Plus size={16} strokeWidth={1.8} />}
            label={adminContent.providers.form.addService}
            onClick={onAddService}
            tone="secondary"
            type="button"
          />
        </div>

        <div className="mt-5 grid gap-4">
          {form.services.map((service, serviceIndex) => (
            <div
              className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4"
              key={service.id}
            >
              <div className="grid gap-4 md:grid-cols-[1fr_10rem_auto] md:items-end">
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
                {form.services.length > 1 && (
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
                {service.payments.map((payment, paymentIndex) => (
                  <div
                    className="rounded-2xl border border-[var(--color-border)] bg-white/50 p-3"
                    key={paymentIndex}
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
                    <label className="mt-3 flex items-center gap-2 text-sm text-[var(--color-accent-dark)]">
                      <input
                        checked={payment.paid}
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
                      Pagado
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FormCard>
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

function buildProviderStats(providers) {
  return providers.reduce(
    (stats, provider) => ({
      providerCount: stats.providerCount + 1,
      serviceCount: stats.serviceCount + provider.services.length,
      totalBudget: stats.totalBudget + getProviderTotal(provider),
      totalPaid: stats.totalPaid + getProviderPaidTotal(provider),
    }),
    {
      providerCount: 0,
      serviceCount: 0,
      totalBudget: 0,
      totalPaid: 0,
    },
  );
}

function filterProviders(providers, { category, query }) {
  const normalizedQuery = query.trim().toLowerCase();

  return providers.filter((provider) => {
    const matchesCategory = !category || provider.category === category;
    const searchableText = [
      provider.name,
      provider.email,
      provider.phone,
      PROVIDER_CATEGORY_LABELS[provider.category],
      ...provider.services.map((service) => service.name),
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
}

function upsertProvider(providers, provider) {
  const exists = providers.some((item) => item.id === provider.id);

  if (!exists) return normalizeProviders([...providers, provider]);

  return normalizeProviders(
    providers.map((item) => (item.id === provider.id ? provider : item)),
  );
}

function downloadProvidersCsv(providers) {
  downloadCsv({
    filename: "proveedores.csv",
    headers: [
      "nombre",
      "categoria",
      "telefono",
      "email",
      "direccion",
      "web",
      "numero_cuenta",
      "servicios",
      "presupuesto",
      "pagado",
    ],
    rows: providers.map((provider) => [
      provider.name,
      PROVIDER_CATEGORY_LABELS[provider.category],
      provider.phone,
      provider.email,
      provider.address,
      provider.web,
      provider.accountNumber,
      provider.services.map((service) => service.name).join(" | "),
      getProviderTotal(provider),
      getProviderPaidTotal(provider),
    ]),
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value) || 0);
}
