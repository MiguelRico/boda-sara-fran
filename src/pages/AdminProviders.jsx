import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { ADMIN_PASSWORD } from "../constants/admin";
import { adminContent } from "../constants/adminContent";
import {
  PROVIDER_CATEGORIES,
  PROVIDER_CATEGORY_LABELS,
} from "../constants/providers";
import {
  buildProviderStats,
  buildPendingProviderChanges,
  createEmptyProvider,
  createEmptyService,
  isServicePaid,
  normalizeProviders,
  persistProviders,
} from "../services/providersService";
import { validateProvider } from "../validators/providerValidators";
import {
  loadAdminDataOnce,
  markAdminDataSaved,
  setAdminProviders,
} from "../services/adminDataStore";
import {
  AdminEntityTabs,
  AdminPageShell,
  AdminPendingChangesActions,
  AdminTableSection,
  EditorDialog as AdminEditorDialog,
  UnsavedChangesDialog,
} from "../components/admin/common";
import {
  ProviderCardsPage,
  ServiceCardsPage,
  ProviderForm,
  ProviderTotalsPanel,
} from "../components/admin/providers";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import {
  inputClassName,
  Label,
  selectClassName,
} from "../components/rsvp/FormPrimitives";
import CollapsiblePanel from "../components/ui/CollapsiblePanel";
import DeleteDialog from "../components/ui/DeleteDialog";
import IconButton from "../components/ui/IconButton";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import useIsMobileView from "../hooks/useIsMobileView";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useEffectiveSelection from "../hooks/useEffectiveSelection";
import useAdminActiveTab from "../hooks/useAdminActiveTab";
import useSpinner from "../hooks/useSpinner";
import useUnsavedChangesNavigation from "../hooks/useUnsavedChangesNavigation";
import { storageKeys } from "../config/storageKeys";
import { isAdminSessionAuthenticated } from "../utils/adminSession";

const ADMIN_PAGE_SIZE = 1;
const ADMIN_PROVIDERS_ACTIVE_TAB_KEY = storageKeys.adminActiveTabs.providers;
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
  const isAuthenticated = isAdminSessionAuthenticated();
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [savedProviders, setSavedProviders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerQuery, setProviderQuery] = useState("");
  const [providerCategory, setProviderCategory] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [servicePaymentStatus, setServicePaymentStatus] = useState("");
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
    () =>
      filterProviders(providers, {
        category: providerCategory,
        query: providerQuery,
      }),
    [providerCategory, providerQuery, providers],
  );
  const {
    currentPage,
    pageSize: providerPageSize,
    pagedItems: pagedProviders,
    totalPages,
  } = usePagedData({
    items: filteredProviders,
    page,
    pageSize: ADMIN_PAGE_SIZE,
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
    allItems: filteredProviders,
    currentPage,
    getId: getEntityId,
    items: pagedProviders,
    onPageChange: setPage,
    pageSize: providerPageSize,
    selectedId: selectedProviderId,
  });

  const services = useMemo(
    () => (selectedProvider ? getProviderServices([selectedProvider]) : []),
    [selectedProvider],
  );
  const filteredServices = useMemo(
    () =>
      filterServices(services, {
        paymentStatus: servicePaymentStatus,
        query: serviceQuery,
      }),
    [servicePaymentStatus, serviceQuery, services],
  );
  const {
    currentPage: currentServicesPage,
    pageSize: servicesPageSize,
    pagedItems: pagedServices,
    totalPages: servicesTotalPages,
  } = usePagedData({
    items: filteredServices,
    page: servicesPage,
    pageSize: ADMIN_PAGE_SIZE,
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
  } = useEffectiveSelection({
    allItems: filteredServices,
    currentPage: currentServicesPage,
    getId: getEntityId,
    items: pagedServices,
    onPageChange: setServicesPage,
    pageSize: servicesPageSize,
    selectedId: selectedServiceId,
  });
  const pendingChanges = useMemo(
    () => buildPendingProviderChanges(savedProviders, providers),
    [providers, savedProviders],
  );
  const hasPendingChanges = pendingChanges.length > 0;
  const stats = useMemo(() => buildProviderStats(providers), [providers]);

  const blocker = useUnsavedChangesNavigation(hasPendingChanges);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (initialLoadStartedRef.current) return;

    initialLoadStartedRef.current = true;
    loadProvidersData();
  }, [isAuthenticated, loadProvidersData]);

  const applyProviders = (nextProviders) => {
    const normalizedProviders = normalizeProviders(nextProviders);

    setProviders(normalizedProviders);
    setAdminProviders(normalizedProviders);
  };
  const handleSavePendingChanges = async () => {
    if (!hasPendingChanges) return true;

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
    setAdminProviders(savedProviders);
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
  const handleDeleteTarget = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "service") {
      applyProviders(
        providers.map((provider) =>
          provider.id === deleteTarget.provider?.id
            ? {
                ...provider,
                services: provider.services.filter(
                  (service) => service.id !== deleteTarget.service?.id,
                ),
              }
            : provider,
        ),
      );
      setSelectedServiceId("");
      setServicesPage(1);
    } else {
      applyProviders(
        providers.filter(
          (provider) => provider.id !== deleteTarget.provider?.id,
        ),
      );
      setSelectedProviderId("");
      setSelectedServiceId("");
      setPage(1);
      setServicesPage(1);
    }

    setDeleteTarget(null);
  };
  const handleCancelBlockedNavigation = () => {
    blocker.reset?.();
  };
  const handleConfirmBlockedNavigation = () => {
    handleDiscardPendingChanges();
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

    const normalizedProviders = upsertProvider(providers, editingProvider);

    applyProviders(normalizedProviders);
    setSelectedProviderId(editingProvider.id);

    if (editingProviderMode === "service") {
      setSelectedServiceId(editingServiceId);
    } else {
      setProviderCategory("");
      setProviderQuery("");
      setSelectedServiceId("");
    }

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
          changes={pendingChanges}
          onCancel={handleCancelBlockedNavigation}
          onConfirm={handleConfirmBlockedNavigation}
          onSaveAndExit={handleSaveAndExitBlockedNavigation}
          saving={spinner.loading}
        />
      )}

      <AdminPageShell
        header={adminContent.providers.header}
        isMobileView={isMobileView}
        isVisible={providersInView}
        rootRef={providersRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={providersInView}>
          <ProviderTotalsPanel loading={loadingProviders} stats={stats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={providersInView}>
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.providers.actions.discardChanges}
            discardDialogText={adminContent.providers.dialogs.discardPendingText}
            discardDialogTitle={
              adminContent.providers.dialogs.discardPendingTitle
            }
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
                    loading={loadingProviders}
                    onCreate={handleCreateProvider}
                    providers={providers}
                    showText={!isMobileView}
                  />
                }
                contentRef={tableStartRef}
                eyebrow={adminContent.providers.list.eyebrow}
                filters={
                  <ProviderFilters
                    category={providerCategory}
                    onCategoryChange={(value) => {
                      setProviderCategory(value);
                    }}
                    onQueryChange={(value) => {
                      setProviderQuery(value);
                    }}
                    query={providerQuery}
                  />
                }
                getKey={(provider) => provider.id}
                isMobileView={isMobileView}
                items={filteredProviders}
                loading={loadingProviders}
                lockPageHeight={false}
                mobilePageLabel={adminContent.providers.list.mobilePageLabel}
                onNextPage={() => handlePageChange(currentPage + 1)}
                onPrevPage={() => handlePageChange(currentPage - 1)}
                page={loadingProviders ? undefined : currentPage}
                pageDirection={pageDirection}
                pageLabel={adminContent.providers.list.pageLabel}
                pageSize={loadingProviders ? undefined : providerPageSize}
                renderMeasurePage={(items) => (
                  <ProviderCardsPage
                    emptyState={getProviderEmptyState(providers.length)}
                    items={items}
                    onDelete={(provider) =>
                      setDeleteTarget({ type: "provider", provider })
                    }
                    onEdit={handleEditProvider}
                    onSelect={() => {}}
                    selectedProviderId={effectiveSelectedProviderId}
                  />
                )}
                renderPage={(items) => (
                  <ProviderCardsPage
                    emptyState={getProviderEmptyState(providers.length)}
                    items={items}
                    onDelete={(provider) =>
                      setDeleteTarget({ type: "provider", provider })
                    }
                    onEdit={handleEditProvider}
                    onSelect={(provider) => {
                      setSelectedProviderId(provider.id);
                      setServicesPage(1);
                      setSelectedServiceId("");
                    }}
                    selectedProviderId={effectiveSelectedProviderId}
                  />
                )}
                skeletonConfig={{
                  actionCount: 3,
                  content: {
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
                  selectedProvider ? (
                    <ProviderTableActions
                      loading={loadingProviders}
                      onCreate={selectedProvider ? handleCreateService : null}
                      providers={filteredServices}
                      showText={!isMobileView}
                    />
                  ) : null
                }
                contentRef={tableStartRef}
                count={
                  selectedProvider
                    ? `${adminContent.providers.list.pageLabel}: ${selectedProvider.name || adminContent.common.fallbacks.provider}`
                    : ""
                }
                eyebrow={adminContent.providers.services.eyebrow}
                filters={
                  <ProviderFilters
                    onPaymentStatusChange={(value) => {
                      setServicePaymentStatus(value);
                    }}
                    onQueryChange={(value) => {
                      setServiceQuery(value);
                    }}
                    paymentStatus={servicePaymentStatus}
                    query={serviceQuery}
                    showCategory={false}
                    showPaymentStatus
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
                  handleServicesPageChange(currentServicesPage + 1)
                }
                onPrevPage={() =>
                  handleServicesPageChange(currentServicesPage - 1)
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
                      selectedProvider,
                    )}
                    items={items}
                    onDelete={(service) =>
                      setDeleteTarget({
                        type: "service",
                        provider: providers.find(
                          (provider) => provider.id === service.providerId,
                        ),
                        service,
                      })
                    }
                    onEdit={handleEditService}
                    onSelect={() => {}}
                    selectedServiceId={effectiveSelectedServiceId}
                  />
                )}
                renderPage={(items) => (
                  <ServiceCardsPage
                    emptyState={getServiceEmptyState(
                      providers.length,
                      services.length,
                      selectedProvider,
                    )}
                    items={items}
                    onDelete={(service) =>
                      setDeleteTarget({
                        type: "service",
                        provider: providers.find(
                          (provider) => provider.id === service.providerId,
                        ),
                        service,
                      })
                    }
                    onEdit={handleEditService}
                    onSelect={(service) => setSelectedServiceId(service.id)}
                    selectedServiceId={effectiveSelectedServiceId}
                  />
                )}
                skeletonConfig={{
                  actionCount: 2,
                  content: {
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
          title={getProviderEditorTitle({
            mode: editingProviderMode,
            provider: editingProvider,
            providers,
            serviceId: editingServiceId,
          })}
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
          message={
            deleteTarget.type === "service"
              ? adminContent.providers.dialogs.deleteServiceMessage(
                  getDeleteTargetName(deleteTarget),
                )
              : adminContent.providers.dialogs.deleteMessage(
                  getDeleteTargetName(deleteTarget),
                )
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTarget}
          title={
            deleteTarget.type === "service"
              ? adminContent.providers.dialogs.deleteServiceTitle
              : adminContent.providers.dialogs.deleteTitle
          }
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
  mode = "navigate",
  onCancel,
  onConfirm,
  onSave,
  onSaveAndExit,
  saving = false,
}) {
  const isSaveMode = mode === "save";

  return (
    <UnsavedChangesDialog
      actions={
        isSaveMode
          ? [
              {
                disabled: saving,
                icon: <Save size={16} strokeWidth={1.8} />,
                label: adminContent.providers.actions.saveChanges,
                onClick: onSave,
                tone: "primary",
              },
              {
                disabled: saving,
                icon: <X size={16} strokeWidth={1.8} />,
                label: adminContent.tables.dialogs.keepEditing,
                onClick: onCancel,
                tone: "terciary",
              },
            ]
          : [
              {
                icon: <Trash2 size={16} strokeWidth={1.8} />,
                label: adminContent.tables.dialogs.exitWithoutSaving,
                onClick: onConfirm,
                tone: "danger",
              },
              {
                disabled: saving,
                icon: <Save size={16} strokeWidth={1.8} />,
                label: adminContent.tables.dialogs.saveAndExit,
                onClick: onSaveAndExit,
                tone: "primary",
              },
              {
                icon: <X size={16} strokeWidth={1.8} />,
                label: adminContent.tables.dialogs.keepEditing,
                onClick: onCancel,
                tone: "terciary",
              },
            ]
      }
      changes={changes}
      labels={{
        eyebrow: adminContent.providers.dialogs.warningEyebrow,
        exitWithoutSaving: adminContent.tables.dialogs.exitWithoutSaving,
        keepEditing: adminContent.tables.dialogs.keepEditing,
        saveAndExit: adminContent.tables.dialogs.saveAndExit,
        text: isSaveMode
          ? "Se enviaran estos cambios a Apps Script."
          : adminContent.providers.dialogs.unsavedText,
        title: isSaveMode
          ? adminContent.providers.actions.saveChanges
          : adminContent.tables.dialogs.unsavedTitle,
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onSaveAndExit={onSaveAndExit}
      titleId="unsaved-provider-changes-title"
    />
  );
}

function getProviderEditorTitle({ mode, provider, providers, serviceId }) {
  if (mode === "service") {
    const existingService = providers
      .flatMap((item) => item.services)
      .some((service) => service.id === serviceId);

    return existingService
      ? adminContent.providers.dialogs.editServiceTitle
      : adminContent.providers.dialogs.createServiceTitle;
  }

  return providers.some((item) => item.id === provider.id)
    ? adminContent.providers.dialogs.editTitle
    : adminContent.providers.dialogs.createTitle;
}

function ProviderFilters({
  category = "",
  onCategoryChange,
  onPaymentStatusChange,
  onQueryChange,
  paymentStatus = "",
  query,
  showCategory = true,
  showPaymentStatus = false,
}) {
  const selectedCategory = showCategory
    ? PROVIDER_CATEGORIES.find((item) => item.value === category)
    : null;
  const selectedPaymentStatus = adminContent.providers.filters.paymentStatuses.find(
    (item) => item.value === paymentStatus,
  );
  const activeFilters = [
    query.trim()
      ? { key: "query", label: query.trim(), onRemove: () => onQueryChange("") }
      : null,
    selectedCategory
      ? {
          key: "category",
          label: selectedCategory.label,
          onRemove: () => onCategoryChange?.(""),
        }
      : null,
    selectedPaymentStatus
      ? {
          key: "paymentStatus",
          label: selectedPaymentStatus.label,
          onRemove: () => onPaymentStatusChange?.(""),
        }
      : null,
  ].filter(Boolean);

  return (
    <CollapsiblePanel
      activeFilters={activeFilters}
      title={adminContent.providers.filters.eyebrow}
    >
      <div className="grid gap-4">
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

        {showCategory && (
          <div>
            <Label>{adminContent.providers.filters.categoryLabel}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onCategoryChange?.(event.target.value)}
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
        )}

        {showPaymentStatus && (
          <div>
            <Label>{adminContent.providers.filters.paymentStatusLabel}</Label>
            <select
              className={selectClassName}
              onChange={(event) => onPaymentStatusChange?.(event.target.value)}
              value={paymentStatus}
            >
              <option value="">
                {adminContent.providers.filters.allPaymentStatuses}
              </option>
              {adminContent.providers.filters.paymentStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}

function ProviderTableActions({
  loading,
  onCreate,
  showText,
}) {
  if (!onCreate) return null;

  return (
    <div className="grid w-full gap-3">
      <IconButton
        className="w-full"
        disabled={loading}
        icon={<Plus size={18} strokeWidth={2.4} />}
        label={adminContent.providers.actions.add}
        onClick={onCreate}
        showText={showText ? "always" : undefined}
        tone="primary"
        type="button"
      >
        {showText ? adminContent.providers.actions.add : undefined}
      </IconButton>
    </div>
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
      providerName: provider.name || adminContent.common.fallbacks.provider,
    })),
  );
}

function filterServices(services, { paymentStatus, query }) {
  const normalizedQuery = query.trim().toLowerCase();

  return services.filter((service) => {
    const matchesPaymentStatus =
      !paymentStatus ||
      (paymentStatus === "paid" && isServicePaid(service)) ||
      (paymentStatus === "unpaid" && !isServicePaid(service));
    const searchableText = String(service.name || "").toLowerCase();

    return (
      matchesPaymentStatus &&
      (!normalizedQuery || searchableText.includes(normalizedQuery))
    );
  });
}

function getDeleteTargetName(deleteTarget) {
  if (deleteTarget.type === "service") {
    return deleteTarget.service?.name || adminContent.common.fallbacks.service;
  }

  return deleteTarget.provider?.name || adminContent.common.fallbacks.provider;
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

function getServiceEmptyState(providerCount, serviceCount, selectedProvider) {
  if (providerCount === 0) {
    return {
      text: adminContent.providers.services.noProvidersText,
      title: adminContent.providers.services.noProvidersTitle,
    };
  }

  if (!selectedProvider) {
    return {
      text: adminContent.providers.services.noSelectionText,
      title: adminContent.providers.services.noSelectionTitle,
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

function upsertProvider(providers, provider) {
  const exists = providers.some((item) => item.id === provider.id);

  if (!exists) return normalizeProviders([...providers, provider]);

  return normalizeProviders(
    providers.map((item) => (item.id === provider.id ? provider : item)),
  );
}
