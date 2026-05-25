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
  const errors = {};
  const emailError = validateRsvpEmail(contact.email);

  if (emailError) {
    errors.email = emailError;
  }

  if (!contact.phone.trim()) {
    errors.phone = "El teléfono es obligatorio";
  } else if (!isValidPhone(contact.phone)) {
    errors.phone = "Introduce un teléfono válido";
  }

  if (!guests.length) {
    errors.guests = "Debes añadir al menos un invitado";
  }

  guests.forEach((guest, index) => {
    if (!guest.name.trim()) {
      errors[`guest_name_${index}`] = "El nombre es obligatorio";
    }

    if (!guest.lastname.trim()) {
      errors[`guest_lastname_${index}`] = "Los apellidos son obligatorios";
    }

    if (guest.comments.length > 300) {
      errors[`guest_comments_${index}`] = "Máximo 300 caracteres";
    }
  });

  return errors;
};
