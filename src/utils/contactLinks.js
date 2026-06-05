export function getEmailHref(email) {
  const normalizedEmail = String(email || "").trim();

  return normalizedEmail ? `mailto:${normalizedEmail}` : "";
}

export function getPhoneHref(phone) {
  const normalizedPhone = String(phone || "").replace(/[^\d+]/g, "");

  return normalizedPhone ? `tel:${normalizedPhone}` : "";
}
