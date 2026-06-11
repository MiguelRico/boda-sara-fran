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
  getProviderTotal,
} from "../../../services/providersService";
import { getEmailHref, getPhoneHref } from "../../../utils/contactLinks";
import { formatCurrency } from "../../../utils/formatters";
import Card from "../Card";
import CardActions from "../CardActions";
import SelectableCardPage from "../SelectableCardPage";
import Chip from "../../ui/Chip";

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

function ServiceCard({ onDelete, onEdit, onSelect, selected, service }) {
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

function getProviderCategoryIcon(category) {
  const Icon = PROVIDER_ICON_COMPONENTS[PROVIDER_CATEGORY_ICONS[category]];

  return Icon ? <Icon size={54} strokeWidth={1.5} /> : null;
}
