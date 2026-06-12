const DEFAULT_TYPE = "Aviso";
const CONFIRMATION_TYPE = "Confirmación";
const VALID_TYPES = new Set([
  "Aviso",
  "Pago",
  CONFIRMATION_TYPE,
  "Confirmacion",
  "ConfirmaciÃ³n",
]);

const normalizeString = (value) => String(value || "").trim();

const createId = () =>
  `notification:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
const createStableId = (input = {}) => {
  const explicitId = normalizeString(input.id || input.notificationId);

  if (explicitId) return explicitId;

  const stableParts = [input.date, input.type, input.title, input.detail]
    .map((part) => normalizeString(part).trim().toLowerCase())
    .filter(Boolean);

  return stableParts.length
    ? `notification:${stableParts.join(":")}`
    : createId();
};

function normalizeNotificationType(value) {
  const type = normalizeString(value) || DEFAULT_TYPE;

  if (type === "Confirmacion" || type === "ConfirmaciÃ³n") {
    return CONFIRMATION_TYPE;
  }

  return VALID_TYPES.has(type) ? type : DEFAULT_TYPE;
}

export class AdminNotification {
  static types = ["Aviso", "Pago", CONFIRMATION_TYPE];

  static create(overrides = {}) {
    return this.normalize({
      id: createId(),
      title: "",
      detail: "",
      date: new Date().toISOString().slice(0, 10),
      type: DEFAULT_TYPE,
      read: false,
      ...overrides,
    });
  }

  static normalize(input = {}) {
    return {
      id: createStableId(input),
      title: normalizeString(input.title),
      detail: normalizeString(input.detail),
      date: normalizeString(input.date),
      type: normalizeNotificationType(input.type),
      read: Boolean(input.read),
    };
  }

  static normalizeList(items = []) {
    return (Array.isArray(items) ? items : [])
      .map((item) => this.normalize(item))
      .sort((left, right) => {
        if (left.read !== right.read) return left.read ? 1 : -1;

        return String(right.date).localeCompare(String(left.date));
      });
  }

  static validate(input = {}) {
    const notification = this.normalize(input);
    const errors = {};

    if (!notification.title) {
      errors.title = "El título es obligatorio";
    }

    if (!notification.date) {
      errors.date = "La fecha es obligatoria";
    }

    return errors;
  }

  static getUnreadCount(items = []) {
    return this.normalizeList(items).filter((item) => !item.read).length;
  }
}
