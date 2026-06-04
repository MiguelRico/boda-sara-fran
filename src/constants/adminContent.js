export const adminContent = {
  auth: {
    eyebrow: "Panel privado",
    headerText: "Acceso reservado para revisar y organizar las confirmaciones.",
    loginTitle: "Acceso admin",
    loginText: "Introduce la contraseña para entrar al panel de gestión.",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Contraseña privada",
    submit: "Entrar",
    backHome: "Volver al inicio",
    error: "La contraseña no es correcta.",
  },
  guests: {
    header: {
      eyebrow: "Panel privado",
      title: "Lista de invitados",
      text: "Gestión de confirmaciones, datos de contacto, alergias y transporte",
    },
    filters: {
      eyebrow: "Filtros",
      searchLabel: "Busqueda",
      searchPlaceholder: "Email, teléfono, grupo, nombre o apellidos",
      showLabel: "Mostrar",
      options: [
        { value: "all", label: "Todos" },
        { value: "allergies", label: "Con alergias" },
        { value: "bus", label: "Con bus" },
        { value: "comments", label: "Con notas" },
      ],
    },
    list: {
      eyebrow: "Invitados",
      title: "Confirmaciones",
      pageLabel: "Página",
      mobilePageLabel: "Confirmación",
      emptyTitle: "Sin resultados",
      emptyText: "Prueba con otra búsqueda o cambia el filtro seleccionado.",
      countLabel: ({ groups, guests }) =>
        `${groups} ${groups === 1 ? "grupo" : "grupos"} en esta página · ${guests} ${
          guests === 1 ? "persona" : "personas"
        }`,
    },
    editor: {
      guestListEyebrow: "Grupo",
      guestListTitle: "Invitados",
      guestCountLabel: ({ page, total }) =>
        `Invitado ${page} de ${total}`,
    },
    actions: {
      export: "Exportar",
      refresh: "Actualizar",
      create: "Crear",
      edit: "Editar",
      delete: "Eliminar",
    },
    dialogs: {
      groupEditorTitle: "Editar grupo",
      validationTitle: "Revisa la confirmación",
      validationMessage:
        "Hay campos obligatorios o con formato incorrecto. Corrigelos antes de guardar la confirmacion.",
      deleteTitle: "Eliminar confirmación",
      deleteMessage: (label) =>
        `Se eliminará el grupo asociado a ${label}. Esta acción no se puede deshacer desde el panel.`,
      loadError:
        "No se pudieron cargar los invitados. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
      saveError:
        "No se ha podido guardar la confirmación. Revisa los datos e inténtalo de nuevo.",
      deleteError:
        "No se ha podido eliminar la confirmación. Inténtalo de nuevo en unos minutos.",
      createdTitle: "Confirmación creada",
      updatedTitle: "Cambios guardados",
      deletedTitle: "Confirmación eliminada",
      createdMessage: "La confirmación se ha creado correctamente.",
      updatedMessage: "La confirmación se ha actualizado correctamente.",
      deletedMessage: "La confirmación se ha eliminado correctamente.",
      successEyebrow: "Confirmación",
      warningEyebrow: "Aviso",
      problemTitle: "Ha ocurrido un problema",
      close: "Cerrar",
    },
    spinner: {
      create: "Creando confirmación...",
      save: "Guardando confirmación...",
      delete: "Eliminando confirmación...",
    },
    csv: {
      filename: "grupos-invitados.csv",
      headers: [
        "email",
        "telefono",
        "nombre_grupo",
        "total_invitados",
        "mesa_menu_asiento",
        "alergias",
        "transporte",
        "notas",
      ],
    },
  },
  tables: {
    tabs: [
      { id: "tables", label: "Mesas" },
      { id: "pending", label: "Invitados Pendientes" },
    ],
    header: {
      adminEyebrow: "Panel privado",
      title: "Mesas",
      text: "Organización de mesas, asientos e invitados asignados.",
      eyebrow: "Distribución",
      sectionTitle: "Asientos asignados",
      exportTable: "Exportar tabla",
      pageLabel: "Pagina",
      mobilePageLabel: "Mesas",
      tableCountLabel: ({ seats, tables }) =>
        `${tables} ${tables === 1 ? "mesa" : "mesas"} en esta pagina - ${seats} ${
          seats === 1 ? "asiento" : "asientos"
        }`,
      pendingGuestCountLabel: (count) =>
        `${count} ${count === 1 ? "invitado pendiente" : "invitados pendientes"}`,
    },
    actions: {
      sectionEyebrow: "Acciones",
      addTable: "Agregar mesa",
      saveChanges: "Guardar cambios",
      discardChanges: "Deshacer cambios",
      editTable: "Editar mesa",
      deleteTable: "Eliminar mesa",
    },
    empty: {
      title: "Sin mesas asignadas",
      text: "Asigna mesa y asiento desde la edicion de invitados para ver aqui la distribucion.",
    },
    dialogs: {
      createTitle: "Crear mesa",
      editTitle: "Editar mesa",
      deleteTitle: "Eliminar mesa",
      deleteMessage: (tableName) =>
        `¿Estás seguro que deseas eliminar la mesa ${tableName}? Esta acción liberará cualquier asiento asignado a esta mesa.`,
      assignmentTitle: "Asignar invitado",
      guestLabel: "Invitado",
      guestPlaceholder: "Seleccionar invitado",
      currentGuest: (guestName) => `Asignado a ${guestName}.`,
      assignedTitle: "Asignados",
      unassignedTitle: "Sin asientos asignados",
      unassignedText: "No hay invitados asignados a esta mesa.",
      unassignSeat: "Liberar asiento",
      unassigningSeat: "Liberando...",
      remove: "Eliminar",
      assign: "Asignar invitado",
      assigning: "Asignando...",
      cancel: "Cancelar",
      close: "Cerrar",
      unsavedEyebrow: "Cambios sin guardar",
      unsavedTitle: "Se perderan los cambios",
      unsavedText:
        "Tienes cambios pendientes en mesas. Si sales ahora, no se enviaran a Apps Script.",
      keepEditing: "Seguir editando",
      exitWithoutSaving: "Salir sin guardar",
      problemTitle: "Ha ocurrido un problema",
      warningEyebrow: "Aviso",
    },
    overview: {
      title: "Mesas y asientos",
      metrics: {
        tableCount: "Mesas",
        tables: "Mesas",
        seatCount: "Asientos",
        seats: "Asientos",
        assignedSeats: "Asignados",
        assigned: "Asignados",
        pendingSeats: "Pendientes",
        pending: "Pendientes",
      },
    },
    spinner: {
      save: "Guardando cambios...",
    },
    errors: {
      load: "No se pudieron cargar las mesas. Revisa que el endpoint admin devuelva el listado de confirmaciones.",
      save: "No se pudieron guardar los cambios. Intenta de nuevo.",
      assign: "No se pudo asignar el asiento. Intenta de nuevo.",
      assignTable: "No se pudo asignar la mesa. Intenta de nuevo.",
      unassign: "No se pudo liberar el asiento. Intenta de nuevo.",
    },
    changes: {
      created: (name) => `Mesa creada: ${name}`,
      modified: (name) => `Mesa modificada: ${name}`,
      deleted: (name) => `Mesa eliminada: ${name}`,
      noSeat: "Sin asiento",
      assignmentLabel: ({ table, seat }) =>
        `Mesa ${table || "-"}, asiento ${seat || "-"}`,
    },
  },
  pendingGuests: {
    filtersEyebrow: "Filtros",
    title: "Invitados pendientes",
    groupLabel: "Grupo de invitación",
    allGroups: "Todos los grupos",
    menuLabel: "Preferencia de menú",
    allMenus: "Todos los menús",
    emptyTitle: "Sin invitados pendientes",
    emptyText: "Todos los invitados confirmados tienen mesa asignada.",
    noFilterResults: "No hay invitados que coincidan con los filtros.",
    pageLabel: ({ page, total }) => `Página ${page} de ${total}`,
    showingLabel: ({ filtered, total }) =>
      `Mostrando ${filtered} de ${total} invitados pendientes`,
    pendingEyebrow: "Invitado pendiente",
    tableLabel: "Mesa",
    tablePlaceholder: "Seleccionar",
    selectTableFirst: "Selecciona una mesa",
    seatLabel: "Asiento",
    seatOption: (seat) => `Asiento ${seat}`,
    previous: "Anterior",
    next: "Siguiente",
    assign: "Asignar",
    assigning: "Asignando...",
    emptySeatsLabel: (count) => `${count} asientos libres`,
  },
};
