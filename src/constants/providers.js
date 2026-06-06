export const PROVIDER_CATEGORIES = [
  { value: "catering", label: "Catering", icon: "utensils" },
  { value: "musica", label: "Música", icon: "music" },
  { value: "dj", label: "DJ", icon: "headphones" },
  { value: "iluminacion", label: "Iluminación", icon: "lightbulb" },
  { value: "floristeria", label: "Floristería", icon: "flower" },
  { value: "decoracion", label: "Decoración", icon: "sparkles" },
  { value: "fotografia", label: "Fotografía", icon: "camera" },
  { value: "video", label: "Vídeo", icon: "video" },
  { value: "barra-libre", label: "Barra libre", icon: "glass" },
  { value: "regalos", label: "Regalos", icon: "gift" },
  { value: "wedding-planner", label: "Wedding planner", icon: "clipboard" },
  { value: "alojamiento", label: "Alojamiento", icon: "hotel" },
  { value: "transporte", label: "Transporte", icon: "bus" },
  { value: "otros", label: "Otros", icon: "receipt" },
];

export const PROVIDER_CATEGORY_LABELS = Object.fromEntries(
  PROVIDER_CATEGORIES.map((category) => [category.value, category.label]),
);

export const PROVIDER_CATEGORY_ICONS = Object.fromEntries(
  PROVIDER_CATEGORIES.map((category) => [category.value, category.icon]),
);

export const PROVIDER_PAYMENT_COUNT = 3;
