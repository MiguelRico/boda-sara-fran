const DEFAULT_TYPE = "Aviso";
const VALID_TYPES = new Set(["Aviso", "Pago", "Confirmación"]);

const normalizeString = (value) => String(value || "").trim();

const createId = () =>
  `notification:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

export class AdminNotification {
  static types = Array.from(VALID_TYPES);

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
    const type = normalizeString(input.type) || DEFAULT_TYPE;

    return {
      id: normalizeString(input.id) || createId(),
      title: normalizeString(input.title),
      detail: normalizeString(input.detail),
      date: normalizeString(input.date),
      type: VALID_TYPES.has(type) ? type : DEFAULT_TYPE,
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
