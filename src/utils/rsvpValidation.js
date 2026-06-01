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
