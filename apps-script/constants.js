/* eslint-disable */
const SHEET_NAME = "Invitados";
const TABLES_SHEET_NAME = "Mesas";
const SPREADSHEET_ID = "1bNNIgd7F-tsmKtKu_vChwIJP8DabGOW1wXWlzPvxRdM";
const ADMIN_PASSWORD = "sara-fran-admin";
const ADMIN_EMAIL = "miguel.rico.vazquez@gmail.com";
const APP_BASE_URL = "https://boda-sara-fran.vercel.app";
const RSVP_URL = `${APP_BASE_URL}/rsvp`;
const GUEST_LIST_URL =
  "https://docs.google.com/spreadsheets/d/1MXYeIf-c0LoSuILonx8nNjYUmkJkVn5I38OBj0OKmyE/edit?gid=0#gid=0";

const COLOR_BG = "#f5f8f2";
const COLOR_BG_SOFT = "#edf3e8";
const COLOR_BG_WARM = "#dfe8d7";
const COLOR_TEXT = "#2d332c";
const COLOR_MUTED = "#6d7669";
const COLOR_ACCENT = "#6f8b6b";
const COLOR_ACCENT_DARK = "#556b52";
const COLOR_BORDER = "#d7e2d0";
const COLOR_BORDER_STRONG = "#bccdb5";

const EMAIL_COPY = {
  brand: "Sara & Fran",
  footer: "Confirmación automática de asistencia",
  fallback: {
    noAllergies: "Ninguna",
    noComments: "Sin comentarios",
    noBus: "No",
  },
  confirmation: {
    subject: "Confirmación boda Sara & Fran",
    preheader: "Hemos recibido correctamente vuestra asistencia.",
    eyebrow: "Sara & Fran",
    title: "Confirmación recibida",
    intro:
      "¡Gracias por confirmar! Nos hace muchísima ilusión compartir este día con vosotros.",
    guestsTitle: "Invitados confirmados",
    editText: "Revisa o modifica vuestra invitación desde el siguiente enlace:",
    cta: "Gestionar invitación",
    closing: "Os esperamos con muchísima ilusión,",
    plain:
      "Hemos recibido correctamente vuestra confirmación. Podéis gestionar vuestra invitación aquí:",
  },
  admin: {
    subject: "Nueva confirmación boda Sara & Fran",
    eyebrow: "Sara & Fran",
    title: "Nueva confirmación recibida",
    groupNameLabel: "Nombre grupo",
    emailLabel: "Email",
    phoneLabel: "Teléfono",
    guestsTitle: "Invitados",
    checkListTitle: "Revisa el panel de administración",
    checkListText: "Accede al panel para consultar y gestionar los invitados:",
    checkListCta: "Abrir administración",
    labels: {
      name: "Nombre",
      menu: "Menú",
      bus: "Autobús",
      outbound: "Ida",
      return: "Vuelta",
      allergies: "Alergias",
      otherAllergies: "Otras alergias",
      comments: "Comentarios",
    },
  },
};
