import { useInView } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Save,
  Trash2,
  X,
} from "lucide-react";

import { ADMIN_PASSWORD } from "../constants/admin";
import { adminContent } from "../constants/adminContent";
import {
  buildProviderStats,
  buildPendingProviderChanges,
  createEmptyProvider,
  createEmptyService,
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
  ProviderFilters,
  ProviderForm,
  ProviderTableActions,
  ProviderTotalsPanel,
  ServiceCardsPage,
} from "../components/admin/providers";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import DeleteDialog from "../components/ui/DeleteDialog";
import StatusDialog from "../components/ui/StatusDialog";
import Spinner from "../components/ui/Spinner";
import useIsMobileView from "../hooks/useIsMobileView";
import usePagedData from "../hooks/usePagedData";
import usePageTransition from "../hooks/usePageTransition";
import useEffectiveSelection from "../hooks/useEffectiveSelection";
import useAdminActiveTab from "../hooks/useAdminActiveTab";
import useSpinner from "../hooks/useSpinner";
import useAdminLocalChanges from "../hooks/useAdminLocalChanges";
import { storageKeys } from "../config/storageKeys";
import { isAdminSessionAuthenticated } from "../utils/adminSession";
import {
  filterProviders,
  filterServices,
  getDeleteTargetName,
  getProviderEmptyState,
  getProviderServices,
  getServiceEmptyState,
  upsertProvider,
} from "../utils/providerPageUtils";
import { DEFAULT_TABLE_PAGE_SIZE } from "../utils/paginationState";
import { getStableJson } from "../utils/objectSnapshot";

const ADMIN_PROVIDERS_ACTIVE_TAB_KEY = storageKeys.adminActiveTabs.providers;
const getEntityId = (item) => item.id;
const parsePaymentAmount = (value) =>
  Number(String(value || "").replace(",", ".")) || 0;
const getServicePaymentTotal = (service) =>
  service.payments
    .slice(0, service.paymentCount)
    .reduce((total, payment) => total + parsePaymentAmount(payment.amount), 0);
const withServicePaymentTotal = (service) => ({
  ...service,
  price: getServicePaymentTotal(service).toFixed(2),
});
const withProviderPaymentTotals = (provider) => ({
  ...provider,
  services: provider.services.map(withServicePaymentTotal),
});

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
  const [editingProviderSnapshot, setEditingProviderSnapshot] = useState("");
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
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
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
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
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
  const showPendingPopup = () => {
    setPopup({
      message: adminContent.providers.dialogs.pendingMessage,
      open: true,
      title: adminContent.providers.dialogs.pendingTitle,
      type: "success",
    });
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
    setEditingProviderSnapshot("");
    setDeleteTarget(null);
  };
  const handleEditProvider = (provider) => {
    if (!provider) return;

    const draft = createEmptyProvider(provider);

    setErrors({});
    setEditingProviderMode("provider");
    setEditingServiceId("");
    setEditingProvider(draft);
    setEditingProviderSnapshot(getStableJson(withProviderPaymentTotals(draft)));
  };
  const handleEditService = (service) => {
    if (!service) return;

    const provider = providers.find((item) => item.id === service.providerId);

    if (provider) {
      const draft = createEmptyProvider(provider);

      setErrors({});
      setEditingProviderMode("service");
      setEditingServiceId(service.id);
      setEditingProvider(draft);
      setEditingProviderSnapshot(getStableJson(withProviderPaymentTotals(draft)));
    }
  };
  const handleCreateProvider = () => {
    const draft = createEmptyProvider();

    setErrors({});
    setEditingProviderMode("provider");
    setEditingServiceId("");
    setEditingProvider(draft);
    setEditingProviderSnapshot(getStableJson(withProviderPaymentTotals(draft)));
  };
  const handleCreateService = () => {
    if (!selectedProvider) return;

    setErrors({});
    const nextService = { ...createEmptyService(), price: "0.00" };

    setEditingProviderMode("service");
    setEditingServiceId(nextService.id);
    const draft = createEmptyProvider({
      ...selectedProvider,
      services: [...selectedProvider.services, nextService],
    });

    setEditingProvider(draft);
    setEditingProviderSnapshot(getStableJson(withProviderPaymentTotals(draft)));
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
    showPendingPopup();
  };
  const {
    blocker,
    cancelBlockedNavigation,
    discardAndContinueNavigation,
    saveAndContinueNavigation,
  } = useAdminLocalChanges({
    hasPendingChanges,
    onDiscard: handleDiscardPendingChanges,
    onSave: handleSavePendingChanges,
  });
  const handleSubmitProvider = (event) => {
    event.preventDefault();
    const providerToSave = withProviderPaymentTotals(editingProvider);

    if (getStableJson(providerToSave) === editingProviderSnapshot) return;

    const validationErrors =
      editingProviderMode === "provider"
        ? validateProvider({ ...providerToSave, services: [] })
        : validateProvider(providerToSave);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    const normalizedProviders = upsertProvider(providers, providerToSave);

    applyProviders(normalizedProviders);
    setSelectedProviderId(providerToSave.id);

    if (editingProviderMode === "service") {
      setSelectedServiceId(editingServiceId);
    } else {
      setProviderCategory("");
      setProviderQuery("");
      setSelectedServiceId("");
    }

    setEditingProvider(null);
    setEditingProviderSnapshot("");
    showPendingPopup();
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
        index === serviceIndex
          ? withServicePaymentTotal({ ...service, [field]: value })
          : service,
      ),
    }));
  };
  const handlePaymentChange = (serviceIndex, paymentIndex, field, value) => {
    setEditingProvider((current) => ({
      ...current,
      services: current.services.map((service, index) =>
        index === serviceIndex
          ? withServicePaymentTotal({
              ...service,
              payments: service.payments.map((payment, itemIndex) =>
                itemIndex === paymentIndex
                  ? { ...payment, [field]: value }
                  : payment,
              ),
            })
          : service,
      ),
    }));
  };
  const handleAddService = () => {
    setEditingProvider((current) => ({
      ...current,
      services: [...current.services, { ...createEmptyService(), price: "0.00" }],
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
          onCancel={cancelBlockedNavigation}
          onConfirm={discardAndContinueNavigation}
          onSaveAndExit={saveAndContinueNavigation}
          saving={spinner.loading}
        />
      )}

      <AdminPageShell
        header={adminContent.providers.header}
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
          onClose={() => {
            setEditingProvider(null);
            setEditingProviderSnapshot("");
          }}
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
            serviceIsEditing={
              editingProviderMode === "service" &&
              providers
                .flatMap((provider) => provider.services)
                .some((service) => service.id === editingServiceId)
            }
            selectedServiceId={editingServiceId}
            submitDisabled={
              getStableJson(withProviderPaymentTotals(editingProvider)) ===
              editingProviderSnapshot
            }
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
