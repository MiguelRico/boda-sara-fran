export const PROVIDER_CATEGORIES = [
  { value: "catering", label: "Catering" },
  { value: "musica", label: "Música" },
  { value: "dj", label: "DJ" },
  { value: "iluminacion", label: "Iluminación" },
  { value: "floristeria", label: "Floristería" },
  { value: "decoracion", label: "Decoración" },
  { value: "fotografia", label: "Fotografía" },
  { value: "video", label: "Vídeo" },
  { value: "barra-libre", label: "Barra libre" },
  { value: "regalos", label: "Regalos" },
  { value: "wedding-planner", label: "Wedding planner" },
  { value: "alojamiento", label: "Alojamiento" },
  { value: "otros", label: "Otros" },
];

export const PROVIDER_CATEGORY_LABELS = Object.fromEntries(
  PROVIDER_CATEGORIES.map((category) => [category.value, category.label]),
);

export const PROVIDER_PAYMENT_COUNT = 3;
