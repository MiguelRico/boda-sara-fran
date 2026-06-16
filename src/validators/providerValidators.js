import { Provider } from "../models";

const parseAmount = (value) =>
  Number(String(value || "").replace(",", ".")) || 0;

export const validateProvider = (provider) => {
  const normalizedProvider = Provider.normalize(provider);
  const errors = {};

  if (!normalizedProvider.name.trim()) errors.name = "El nombre es obligatorio";
  if (!normalizedProvider.phone.trim()) {
    errors.phone = "El teléfono es obligatorio";
  }

  if (!normalizedProvider.email.trim()) {
    errors.email = "El email es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedProvider.email)) {
    errors.email = "Introduce un email válido";
  }

  normalizedProvider.services.forEach((service, index) => {
    if (!service.name.trim()) {
      errors[`service_${index}_name`] = "El servicio necesita nombre";
    }

    if (!String(service.price).trim()) {
      errors[`service_${index}_price`] = "El precio es obligatorio";
    }

    const price = parseAmount(service.price);
    const paymentTotal = service.payments
      .slice(0, service.paymentCount)
      .reduce((total, payment) => total + parseAmount(payment.amount), 0);

    if (price > 0 && paymentTotal !== price) {
      errors[`service_${index}_payments`] =
        paymentTotal > price
          ? "La suma de los plazos supera el precio total"
          : "La suma de los plazos no alcanza el precio total";
    }
  });

  return errors;
};
