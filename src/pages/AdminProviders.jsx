import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BadgeEuro,
  BriefcaseBusiness,
  CalendarDays,
  Euro,
  Mail,
  Phone,
  Search,
} from "lucide-react";

import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "../constants/admin";
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
  normalizeProviders,
  persistProviders,
} from "../services/providersService";
import { validateProvider } from "../validators/providerValidators";
import {
  loadAdminDataOnce,
  markAdminDataSaved,
  setAdminProviders,
} from "../services/adminDataStore";
import AdminTableSection from "../components/admin/AdminTableSection";
import AdminEntityActions from "../components/admin/AdminEntityActions";
import AdminEntityTabs from "../components/admin/AdminEntityTabs";
import AdminEmptyState from "../components/admin/AdminEmptyState";
import AdminPendingChangesActions from "../components/admin/AdminPendingChangesActions";
import Card from "../components/admin/Card";
import CardGrid from "../components/admin/CardGrid";
import AdminEditorDialog from "../components/admin/AdminEditorDialog";
import UnsavedChangesDialog from "../components/admin/UnsavedChangesDialog";
import ProviderForm from "../components/admin/providers/ProviderForm";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
} from "../components/admin/AdminMetricGrid";
import AdminPageShell from "../components/admin/AdminPageShell";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import {
  inputClassName,
  Label,
  selectClassName,
} from "../components/rsvp/FormPrimitives";
import Chip from "../components/ui/Chip";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import useIsMobileView from "../hooks/useIsMobileView";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useEffectiveSelection from "../hooks/useEffectiveSelection";
import useAdminActiveTab from "../hooks/useAdminActiveTab";
import useSpinner from "../hooks/useSpinner";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";
import { getEmailHref, getPhoneHref } from "../utils/contactLinks";

const desktopPageSize = 6;
const mobilePageSize = 1;
const ADMIN_PROVIDERS_ACTIVE_TAB_KEY = "adminProvidersActiveTab";
const getEntityId = (item) => item.id;

export default function AdminProviders() {
  const providersRef = useRef(null);
  const tableStartRef = useRef(null);
  const initialLoadStartedRef = useRef(false);
  const spinner = useSpinner();
  const isMobileView = useIsMobileView();
  const providersInView = useInView(providersRef, {
    once: true,
    amount: 0.1,
  });
  const isAuthenticated =
    window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [savedProviders, setSavedProviders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingProviderMode, setEditingProviderMode] = useState("provider");
  const [editingServiceId, setEditingServiceId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useAdminActiveTab(
    ADMIN_PROVIDERS_ACTIVE_TAB_KEY,
    "providers",
  );
  const [popup, setPopup] = useState({
    message: "",
    open: false,
    title: "",
    type: "success",
  });

  const loadProvidersData = useCallback(async () => {
    setLoadingProviders(true);

    try {
      const snapshot = await loadAdminDataOnce({ password: ADMIN_PASSWORD });
      const normalizedProviders = normalizeProviders(snapshot.providers || []);

      setSavedProviders(normalizedProviders);
      setProviders(normalizedProviders);
    } catch (error) {
      console.error(error);
      setPopup({
        message: adminContent.providers.dialogs.loadError,
        open: true,
        title: adminContent.providers.dialogs.problemTitle,
        type: "error",
      });
      setSavedProviders([]);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

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
  const {
    effectiveSelectedId: effectiveSelectedProviderId,
    selectedItem: selectedProvider,
  } = useEffectiveSelection({
    getId: getEntityId,
    items: pagedProviders,
    selectedId: selectedProviderId,
  });

  const services = useMemo(
    () => (selectedProvider ? getProviderServices([selectedProvider]) : []),
    [selectedProvider],
  );
  const filteredServices = useMemo(
    () => filterServices(services, { category, query }),
    [category, query, services],
  );
  const {
    currentPage: currentServicesPage,
    pageSize: servicesPageSize,
    pagedItems: pagedServices,
    totalPages: servicesTotalPages,
  } = usePagedData({
    desktopPageSize,
    items: filteredServices,
    mobilePageSize,
    page: servicesPage,
  });
  const {
    handlePageChange: handleServicesPageChange,
    pageDirection: servicesPageDirection,
  } = usePageTransition({
    currentPage: currentServicesPage,
    onPageChange: setServicesPage,
    totalPages: servicesTotalPages,
  });
  const {
    effectiveSelectedId: effectiveSelectedServiceId,
    selectedItem: selectedService,
  } = useEffectiveSelection({
    getId: getEntityId,
    items: pagedServices,
    selectedId: selectedServiceId,
  });
  const selectedServiceProvider =
    providers.find((provider) => provider.id === selectedService?.providerId) ||
    selectedProvider;
  const hasPendingChanges =
    JSON.stringify(savedProviders) !== JSON.stringify(providers);
  const stats = useMemo(() => buildProviderStats(providers), [providers]);

  const blocker = useUnsavedChangesNavigation(hasPendingChanges);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (initialLoadStartedRef.current) return;

    initialLoadStartedRef.current = true;
    loadProvidersData();
  }, [isAuthenticated, loadProvidersData]);

  const applyProviders = (nextProviders) => {
    setProviders(normalizeProviders(nextProviders));
  };
  const handleSavePendingChanges = async () => {
    try {
      spinner.show(adminContent.providers.spinner.save);
      const normalizedProviders = await persistProviders({
        password: ADMIN_PASSWORD,
        providers,
      });

      setAdminProviders(normalizedProviders);
      markAdminDataSaved({ providers: normalizedProviders });
      setSavedProviders(normalizedProviders);
      setProviders(normalizedProviders);
      return true;
    } catch (error) {
      console.error(error);
      setPopup({
        message: adminContent.providers.dialogs.saveError,
        open: true,
        title: adminContent.providers.dialogs.problemTitle,
        type: "error",
      });
      return false;
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
    if (!provider) return;

    setErrors({});
    setEditingProviderMode("provider");
    setEditingServiceId("");
    setEditingProvider(createEmptyProvider(provider));
  };
  const handleEditService = (service) => {
    if (!service) return;

    const provider = providers.find((item) => item.id === service.providerId);

    if (provider) {
      setErrors({});
      setEditingProviderMode("service");
      setEditingServiceId(service.id);
      setEditingProvider(createEmptyProvider(provider));
    }
  };
  const handleCreateProvider = () => {
    setErrors({});
    setEditingProviderMode("provider");
    setEditingServiceId("");
    setEditingProvider(createEmptyProvider());
  };
  const handleCreateService = () => {
    if (!selectedProvider) return;

    setErrors({});
    const nextService = createEmptyService();

    setEditingProviderMode("service");
    setEditingServiceId(nextService.id);
    setEditingProvider(
      createEmptyProvider({
        ...selectedProvider,
        services: [...selectedProvider.services, nextService],
      }),
    );
  };
  const handleDeleteProvider = () => {
    if (!deleteTarget) return;

    applyProviders(
      providers.filter((provider) => provider.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  };
  const handleCancelBlockedNavigation = () => {
    blocker.reset?.();
  };
  const handleConfirmBlockedNavigation = () => {
    blocker.proceed?.();
  };
  const handleSaveAndExitBlockedNavigation = async () => {
    const saved = await handleSavePendingChanges();

    if (saved) {
      blocker.proceed?.();
      return;
    }

    blocker.reset?.();
  };
  const handleSubmitProvider = (event) => {
    event.preventDefault();

    const validationErrors =
      editingProviderMode === "provider"
        ? validateProvider({ ...editingProvider, services: [] })
        : validateProvider(editingProvider);

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
      services: current.services.filter((_, index) => index !== serviceIndex),
    }));
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      {blocker.state === "blocked" && (
        <UnsavedProviderChangesDialog
          changes={buildPendingProviderChanges(savedProviders, providers)}
          onCancel={handleCancelBlockedNavigation}
          onConfirm={handleConfirmBlockedNavigation}
          onSaveAndExit={handleSaveAndExitBlockedNavigation}
        />
      )}

      <AdminPageShell
        header={adminContent.providers.header}
        isMobileView={isMobileView}
        isVisible={providersInView}
        rootRef={providersRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={providersInView}>
          <ProvidersOverview loading={loadingProviders} stats={stats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={providersInView}>
          <AdminPendingChangesActions
            discardLabel={adminContent.providers.actions.discardChanges}
            hasPendingChanges={hasPendingChanges}
            onDiscard={handleDiscardPendingChanges}
            onSave={handleSavePendingChanges}
            saveLabel={adminContent.providers.actions.saveChanges}
            saving={spinner.loading}
            showText={!isMobileView}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={providersInView}>
          <AdminEntityTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={adminContent.providers.tabs}
          >
            {activeTab === "providers" ? (
              <AdminTableSection
                actions={
                  <ProviderTableActions
                    hasPendingChanges={hasPendingChanges}
                    onCreate={handleCreateProvider}
                    onDelete={() => setDeleteTarget(selectedProvider)}
                    onDiscard={handleDiscardPendingChanges}
                    onEdit={() => handleEditProvider(selectedProvider)}
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
                      setServicesPage(1);
                    }}
                    onQueryChange={(value) => {
                      setQuery(value);
                      setPage(1);
                      setServicesPage(1);
                    }}
                    query={query}
                  />
                }
                getKey={(provider) => provider.id}
                isMobileView={isMobileView}
                items={filteredProviders}
                loading={loadingProviders}
                lockPageHeight={false}
                mobilePageLabel={adminContent.providers.list.mobilePageLabel}
                onNextPage={() =>
                  handlePageChange(currentPage + 1, tableStartRef.current)
                }
                onPrevPage={() =>
                  handlePageChange(currentPage - 1, tableStartRef.current)
                }
                page={loadingProviders ? undefined : currentPage}
                pageDirection={pageDirection}
                pageLabel={adminContent.providers.list.pageLabel}
                pageSize={loadingProviders ? undefined : pageSize}
                renderMeasurePage={(items) => (
                  <ProviderCardsPage
                    emptyState={getProviderEmptyState(providers.length)}
                    items={items}
                    onSelect={() => {}}
                    selectedProviderId={effectiveSelectedProviderId}
                  />
                )}
                renderPage={(items) => (
                  <ProviderCardsPage
                    emptyState={getProviderEmptyState(providers.length)}
                    items={items}
                    onSelect={(provider) => {
                      setSelectedProviderId(provider.id);
                      setServicesPage(1);
                      setSelectedServiceId("");
                    }}
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
                sourceItemsCount={providers.length}
                title={adminContent.providers.list.title}
                totalPages={loadingProviders ? undefined : totalPages}
              />
            ) : (
              <AdminTableSection
                actions={
                  hasPendingChanges ||
                  filteredServices.length ||
                  selectedProvider ? (
                    <ProviderTableActions
                      hasPendingChanges={hasPendingChanges}
                      onCreate={selectedProvider ? handleCreateService : null}
                      onDelete={() =>
                        selectedService &&
                        setDeleteTarget(selectedServiceProvider)
                      }
                      onDiscard={handleDiscardPendingChanges}
                      onEdit={() => handleEditService(selectedService)}
                      onSave={handleSavePendingChanges}
                      providers={filteredServices}
                      saving={spinner.loading}
                      selectedProvider={selectedService}
                      showText={!isMobileView}
                    />
                  ) : null
                }
                contentRef={tableStartRef}
                eyebrow={adminContent.providers.services.eyebrow}
                filters={
                  <ProviderFilters
                    category={category}
                    onCategoryChange={(value) => {
                      setCategory(value);
                      setPage(1);
                      setServicesPage(1);
                    }}
                    onQueryChange={(value) => {
                      setQuery(value);
                      setPage(1);
                      setServicesPage(1);
                    }}
                    query={query}
                  />
                }
                getKey={(service) => service.id}
                isMobileView={isMobileView}
                items={filteredServices}
                loading={loadingProviders}
                lockPageHeight={false}
                mobilePageLabel={
                  adminContent.providers.services.mobilePageLabel
                }
                onNextPage={() =>
                  handleServicesPageChange(
                    currentServicesPage + 1,
                    tableStartRef.current,
                  )
                }
                onPrevPage={() =>
                  handleServicesPageChange(
                    currentServicesPage - 1,
                    tableStartRef.current,
                  )
                }
                page={loadingProviders ? undefined : currentServicesPage}
                pageDirection={servicesPageDirection}
                pageLabel={adminContent.providers.list.pageLabel}
                pageSize={loadingProviders ? undefined : servicesPageSize}
                renderMeasurePage={(items) => (
                  <ServiceCardsPage
                    emptyState={getServiceEmptyState(
                      providers.length,
                      services.length,
                    )}
                    items={items}
                    onSelect={() => {}}
                    selectedServiceId={effectiveSelectedServiceId}
                  />
                )}
                renderPage={(items) => (
                  <ServiceCardsPage
                    emptyState={getServiceEmptyState(
                      providers.length,
                      services.length,
                    )}
                    items={items}
                    onSelect={(service) => setSelectedServiceId(service.id)}
                    selectedServiceId={effectiveSelectedServiceId}
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
                sourceItemsCount={services.length}
                title={adminContent.providers.services.title}
                totalPages={loadingProviders ? undefined : servicesTotalPages}
              />
            )}
          </AdminEntityTabs>
        </CinematicStaggeredRevealItem>
      </AdminPageShell>

      {editingProvider && (
        <AdminEditorDialog
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
            mode={editingProviderMode}
            onAddService={handleAddService}
            onChange={handleProviderChange}
            onPaymentChange={handlePaymentChange}
            onRemoveService={handleRemoveService}
            onServiceChange={handleServiceChange}
            onSubmit={handleSubmitProvider}
            selectedServiceId={editingServiceId}
          />
        </AdminEditorDialog>
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

function UnsavedProviderChangesDialog({
  changes,
  onCancel,
  onConfirm,
  onSaveAndExit,
}) {
  return (
    <UnsavedChangesDialog
      changes={changes}
      labels={{
        eyebrow: adminContent.providers.dialogs.warningEyebrow,
        exitWithoutSaving: adminContent.tables.dialogs.exitWithoutSaving,
        keepEditing: adminContent.tables.dialogs.keepEditing,
        saveAndExit: adminContent.tables.dialogs.saveAndExit,
        text: adminContent.providers.dialogs.unsavedText,
        title: adminContent.tables.dialogs.unsavedTitle,
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onSaveAndExit={onSaveAndExit}
      titleId="unsaved-provider-changes-title"
    />
  );
}

function ProvidersOverview({ loading, stats }) {
  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-2">
        {adminContent.providers.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.providers.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
          count={4}
        />
      ) : (
        <AdminMetricGrid
          className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
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
      )}
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
  onSave,
  providers,
  saving,
  selectedProvider,
  showText,
}) {
  return (
    <AdminEntityActions
      addLabel={adminContent.providers.actions.add}
      deleteLabel={adminContent.providers.actions.delete}
      discardLabel={adminContent.providers.actions.discardChanges}
      editLabel={adminContent.providers.actions.edit}
      hasItems={providers.length > 0}
      hasPendingChanges={hasPendingChanges}
      onCreate={onCreate}
      onDelete={onDelete}
      onDiscard={onDiscard}
      onEdit={onEdit}
      onSave={onSave}
      saveLabel={adminContent.providers.actions.saveChanges}
      saving={saving}
      selectedItem={selectedProvider}
      showText={showText}
    />
  );
}

function ProviderCardsPage({
  emptyState,
  items,
  onSelect,
  selectedProviderId,
}) {
  if (!items.length) return <ProvidersEmptyState {...emptyState} />;

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
          {provider.web && <Chip className="col-span-2" value={provider.web} />}
        </div>
      </Card>
    </div>
  );
}

function ProvidersEmptyState({
  text = adminContent.providers.list.emptyText,
  title = adminContent.providers.list.emptyTitle,
}) {
  return <AdminEmptyState icon={BriefcaseBusiness} text={text} title={title} />;
}

function ServiceCardsPage({ emptyState, items, onSelect, selectedServiceId }) {
  if (!items.length) return <ServicesEmptyState {...emptyState} />;

  return (
    <>
      <CardGrid
        className="hidden gap-4 md:grid lg:grid-cols-2"
        getKey={(service) => service.id}
        items={items}
        renderCard={(service) => (
          <ServiceCard
            onSelect={onSelect}
            selected={service.id === selectedServiceId}
            service={service}
          />
        )}
      />
      <div className="grid gap-4 md:hidden">
        {items.map((service) => (
          <ServiceCard
            key={service.id}
            onSelect={onSelect}
            selected={service.id === selectedServiceId}
            service={service}
          />
        ))}
      </div>
    </>
  );
}

function ServiceCard({ onSelect, selected, service }) {
  const paid = service.payments.reduce(
    (total, payment) =>
      total + (payment.paid ? Number(payment.amount) || 0 : 0),
    0,
  );

  return (
    <div
      className={`h-full rounded-[2rem] transition ${
        selected
          ? "ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]"
          : "ring-0"
      }`}
      onClick={() => onSelect(service)}
    >
      <Card
        decorativeText={service.paymentCount}
        eyebrow={service.providerName}
        title={service.name || "Servicio sin nombre"}
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Chip
            className="col-span-2"
            icon={<BriefcaseBusiness size={13} strokeWidth={1.8} />}
            strong
            value={PROVIDER_CATEGORY_LABELS[service.category]}
          />
          <Chip
            icon={<Euro size={13} strokeWidth={1.8} />}
            strong
            value={formatCurrency(service.price)}
          />
          <Chip
            icon={<CalendarDays size={13} strokeWidth={1.8} />}
            value={`${service.paymentCount} ${
              service.paymentCount === 1 ? "plazo" : "plazos"
            }`}
          />
          <Chip
            className="col-span-2"
            icon={<BadgeEuro size={13} strokeWidth={1.8} />}
            value={`Pagado: ${formatCurrency(paid)}`}
          />
        </div>
      </Card>
    </div>
  );
}

function ServicesEmptyState({
  text = adminContent.providers.services.emptyText,
  title = adminContent.providers.services.emptyTitle,
}) {
  return <AdminEmptyState icon={BadgeEuro} text={text} title={title} />;
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

    return (
      matchesCategory &&
      (!normalizedQuery || searchableText.includes(normalizedQuery))
    );
  });
}

function getProviderServices(providers) {
  return providers.flatMap((provider) =>
    provider.services.map((service) => ({
      ...service,
      category: provider.category,
      providerId: provider.id,
      providerName: provider.name || "Proveedor sin nombre",
    })),
  );
}

function filterServices(services, { category, query }) {
  const normalizedQuery = query.trim().toLowerCase();

  return services.filter((service) => {
    const matchesCategory = !category || service.category === category;
    const searchableText = [
      service.name,
      service.providerName,
      PROVIDER_CATEGORY_LABELS[service.category],
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesCategory &&
      (!normalizedQuery || searchableText.includes(normalizedQuery))
    );
  });
}

function getProviderEmptyState(sourceCount) {
  if (sourceCount > 0) {
    return {
      text: adminContent.providers.list.noFilterText,
      title: adminContent.providers.list.emptyTitle,
    };
  }

  return {
    text: adminContent.providers.list.emptyText,
    title: adminContent.providers.list.emptyTitle,
  };
}

function getServiceEmptyState(providerCount, serviceCount) {
  if (providerCount === 0) {
    return {
      text: adminContent.providers.services.noProvidersText,
      title: adminContent.providers.services.noProvidersTitle,
    };
  }

  if (serviceCount > 0) {
    return {
      text: adminContent.providers.services.noFilterText,
      title: adminContent.providers.services.emptyTitle,
    };
  }

  return {
    text: adminContent.providers.services.emptyText,
    title: adminContent.providers.services.emptyTitle,
  };
}

function buildPendingProviderChanges(savedProviders, currentProviders) {
  const savedById = new Map(
    savedProviders.map((provider) => [provider.id, provider]),
  );
  const currentById = new Map(
    currentProviders.map((provider) => [provider.id, provider]),
  );
  const changes = [];

  currentById.forEach((provider, providerId) => {
    const savedProvider = savedById.get(providerId);

    if (!savedProvider) {
      changes.push(`Proveedor creado: ${provider.name || "sin nombre"}`);
      return;
    }

    if (JSON.stringify(savedProvider) !== JSON.stringify(provider)) {
      changes.push(`Proveedor modificado: ${provider.name || "sin nombre"}`);
    }
  });

  savedById.forEach((provider, providerId) => {
    if (!currentById.has(providerId)) {
      changes.push(`Proveedor eliminado: ${provider.name || "sin nombre"}`);
    }
  });

  return changes.length ? changes : ["Cambios pendientes en proveedores"];
}

function upsertProvider(providers, provider) {
  const exists = providers.some((item) => item.id === provider.id);

  if (!exists) return normalizeProviders([...providers, provider]);

  return normalizeProviders(
    providers.map((item) => (item.id === provider.id ? provider : item)),
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value) || 0);
}
