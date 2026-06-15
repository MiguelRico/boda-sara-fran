export const tableContent = {
  form: {
    eyebrow: "Crear mesa",
    title: "Crear mesa",
    submitText: "Guardar",
    cancelText: "Cancelar",
    deleteText: "Eliminar",
    deleteLabel: "Eliminar mesa",
    fields: {
      name: {
        label: "Nombre de la mesa *",
        placeholder: "Ej: Mesa 1",
      },
      group: {
        label: "Grupo *",
      },
      shape: {
        label: "Forma *",
      },
      seatCount: {
        label: "Numero de asientos *",
      },
      notes: {
        label: "Notas",
        placeholder:
          "Ej: Cerca de la pista, mesa infantil, indicaciones del catering...",
      },
    },
    seatReductionWarning:
      "Al reducir la mesa, se desasignaran los ultimos asientos:",
    seatReductionItem: ({ name, seat }) => `Asiento ${seat}: ${name}`,
  },
  card: {
    defaultEyebrow: "Mesa",
    centerAction: "Ver asientos",
    deleteAction: "Eliminar mesa",
    editAction: "Editar mesa",
    assignedCount: ({ count }) =>
      `${count} ${count === 1 ? "invitado asignado" : "invitados asignados"}`,
    seatEyebrow: ({ group, seat }) => `Asiento ${seat}${group ? ` - ${group}` : ""}`,
    emptyAssignmentsTitle: "Sin asientos asignados",
    emptyAssignmentsText: "No hay invitados asignados a esta mesa.",
    emptyAssignmentsFilterText:
      "No hay asientos asignados que coincidan con los filtros.",
    legend: {
      fish: "Pescado",
      meat: "Carne",
      allergies: "Alergias",
      notes: "Notas",
    },
    detail: ({ assigned, seats, shape }) => `${shape} - ${assigned}/${seats} asientos`,
    seatAssignmentEyebrow: ({ seat, table }) =>
      `Mesa ${table} - Asiento ${seat}`,
    seatAriaLabel: ({ guestName, seat }) =>
      `Asiento ${seat}${guestName ? ` - ${guestName}` : ""}`,
    seatTitle: ({ guestName, seat }) => guestName || `Asiento ${seat}`,
  },
  validation: {
    seatCountRange: ({ max, min }) =>
      `Selecciona entre ${min} y ${max} asientos.`,
  },
  csv: {
    filename: "mesas.csv",
    headers: ["mesa", "grupo", "forma", "notas", "asiento", "invitado", "menu"],
  },
};
