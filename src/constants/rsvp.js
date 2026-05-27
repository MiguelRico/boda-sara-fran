export const MAX_GUESTS = 10;

export const COMMON_ALLERGIES = [
  "Gluten",
  "Lactosa",
  "Frutos secos",
  "Marisco",
  "Huevo",
  "Soja",
  "Pescado",
  "Mostaza",
];

export const OUTBOUND_BUS_OPTIONS = [
  { value: "No", label: "No necesito autobús de ida" },
  { value: "18:00", label: "18:00 (Huelva)" },
  { value: "18:20", label: "18:20 (Corrales)" },
];

export const RETURN_BUS_OPTIONS = [
  { value: "No", label: "No necesito autobús de vuelta" },
  { value: "3:00", label: "3:00 (Corrales - Huelva)" },
  { value: "6:00", label: "6:00 (Corrales - Huelva)" },
];

export const createEmptyGuest = () => ({
  name: "",
  lastname: "",
  allergies: [],
  otherAllergies: "",
  comments: "",
  busNeeded: false,
  outboundBus: "",
  returnBus: "",
});
