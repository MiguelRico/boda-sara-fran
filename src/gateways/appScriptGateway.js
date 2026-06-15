import { Confirmation } from "@/models";
import {
  requestJsonp,
  sendToRsvpApi,
  verifyWrite,
} from "./appScriptClient";
import {
  getConfirmationComparable,
  getNotificationsComparable,
  getProvidersComparable,
  getTablesComparable,
  getTasksComparable,
  sameFingerprint,
} from "./appScriptFingerprints";
import {
  decodeConfirmationName,
  encodeConfirmationName,
} from "@/utils/confirmationNameCodec";

const decodeConfirmationPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const confirmationName = decodeConfirmationName(payload.confirmationName);

  return {
    ...payload,
    confirmationId: payload.confirmationId || payload.id || "",
    id: payload.confirmationId || payload.id || "",
    confirmationName,
    guests: Array.isArray(payload.guests)
      ? payload.guests.map((guest) => ({
          ...guest,
          confirmationName:
            decodeConfirmationName(guest.confirmationName) || confirmationName,
        }))
      : payload.guests,
  };
};

const decodeApiResponse = (response) => {
  if (Array.isArray(response)) {
    return response.map(decodeConfirmationPayload);
  }

  if (!response || typeof response !== "object") return response;

  return {
    ...decodeConfirmationPayload(response),
    confirmations: Array.isArray(response.confirmations)
      ? response.confirmations.map(decodeConfirmationPayload)
      : response.confirmations,
  };
};

const encodeConfirmationPayload = (confirmationInput) => {
  const confirmation = Confirmation.normalize(confirmationInput);
  const encodedConfirmationName = encodeConfirmationName(
    confirmation.confirmationName,
  );

  return {
    ...confirmation,
    confirmationId: confirmation.confirmationId || confirmation.id || "",
    confirmationName: encodedConfirmationName,
    guests: confirmation.guests.map((guest) => ({
      ...guest,
      confirmationName: encodedConfirmationName,
    })),
  };
};

export const findConfirmationById = async (confirmationId) => {
  return decodeApiResponse(
    await requestJsonp({
      confirmationId,
      entity: "confirmations",
      method: "GET",
    }),
  );
};

export const findConfirmationByEmail = async (email) => {
  return decodeApiResponse(
    await requestJsonp({
      email: String(email || "").trim(),
      entity: "confirmations",
      method: "GET",
    }),
  );
};

export const findConfirmationByPhone = async (phone) => {
  return decodeApiResponse(
    await requestJsonp({
      entity: "confirmations",
      method: "GET",
      phone: String(phone || "").trim(),
    }),
  );
};

export const findAllConfirmations = async ({ password } = {}) => {
  return decodeApiResponse(
    await requestJsonp({
      entity: "confirmations",
      method: "GET",
      password,
    }),
  );
};

export const findAllTables = async ({ password } = {}) => {
  return await requestJsonp({
    entity: "tables",
    method: "GET",
    password,
  });
};

export const findAllProviders = async ({ password } = {}) => {
  return await requestJsonp({
    entity: "providers",
    method: "GET",
    password,
  });
};

export const findAllNotifications = async ({ password } = {}) => {
  return await requestJsonp({
    entity: "notifications",
    method: "GET",
    password,
  });
};

export const findAllTasks = async ({ password } = {}) => {
  return await requestJsonp({
    entity: "tasks",
    method: "GET",
    password,
  });
};

export const savePublicConfirmation = async (payload, { method = "POST" } = {}) => {
  const confirmation = encodeConfirmationPayload(payload);
  const expectedConfirmation = getConfirmationComparable(payload);

  await sendToRsvpApi({
    ...confirmation,
    entity: "confirmations",
    method,
  });

  const verifiedResponse = await verifyWrite({
    errorMessage: "No se pudo verificar el guardado de la confirmacion.",
    isVerified: (response) =>
      response?.found !== false &&
      sameFingerprint(
        getConfirmationComparable(response),
        expectedConfirmation,
      ),
    read: () => {
      const normalizedPayload = Confirmation.normalize(payload);

      if (normalizedPayload.confirmationId || normalizedPayload.id) {
        return findConfirmationById(
          normalizedPayload.confirmationId || normalizedPayload.id,
        );
      }

      if (normalizedPayload.email) {
        return findConfirmationByEmail(normalizedPayload.email);
      }

      return findConfirmationByPhone(normalizedPayload.phone);
    },
  });

  return {
    success: true,
    confirmationId:
      verifiedResponse?.confirmationId ||
      responsePlaceholderConfirmationId(payload),
    confirmationName: Confirmation.normalize(payload).confirmationName,
  };
};

export const saveAdminConfirmation = async ({
  confirmation: confirmationInput,
  method = "PUT",
  password,
}) => {
  const confirmation = encodeConfirmationPayload(confirmationInput);
  const expectedConfirmation = getConfirmationComparable(confirmationInput);
  const payload = {
    ...confirmation,
    entity: "confirmations",
    method,
    password,
  };

  await sendToRsvpApi(payload);

  const verifiedResponse = await verifyWrite({
    errorMessage: "No se pudo verificar el guardado de la confirmacion.",
    isVerified: (response) =>
      response?.found !== false &&
      sameFingerprint(
        getConfirmationComparable(response),
        expectedConfirmation,
      ),
    read: () => {
      const normalizedConfirmation = Confirmation.normalize(confirmationInput);

      if (normalizedConfirmation.confirmationId || normalizedConfirmation.id) {
        return findConfirmationById(
          normalizedConfirmation.confirmationId || normalizedConfirmation.id,
        );
      }

      if (normalizedConfirmation.email) {
        return findConfirmationByEmail(normalizedConfirmation.email);
      }

      return findConfirmationByPhone(normalizedConfirmation.phone);
    },
  });

  return {
    success: true,
    confirmationId:
      verifiedResponse?.confirmationId ||
      responsePlaceholderConfirmationId(confirmationInput),
    confirmationName: Confirmation.normalize(confirmationInput).confirmationName,
  };
};

export const saveAdminTables = async ({ password, tables }) => {
  const expectedTables = getTablesComparable(tables);

  await sendToRsvpApi({
    entity: "tables",
    method: "PUT",
    password,
    tables,
  });

  await verifyWrite({
    errorMessage: "No se pudo verificar el guardado de las mesas.",
    isVerified: (response) =>
      sameFingerprint(getTablesComparable(response?.tables || []), expectedTables),
    read: () => findAllTables({ password }),
  });

  return {
    success: true,
    tables,
  };
};

export const deleteAdminConfirmation = async ({ confirmationId, password }) => {
  await sendToRsvpApi({
    entity: "confirmations",
    confirmationId,
    method: "DELETE",
    password,
  });

  await verifyWrite({
    errorMessage: "No se pudo verificar la eliminacion de la confirmacion.",
    isVerified: (response) => response?.found === false,
    read: () => findConfirmationById(confirmationId),
  });

  return {
    success: true,
    confirmationId,
  };
};

const responsePlaceholderConfirmationId = (confirmationInput) =>
  Confirmation.normalize(confirmationInput).confirmationId;

export const saveAdminProviders = async ({ password, providers }) => {
  const expectedProviders = getProvidersComparable(providers);

  await sendToRsvpApi({
    entity: "providers",
    method: "PUT",
    password,
    providers,
  });

  await verifyWrite({
    errorMessage: "No se pudo verificar el guardado de proveedores.",
    isVerified: (response) =>
      sameFingerprint(
        getProvidersComparable(response?.providers || []),
        expectedProviders,
      ),
    read: () => findAllProviders({ password }),
  });

  return {
    success: true,
    providers,
  };
};

export const saveAdminNotifications = async ({ notifications, password }) => {
  const expectedNotifications = getNotificationsComparable(notifications);

  await sendToRsvpApi({
    entity: "notifications",
    method: "PUT",
    notifications,
    password,
  });

  await verifyWrite({
    errorMessage: "No se pudo verificar el guardado de notificaciones.",
    isVerified: (response) =>
      sameFingerprint(
        getNotificationsComparable(response?.notifications || response || []),
        expectedNotifications,
      ),
    read: () => findAllNotifications({ password }),
  });

  return {
    success: true,
    notifications,
  };
};

export const saveAdminTasks = async ({ password, tasks }) => {
  const expectedTasks = getTasksComparable(tasks);

  await sendToRsvpApi({
    entity: "tasks",
    method: "PUT",
    password,
    tasks,
  });

  await verifyWrite({
    errorMessage: "No se pudo verificar el guardado de tareas.",
    isVerified: (response) =>
      sameFingerprint(getTasksComparable(response?.tasks || []), expectedTasks),
    read: () => findAllTasks({ password }),
  });

  return {
    success: true,
    tasks,
  };
};

export const updateAdminNotificationRead = async ({
  notificationId,
  password,
  read,
}) => {
  await sendToRsvpApi({
    entity: "notificationRead",
    method: "PUT",
    notificationId,
    password,
    read,
  });

  return {
    notificationId,
    read: Boolean(read),
    success: true,
  };
};

