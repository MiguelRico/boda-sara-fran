import { GUEST_MENU_OPTIONS } from "../constants/rsvp";
import { rsvpContent } from "../constants/rsvpContent";
import { isMenuModuleEnabled } from "../config/features";

const GUEST_DEFAULTS = {
  confirmationId: "",
  email: "",
  guestId: "",
  confirmationName: "",
  id: "",
  name: "",
  lastname: "",
  phone: "",
  allergies: [],
  otherAllergies: "",
  comments: "",
  outboundBus: "No",
  returnBus: "No",
  menu: "",
  tableId: "",
  table: "",
  seat: "",
};

const normalizeString = (value) => (value == null ? "" : String(value));
const normalizeMenu = (value) => {
  const menu = normalizeString(value).trim();

  return GUEST_MENU_OPTIONS.includes(menu) ? menu : "";
};
const isBlankValue = (value) => {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return value === false;
  if (value == null) return true;

  return String(value).trim() === "";
};

export const Guest = {
  create(overrides = {}) {
    return {
      ...GUEST_DEFAULTS,
      confirmationId: normalizeString(overrides.confirmationId),
      email: normalizeString(overrides.email),
      guestId: normalizeString(overrides.guestId || overrides.id),
      confirmationName: normalizeString(overrides.confirmationName),
      id: normalizeString(overrides.guestId || overrides.id),
      name: normalizeString(overrides.name),
      lastname: normalizeString(overrides.lastname),
      phone: normalizeString(overrides.phone),
      allergies: Array.isArray(overrides.allergies)
        ? [...overrides.allergies]
        : [],
      otherAllergies: normalizeString(overrides.otherAllergies),
      comments: normalizeString(overrides.comments),
      outboundBus:
        normalizeString(overrides.outboundBus) || GUEST_DEFAULTS.outboundBus,
      returnBus:
        normalizeString(overrides.returnBus) || GUEST_DEFAULTS.returnBus,
      menu: normalizeMenu(overrides.menu),
      tableId: normalizeString(overrides.tableId),
      table: normalizeString(overrides.table),
      seat: normalizeString(overrides.seat),
    };
  },

  normalize(guest = {}) {
    return Guest.create(guest);
  },

  normalizeList(guests, { ensureOne = true } = {}) {
    if (!Array.isArray(guests) || !guests.length) {
      return ensureOne ? [Guest.create()] : [];
    }

    return guests.map((guest) => Guest.normalize(guest));
  },

  withUpdatedField(guest, field, value) {
    const currentGuest = Guest.normalize(guest);

    if (field !== "allergies") {
      return Guest.normalize({
        ...currentGuest,
        [field]: value,
      });
    }

    const exists = currentGuest.allergies.includes(value);

    return Guest.normalize({
      ...currentGuest,
      allergies: exists
        ? currentGuest.allergies.filter((item) => item !== value)
        : [...currentGuest.allergies, value],
    });
  },

  getFullName(guest, fallback = "") {
    const normalizedGuest = Guest.normalize(guest);
    const name = `${normalizedGuest.name} ${normalizedGuest.lastname}`.trim();

    return name || fallback;
  },

  getDisplayName(guest, index) {
    return Guest.getFullName(guest, rsvpContent.guest.fallbackName(index + 1));
  },

  getAllergyText(guest) {
    const normalizedGuest = Guest.normalize(guest);
    const values = [...normalizedGuest.allergies];

    if (normalizedGuest.otherAllergies.trim()) {
      values.push(normalizedGuest.otherAllergies.trim());
    }

    return values.length ? values.join(", ") : "No";
  },

  getAssignmentText(guest) {
    const normalizedGuest = Guest.normalize(guest);
    const values = [
      isMenuModuleEnabled &&
        normalizedGuest.menu &&
        rsvpContent.guest.assignment.menu(normalizedGuest.menu),
      normalizedGuest.table &&
        rsvpContent.guest.assignment.table(normalizedGuest.table),
      normalizedGuest.seat &&
        rsvpContent.guest.assignment.seat(normalizedGuest.seat),
    ].filter(Boolean);

    return values.length ? values.join(" | ") : "";
  },

  hasAllergies(guest) {
    return Guest.getAllergyText(guest) !== "No";
  },

  hasAllergy(guest, allergy) {
    return Guest.normalize(guest).allergies.includes(allergy);
  },

  hasOtherAllergies(guest) {
    return Boolean(Guest.normalize(guest).otherAllergies.trim());
  },

  hasComments(guest) {
    return Boolean(Guest.normalize(guest).comments.trim());
  },

  usesBus(guest) {
    const normalizedGuest = Guest.normalize(guest);

    return Boolean(
      (normalizedGuest.outboundBus && normalizedGuest.outboundBus !== "No") ||
      (normalizedGuest.returnBus && normalizedGuest.returnBus !== "No"),
    );
  },

  hasBusValue(guest, field, value) {
    return (Guest.normalize(guest)[field] || "No") === value;
  },

  needsReview(guest) {
    const normalizedGuest = Guest.normalize(guest);

    return Boolean(
      Guest.hasOtherAllergies(normalizedGuest) ||
      Guest.hasComments(normalizedGuest) ||
      (Guest.usesBus(normalizedGuest) &&
        (!normalizedGuest.outboundBus || !normalizedGuest.returnBus)),
    );
  },

  isEmpty(guest) {
    const normalizedGuest = Guest.normalize(guest);

    return Object.entries(normalizedGuest).every(([field, value]) => {
      if (
        field === "confirmationName" ||
        field === "outboundBus" ||
        field === "returnBus"
      ) {
        return true;
      }

      return isBlankValue(value);
    });
  },

  isValid(guest) {
    const normalizedGuest = Guest.normalize(guest);

    return Boolean(
      normalizedGuest.name.trim() &&
      normalizedGuest.lastname.trim() &&
      (!isMenuModuleEnabled || normalizedGuest.menu) &&
      normalizedGuest.comments.length <= 300,
    );
  },

  validate(guest, index) {
    const normalizedGuest = Guest.normalize(guest);
    const errors = {};

    if (!normalizedGuest.name.trim()) {
      errors[`guest_name_${index}`] = rsvpContent.validation.requiredName;
    }

    if (!normalizedGuest.lastname.trim()) {
      errors[`guest_lastname_${index}`] =
        rsvpContent.validation.requiredLastname;
    }

    if (isMenuModuleEnabled && !normalizedGuest.menu) {
      errors[`guest_menu_${index}`] = rsvpContent.validation.requiredMenu;
    }

    if (normalizedGuest.comments.length > 300) {
      errors[`guest_comments_${index}`] =
        rsvpContent.validation.commentsMaxLength;
    }

    return errors;
  },

  hasInvalidGuests(guests) {
    return Guest.normalizeList(guests, { ensureOne: false }).some(
      (guest) => !Guest.isValid(guest),
    );
  },

  hasIncompleteVisibleGuests(guests) {
    const normalizedGuests = Guest.normalizeList(guests, { ensureOne: false });

    return (
      Guest.hasInvalidGuests(normalizedGuests) &&
      (normalizedGuests.length > 1 ||
        normalizedGuests.some(
          (guest) => !Guest.isValid(guest) && !Guest.isEmpty(guest),
        ))
    );
  },
};

