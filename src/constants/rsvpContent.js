export const rsvpContent = {
  form: {
    defaultAddText: "Añadir",
    defaultCancelText: "Volver",
    defaultDeleteContext: "formulario",
    defaultSubmitText: "Confirmar",
    actionsEyebrow: "Acciones",
    addGuestText: "Invitado",
    reviewAdminSubmitText: "Guardar",
    reviewSubmitText: "Enviar confirmación",
    saveGuests: "Revisar confirmación",
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
      name: { label: "Nombre *", placeholder: "Ej: Nombre" },
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
    eyebrow: "Confirmar",
    title: "Confirmar asistencia",
    text: "Confirma tu asistencia y la de tu familia.",
    action: "Crear nueva",
  },
  createPage: {
    title: "Crear confirmación",
  },
  editPage: {
    title: "Modificar confirmación",
    text: "Actualiza los invitados, alergias y transporte de vuestra confirmación.",
  },
  searchInvitation: {
    eyebrow: "Buscar confirmación",
    title: "Modificar confirmación",
    text: "Busca por email o telefono asociado a tu confirmación.",
    emailLabel: "Email",
    emailPlaceholder: "Ej: ejemplo@email.com",
    phoneLabel: "Telefono",
    phonePlaceholder: "Ej: 600123456",
    searchAction: "Buscar confirmación",
    backHome: "Inicio",
  },
  status: {
    close: "Cerrar",
    backHome: "Inicio",
    problemTitle: "Ha ocurrido un problema",
    searchLoading: "Buscando confirmación...",
    submitLoading: "Enviando confirmación...",
    loadLoading: "Cargando confirmación...",
    notFoundTitle: "No encontrada",
    notFoundMessage:
      "No hemos encontrado una confirmación asociada a ese email o teléfono.",
    missingIdError: "La confirmación encontrada no tiene confirmationId.",
    searchError:
      "Ha ocurrido un error buscando la confirmación. Por favor, inténtalo de nuevo en unos minutos.",
    duplicatedContactTitle: "Contacto duplicado",
    duplicatedEmail: "Ya existe una confirmación con este email.",
    duplicatedPhone: "Ya existe una confirmación con este teléfono.",
    duplicatedContactMessage:
      "Ya existe una confirmación con ese email o teléfono. Usa otro contacto o modifica la confirmación existente.",
    validationTitle: "Revisa la confirmación",
    validationMessage:
      "Hay campos obligatorios o con formato incorrecto. Corrígelos antes de enviar la confirmación.",
    submitSuccessTitle: "Confirmación recibida",
    submitCreateSuccess: "Hemos guardado correctamente vuestra confirmación.",
    submitEditSuccess: "Hemos actualizado correctamente vuestra confirmación.",
    submitError:
      "No hemos podido guardar vuestra confirmación. Por favor, intentadlo de nuevo en unos minutos.",
    loadMissing:
      "No se encontró la confirmación. Si el problema persiste, ponte en contacto con la organización.",
    loadError:
      "Error cargando la confirmación. Si el problema persiste, ponte en contacto con la organización.",
  },
  review: {
    contactEyebrow: "Datos de contacto",
    editContact: "Editar datos",
    editGuests: "Editar invitados",
    guestsEyebrow: "Invitados confirmados",
    intro:
      "Revisa tus datos de contacto e invitados antes de enviar tu confirmación",
    guestCount: (count) => `${count} ${count === 1 ? "Invitado" : "Invitados"}`,
    dialogEyebrow: "Revisión",
    dialogTitle: "Revisa la confirmación",
    dialogText: "Comprueba los datos antes de enviar el formulario.",
    contactTitle: "Contacto",
    keepEditing: "Seguir editando",
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
