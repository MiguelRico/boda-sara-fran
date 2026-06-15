import { adminContent } from "../constants/adminContent";

const DEFAULT_TYPE = "Aviso";
export const GUESTS_TYPE = "Invitados";
export const CONFIRMATION_TYPE = GUESTS_TYPE;
const VALID_TYPES = new Set(["Aviso", "Pago", GUESTS_TYPE]);

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

  return VALID_TYPES.has(type) ? type : DEFAULT_TYPE;
}

export class AdminNotification {
  static types = ["Aviso", "Pago", GUESTS_TYPE];

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
      errors.title = adminContent.notifications.validation.requiredTitle;
    }

    if (!notification.date) {
      errors.date = adminContent.notifications.validation.requiredDate;
    }

    return errors;
  }

  static getUnreadCount(items = []) {
    return this.normalizeList(items).filter((item) => !item.read).length;
  }
}
