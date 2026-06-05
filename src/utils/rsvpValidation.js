import { Confirmation } from "../models";

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isValidPhone = (value) =>
  /^(?=(?:.*\d){9}$)[67][\d\s()-]{8}$/.test(value);

export const validateRsvpEmail = (email) => {
  if (!email.trim()) {
    return "El email es obligatorio";
  }

  if (!isValidEmail(email)) {
    return "Introduce un email válido";
  }

  return null;
};

export const validateRsvpSearch = ({ email = "", phone = "" }) => {
  const normalizedEmail = email.trim();
  const normalizedPhone = phone.trim();
  const errors = {};

  if (!normalizedEmail && !normalizedPhone) {
    errors.email = "Introduce un email o un telefono";
    errors.phone = "Introduce un email o un telefono";
    return errors;
  }

  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    errors.email = "Introduce un email valido";
  }

  if (normalizedPhone && !isValidPhone(normalizedPhone)) {
    errors.phone = "Introduce un telefono valido";
  }

  return errors;
};

export const validateRsvpContact = (contact) => {
  return Confirmation.validateContact(contact, {
    validateEmail: validateRsvpEmail,
    validatePhone: isValidPhone,
  });
};

export const validateRsvpForm = ({ contact, guests }) => {
  return Confirmation.validateForm(
    {
      ...contact,
      guests,
    },
    {
      validateEmail: validateRsvpEmail,
      validatePhone: isValidPhone,
    },
  );
};
