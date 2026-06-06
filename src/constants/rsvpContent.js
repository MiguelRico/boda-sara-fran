export const rsvpContent = {
  form: {
    defaultAddText: "Añadir",
    defaultCancelText: "Volver",
    defaultDeleteContext: "formulario",
    defaultSubmitText: "Confirmar",
    actionsEyebrow: "Acciones",
    deleteGuestTitle: "Eliminar invitado",
    deleteGuestMessage: ({ context, guestName, guestNumber }) =>
      `Se eliminará ${
        guestName ? `a ${guestName}` : `el invitado ${guestNumber}`
      }. Esta acción no se puede deshacer desde el ${context}.`,
    guestLabel: (number) => `Invitado ${number}`,
    guestPageLabel: ({ page, total }) => `${page} / ${total}`,
    previous: "Anterior",
    next: "Siguiente",
    removeGuestLabel: (number) => `Eliminar invitado ${number}`,
  },
  contact: {
    eyebrow: "Datos de contacto",
    title: "Datos de contacto",
    fields: {
      confirmationName: {
        label: "Nombre de grupo *",
        placeholder: "Ej: Familia Garcia",
      },
      email: {
        label: "Email de contacto *",
        placeholder: "Ej: ejemplo@email.com",
      },
      phone: {
        label: "Teléfono de contacto *",
        placeholder: "Ej: 600123456",
      },
    },
  },
  guest: {
    fallbackName: (number) => `Invitado ${number}`,
    fields: {
      name: { label: "Nombre *", placeholder: "Ej: Sara" },
      lastname: { label: "Apellidos *", placeholder: "Ej: Garcia" },
      menu: { label: "Menú *" },
      comments: {
        label: "Notas",
        placeholder: "Cualquier indicación que debamos tener en cuenta",
      },
      otherAllergies: { placeholder: "Otras notas alimentarias" },
      outboundBus: { label: "Autobús de ida" },
      returnBus: { label: "Autobús de vuelta" },
      table: { label: "Mesa", placeholder: "Ej: 4" },
      seat: { label: "Asiento", placeholder: "Ej: 7" },
    },
    panels: {
      allergies: {
        title: "Intolerancias",
        text: "Indica cualquier necesidad alimentaria para que podamos tenerla en cuenta.",
      },
      bus: {
        title: "Transporte",
        text: "Tendremos autobús para facilitar el desplazamiento de ida y vuelta.",
      },
      seating: {
        title: "Mesa y asiento",
        text: "Datos internos para organizar la disposición de invitados.",
      },
    },
    chipLabels: {
      allergies: "Alergias",
      otherAllergies: "Otras alergias",
      notes: "Notas",
    },
    assignment: {
      menu: (menu) => `Menú ${menu}`,
      table: (table) => `Mesa ${table}`,
      seat: (seat) => `Asiento ${seat}`,
    },
  },
  createInvitation: {
    eyebrow: "Confirma tu invitación",
    title: "Confirmar asistencia",
    text: "Confirma tu asistencia y la de tu familia.",
    action: "Crear nueva",
  },
  searchInvitation: {
    eyebrow: "Buscar invitación",
    title: "Modificar tu confirmación",
    text: "Busca por email o telefono asociado a tu confirmación.",
    emailLabel: "Email",
    emailPlaceholder: "Ej: ejemplo@email.com",
    phoneLabel: "Telefono",
    phonePlaceholder: "Ej: 600123456",
    searchAction: "Buscar mi confirmación",
    backHome: "Volver al inicio",
  },
  contactDetails: {
    heading: "Contacto",
  },
  validation: {
    requiredName: "El nombre es obligatorio",
    requiredLastname: "Los apellidos son obligatorios",
    requiredMenu: "Selecciona Carne o Pescado",
    commentsMaxLength: "Máximo 300 caracteres",
  },
};

