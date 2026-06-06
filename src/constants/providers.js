export const PROVIDER_CATEGORIES = [
  { value: "catering", label: "Catering", emoji: "🍽️" },
  { value: "musica", label: "Música", emoji: "🎵" },
  { value: "dj", label: "DJ", emoji: "🎧" },
  { value: "iluminacion", label: "Iluminación", emoji: "💡" },
  { value: "floristeria", label: "Floristería", emoji: "🌿" },
  { value: "decoracion", label: "Decoración", emoji: "✨" },
  { value: "fotografia", label: "Fotografía", emoji: "📷" },
  { value: "video", label: "Vídeo", emoji: "🎥" },
  { value: "barra-libre", label: "Barra libre", emoji: "🥂" },
  { value: "regalos", label: "Regalos", emoji: "🎁" },
  { value: "wedding-planner", label: "Wedding planner", emoji: "📋" },
  { value: "alojamiento", label: "Alojamiento", emoji: "🏨" },
  { value: "transporte", label: "Transporte", emoji: "🚌" },
  { value: "otros", label: "Otros", emoji: "🧾" },
];

export const PROVIDER_CATEGORY_LABELS = Object.fromEntries(
  PROVIDER_CATEGORIES.map((category) => [category.value, category.label]),
);

export const PROVIDER_CATEGORY_EMOJIS = Object.fromEntries(
  PROVIDER_CATEGORIES.map((category) => [category.value, category.emoji]),
);

export const PROVIDER_PAYMENT_COUNT = 3;
