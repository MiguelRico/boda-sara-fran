import { Guest } from "./Guest";
import { rsvpContent } from "../constants/rsvpContent";
import { isMenuModuleEnabled } from "../config/features";

const CONFIRMATION_DEFAULTS = {
  confirmationId: "",
  id: "",
  confirmationName: "",
  email: "",
  phone: "",
  guests: [],
};

const normalizeString = (value) => (value == null ? "" : String(value));
const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getRate = (value, total) => {
  if (!total) return 0;

  return Math.round((value / total) * 100);
};

export const Confirmation = {
  create(overrides = {}) {
    const confirmationName = normalizeString(
      overrides.confirmationName || overrides.nombre_grupo,
    );

    return {
      ...CONFIRMATION_DEFAULTS,
      confirmationId: normalizeString(overrides.confirmationId || overrides.id),
      id: normalizeString(overrides.confirmationId || overrides.id),
      confirmationName,
      email: normalizeString(overrides.email),
      phone: normalizeString(overrides.phone),
      guests: Guest.normalizeList(overrides.guests, { ensureOne: false }).map(
        (guest) => ({
          ...guest,
          confirmationId:
            guest.confirmationId ||
            normalizeString(overrides.confirmationId || overrides.id),
          confirmationName: guest.confirmationName || confirmationName,
        }),
      ),
    };
  },

  normalize(confirmation = {}) {
    return Confirmation.create(confirmation);
  },

  normalizeList(confirmations) {
    return Array.isArray(confirmations)
      ? confirmations.map((confirmation) =>
          Confirmation.normalize(confirmation),
        )
      : [];
  },

  createEmpty() {
    return Confirmation.create({
      guests: [Guest.create()],
    });
  },

  withUpdatedContact(confirmation, field, value) {
    const currentConfirmation = Confirmation.normalize(confirmation);

    return Confirmation.normalize({
      ...currentConfirmation,
      [field]: value,
    });
  },

  withUpdatedGuest(confirmation, index, field, value) {
    const currentConfirmation = Confirmation.normalize(confirmation);
    const guests = [...currentConfirmation.guests];

    guests[index] = Guest.withUpdatedField(guests[index], field, value);

    return {
      ...currentConfirmation,
      guests,
    };
  },

  withAddedGuest(confirmation, { maxGuests } = {}) {
    const currentConfirmation = Confirmation.normalize(confirmation);

    if (maxGuests && currentConfirmation.guests.length >= maxGuests) {
      return currentConfirmation;
    }

    return {
      ...currentConfirmation,
      guests: [...currentConfirmation.guests, Guest.create()],
    };
  },

  withAddedGuestList(guests, { maxGuests } = {}) {
    const normalizedGuests = Guest.normalizeList(guests);

    if (maxGuests && normalizedGuests.length >= maxGuests) {
      return normalizedGuests;
    }

    return [...normalizedGuests, Guest.create()];
  },

  withRemovedGuest(confirmation, index) {
    const currentConfirmation = Confirmation.normalize(confirmation);

    if (currentConfirmation.guests.length === 1) return currentConfirmation;

    return {
      ...currentConfirmation,
      guests: currentConfirmation.guests.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    };
  },

  withRemovedGuestList(guests, index) {
    const normalizedGuests = Guest.normalizeList(guests);

    if (normalizedGuests.length === 1) return normalizedGuests;

    return normalizedGuests.filter((_, itemIndex) => itemIndex !== index);
  },

  getGuestCount(confirmation) {
    return Confirmation.normalize(confirmation).guests.length;
  },

  getGuestNames(confirmation) {
    const { guests } = Confirmation.normalize(confirmation);

    if (!guests.length) return "Sin invitados";

    return guests
      .map((guest, index) => Guest.getDisplayName(guest, index))
      .join(", ");
  },

  getCommentsText(confirmation) {
    const { guests } = Confirmation.normalize(confirmation);
    const values = guests
      .map((guest, index) => {
        const normalizedGuest = Guest.normalize(guest);

        if (!normalizedGuest.comments.trim()) return "";

        return `${Guest.getDisplayName(normalizedGuest, index)}: ${normalizedGuest.comments.trim()}`;
      })
      .filter(Boolean);

    return values.length ? values.join(" | ") : "";
  },

  getAssignmentText(confirmation) {
    const { guests } = Confirmation.normalize(confirmation);
    const values = guests
      .map((guest, index) => {
        const assignmentText = Guest.getAssignmentText(guest);

        if (!assignmentText) return "";

        return `${Guest.getDisplayName(guest, index)}: ${assignmentText}`;
      })
      .filter(Boolean);

    return values.length ? values.join(" | ") : "";
  },

  getGroupRateText(value) {
    return `${value}`;
  },

  getAllergyText(confirmation) {
    const { guests } = Confirmation.normalize(confirmation);

    return Confirmation.getGroupRateText(
      guests.filter(Guest.hasAllergies).length,
    );
  },

  getTransportText(confirmation) {
    const { guests } = Confirmation.normalize(confirmation);

    return Confirmation.getGroupRateText(guests.filter(Guest.usesBus).length);
  },

  getMenuText(confirmation, menu) {
    const { guests } = Confirmation.normalize(confirmation);

    return Confirmation.getGroupRateText(
      guests.filter((guest) => guest.menu === menu).length,
    );
  },

  getCommentsCountText(confirmation) {
    const { guests } = Confirmation.normalize(confirmation);

    return Confirmation.getGroupRateText(
      guests.filter(Guest.hasComments).length,
    );
  },

  hasAllergies(confirmation) {
    return Confirmation.normalize(confirmation).guests.some(Guest.hasAllergies);
  },

  usesBus(confirmation) {
    return Confirmation.normalize(confirmation).guests.some(Guest.usesBus);
  },

  needsReview(confirmation) {
    return Confirmation.normalize(confirmation).guests.some(Guest.needsReview);
  },

  hasComments(confirmation) {
    return Confirmation.normalize(confirmation).guests.some(Guest.hasComments);
  },

  validateForAdmin(confirmation) {
    const normalizedConfirmation = Confirmation.normalize(confirmation);

    if (!normalizedConfirmation.email.trim()) return "El email es obligatorio.";
    if (!normalizedConfirmation.confirmationName.trim()) {
      return "El nombre de grupo es obligatorio.";
    }
    if (!normalizedConfirmation.phone.trim())
      return "El teléfono es obligatorio.";
    if (!normalizedConfirmation.guests.length) {
      return "Debe haber al menos un invitado.";
    }

    const invalidGuest = normalizedConfirmation.guests.find(
      (guest) => !Guest.isValid(guest),
    );

    if (invalidGuest) {
      return isMenuModuleEnabled
        ? "Todos los invitados necesitan nombre, apellidos y seleccionar un menú."
        : "Todos los invitados necesitan nombre y apellidos.";
    }

    return "";
  },

  validateContact(confirmation, { validateEmail, validatePhone } = {}) {
    const normalizedConfirmation = Confirmation.normalize(confirmation);
    const errors = {};
    const emailError = validateEmail?.(normalizedConfirmation.email);

    if (emailError) {
      errors.email = emailError;
    }

    if (!normalizedConfirmation.confirmationName.trim()) {
      errors.confirmationName = "El nombre de grupo es obligatorio";
    }

    if (!normalizedConfirmation.phone.trim()) {
      errors.phone = "El teléfono es obligatorio";
    } else if (validatePhone && !validatePhone(normalizedConfirmation.phone)) {
      errors.phone = "Introduce un teléfono válido";
    }

    return errors;
  },

  validateForm(confirmation, validators = {}) {
    const normalizedConfirmation = Confirmation.normalize(confirmation);
    const errors = Confirmation.validateContact(
      normalizedConfirmation,
      validators,
    );

    if (!normalizedConfirmation.guests.length) {
      errors.guests = "Debes añadir al menos un invitado";
    }

    normalizedConfirmation.guests.forEach((guest, index) => {
      Object.assign(errors, Guest.validate(guest, index));
    });

    return errors;
  },

  toAdminRow(confirmation, index = 0) {
    const normalizedConfirmation = Confirmation.normalize(confirmation);

    return {
      allergyText: Confirmation.getAllergyText(normalizedConfirmation),
      assignmentText: Confirmation.getAssignmentText(normalizedConfirmation),
      commentsCountText: Confirmation.getCommentsCountText(
        normalizedConfirmation,
      ),
      commentsText: Confirmation.getCommentsText(normalizedConfirmation),
      email: normalizedConfirmation.email,
      fishText: Confirmation.getMenuText(normalizedConfirmation, "Pescado"),
      group: normalizedConfirmation,
      confirmationName: normalizedConfirmation.confirmationName,
      groupSize: Confirmation.getGuestCount(normalizedConfirmation),
      guestNames: Confirmation.getGuestNames(normalizedConfirmation),
      guests: normalizedConfirmation.guests,
      hasAllergies: Confirmation.hasAllergies(normalizedConfirmation),
      hasComments: Confirmation.hasComments(normalizedConfirmation),
      needsReview: Confirmation.needsReview(normalizedConfirmation),
      phone: normalizedConfirmation.phone,
      rowId: normalizedConfirmation.confirmationId || `confirmation-${index}`,
      confirmationId: normalizedConfirmation.confirmationId,
      id: normalizedConfirmation.id,
      meatText: Confirmation.getMenuText(normalizedConfirmation, "Carne"),
      transportText: Confirmation.getTransportText(normalizedConfirmation),
      usesBus: Confirmation.usesBus(normalizedConfirmation),
    };
  },

  toAdminRows(confirmations) {
    return Confirmation.normalizeList(confirmations).map(
      (confirmation, index) => Confirmation.toAdminRow(confirmation, index),
    );
  },

  filterAdminRows(rows, query, filter) {
    const normalizedQuery = normalizeText(query);

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        normalizeText(
          `${row.email} ${row.phone} ${row.confirmationName} ${row.guestNames}`,
        ).includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "allergies" && row.hasAllergies) ||
        (filter === "bus" && row.usesBus) ||
        (filter === "comments" && row.hasComments) ||
        (filter === "review" && row.needsReview);

      return matchesQuery && matchesFilter;
    });
  },

  getGuestsWithConfirmation(confirmations) {
    return Confirmation.normalizeList(confirmations).flatMap((confirmation) =>
      confirmation.guests.map((guest) => ({
        ...guest,
        confirmationId: confirmation.confirmationId,
        guestId: guest.guestId || guest.id,
        email: confirmation.email,
        confirmationName: confirmation.confirmationName,
        phone: confirmation.phone,
      })),
    );
  },

  buildStats(
    confirmations,
    { allergies = [], outboundBusOptions = [], returnBusOptions = [] } = {},
  ) {
    const normalizedConfirmations = Confirmation.normalizeList(confirmations);
    const guests = Confirmation.getGuestsWithConfirmation(
      normalizedConfirmations,
    );
    const totalGuests = guests.length;
    const totalGroups = normalizedConfirmations.length;
    const guestsWithAllergies = guests.filter(Guest.hasAllergies).length;
    const guestsWithOtherAllergies = guests.filter(
      Guest.hasOtherAllergies,
    ).length;
    const guestsUsingBus = guests.filter(Guest.usesBus).length;
    const guestsWithComments = guests.filter(Guest.hasComments).length;

    return {
      allergyRate: getRate(guestsWithAllergies, totalGuests),
      allergiesByType: Confirmation.buildAllergyStats(guests, allergies, {
        otherAllergiesLabel: rsvpContent.guest.chipLabels.otherAllergies,
      }),
      busRate: getRate(guestsUsingBus, totalGuests),
      commentsRate: getRate(guestsWithComments, totalGuests),
      guestsWithAllergies,
      guestsWithComments,
      guestsWithOtherAllergies,
      guestsUsingBus,
      otherAllergyRate: getRate(guestsWithOtherAllergies, totalGuests),
      outboundBusStats: Confirmation.buildBusStats(
        guests,
        outboundBusOptions,
        "outboundBus",
      ),
      returnBusStats: Confirmation.buildBusStats(
        guests,
        returnBusOptions,
        "returnBus",
      ),
      totalGroups,
      totalGuests,
    };
  },

  buildAllergyStats(guests, allergies, { otherAllergiesLabel = "" } = {}) {
    const allergyItems = allergies
      .map((allergy) => ({
        label: allergy,
        value: guests.filter((guest) => Guest.hasAllergy(guest, allergy))
          .length,
      }))
      .filter((item) => item.value > 0);
    const otherAllergiesCount = guests.filter(Guest.hasOtherAllergies).length;

    if (!otherAllergiesLabel || !otherAllergiesCount) return allergyItems;

    return [
      ...allergyItems,
      {
        label: otherAllergiesLabel,
        value: otherAllergiesCount,
      },
    ];
  },

  buildBusStats(guests, options, field) {
    return options
      .filter((option) => option.value !== "No")
      .map((option) => ({
        label: option.label,
        value: guests.filter((guest) =>
          Guest.hasBusValue(guest, field, option.value),
        ).length,
      }));
  },
};

