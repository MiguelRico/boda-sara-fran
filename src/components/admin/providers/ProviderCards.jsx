import {
  BadgeEuro,
  BriefcaseBusiness,
  BusFront,
  CalendarDays,
  Camera,
  ClipboardList,
  Euro,
  Flower2,
  Gift,
  GlassWater,
  Globe,
  Headphones,
  Hotel,
  Lightbulb,
  Mail,
  Music,
  Phone,
  ReceiptText,
  Sparkles,
  Utensils,
  Video,
} from "lucide-react";

import {
  PROVIDER_CATEGORY_ICONS,
  PROVIDER_CATEGORY_LABELS,
} from "../../../constants/providers";
import {
  getProviderPaidTotal,
  getProviderPendingTotal,
  getProviderTotal,
} from "../../../services/providersService";
import { getEmailHref, getPhoneHref } from "../../../utils/contactLinks";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import {
  Card,
  CardActions,
  SelectableCardFrame,
  SelectableCardPage,
} from "../common";
import Chip from "../../ui/Chip";
import { adminContent } from "../../../constants/adminContent";

const PROVIDER_ICON_COMPONENTS = {
  bus: BusFront,
  camera: Camera,
  clipboard: ClipboardList,
  flower: Flower2,
  gift: Gift,
  glass: GlassWater,
  headphones: Headphones,
  hotel: Hotel,
  lightbulb: Lightbulb,
  music: Music,
  receipt: ReceiptText,
  sparkles: Sparkles,
  utensils: Utensils,
  video: Video,
};

export function ProviderCardsPage({
  emptyState,
  items,
  onDelete,
  onEdit,
  onSelect,
  selectedProviderId,
}) {
  return (
    <SelectableCardPage
      emptyIcon={BriefcaseBusiness}
      emptyState={emptyState}
      getKey={(provider) => provider.id}
      items={items}
      renderCard={(provider) => (
        <ProviderCard
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
          provider={provider}
          selected={provider.id === selectedProviderId}
        />
      )}
    />
  );
}

export function ServiceCardsPage({
  emptyState,
  items,
  onDelete,
  onEdit,
  onSelect,
  selectedServiceId,
}) {
  return (
    <SelectableCardPage
      emptyIcon={BadgeEuro}
      emptyState={emptyState}
      getKey={(service) => service.id}
      items={items}
      renderCard={(service) => (
        <ServiceCard
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
          selected={service.id === selectedServiceId}
          service={service}
        />
      )}
    />
  );
}

function ProviderCard({ onDelete, onEdit, onSelect, provider, selected }) {
  const total = getProviderTotal(provider);
  const paid = getProviderPaidTotal(provider);
  const pending = getProviderPendingTotal(provider);
  const paymentCount = getProviderPaymentCount(provider);
  const webHref = getWebHref(provider.web);

  return (
    <SelectableCardFrame
      className="h-full"
      onClick={() => onSelect(provider)}
      selected={selected}
    >
      <Card
        actionsPlacement="overlay"
        actions={
          <CardActions
            className="grid shrink-0 grid-cols-2 gap-2 self-start"
            item={provider}
            onDelete={onDelete}
            onEdit={onEdit}
            showText={false}
            stopPropagation
          />
        }
        decorativeText={getProviderCategoryIcon(provider.category)}
        eyebrow={PROVIDER_CATEGORY_LABELS[provider.category]}
        title={provider.name || adminContent.common.fallbacks.provider}
      >
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
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
          {provider.web ? (
            <Chip
              href={webHref}
              icon={<Globe size={13} strokeWidth={1.8} />}
              target="_blank"
              tone="secondary"
              value="Web"
            />
          ) : (
            <span aria-hidden="true" />
          )}
          <Chip
            className="col-span-2"
            icon={<BriefcaseBusiness size={13} strokeWidth={1.8} />}
            strong
            value={`${provider.services.length} servicios${adminContent.common.separator}${paymentCount} ${
              paymentCount === 1 ? "plazo" : "plazos"
            }${adminContent.common.separator}${formatCurrency(total)}`}
            valueClassName="whitespace-normal break-words leading-snug"
          />
          <Chip
            className="col-span-2"
            icon={<BadgeEuro size={13} strokeWidth={1.8} />}
            strong
            value={`${adminContent.providers.overview.metrics.paid} ${formatCurrency(
              paid,
            )}${adminContent.common.separator}${
              adminContent.providers.overview.metrics.pending
            } ${formatCurrency(pending)}`}
            valueClassName="whitespace-normal break-words leading-snug"
          />
        </div>
      </Card>
    </SelectableCardFrame>
  );
}

function ServiceCard({ onDelete, onEdit, onSelect, selected, service }) {
  const activePayments = getActiveServicePayments(service);

  return (
    <SelectableCardFrame
      className="h-full"
      onClick={() => onSelect(service)}
      selected={selected}
    >
      <Card
        actionsPlacement="overlay"
        actions={
          <CardActions
            className="grid shrink-0 grid-cols-2 gap-2 self-start"
            item={service}
            onDelete={onDelete}
            onEdit={onEdit}
            showText={false}
            stopPropagation
          />
        }
        decorativeText={getProviderCategoryIcon(service.category)}
        eyebrow={service.providerName}
        title={service.name || adminContent.common.fallbacks.service}
      >
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
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
            value={`${activePayments.length} ${
              activePayments.length === 1 ? "plazo" : "plazos"
            }`}
          />
          {activePayments.map((payment, index) => (
            <Chip
              className="col-span-2"
              icon={<BadgeEuro size={13} strokeWidth={1.8} />}
              key={payment.id || payment.paymentId || index}
              value={[
                `Plazo ${index + 1}`,
                formatDate(payment.date),
                formatCurrency(payment.amount),
              ].join(adminContent.common.separator)}
              valueClassName="whitespace-normal break-words leading-snug"
            />
          ))}
        </div>
      </Card>
    </SelectableCardFrame>
  );
}

function getProviderPaymentCount(provider) {
  return provider.services.reduce(
    (total, service) => total + getActiveServicePayments(service).length,
    0,
  );
}

function getActiveServicePayments(service) {
  return service.payments.slice(0, service.paymentCount);
}

function getWebHref(web) {
  const normalizedWeb = String(web || "").trim();

  if (!normalizedWeb) return undefined;

  return /^https?:\/\//i.test(normalizedWeb)
    ? normalizedWeb
    : `https://${normalizedWeb}`;
}

function getProviderCategoryIcon(category) {
  const Icon = PROVIDER_ICON_COMPONENTS[PROVIDER_CATEGORY_ICONS[category]];

  return Icon ? <Icon size={54} strokeWidth={1.5} /> : null;
}
