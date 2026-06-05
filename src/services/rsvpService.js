import { Confirmation } from "../models";
import { decodeGroupName, encodeGroupName } from "../utils/groupNameCodec";

const getRsvpApiUrl = () => import.meta.env.VITE_RSVP_API_URL;
const inFlightJsonpRequests = new Map();

const createRequestKey = (params) =>
  JSON.stringify(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
  );

const requestJsonp = (params) => {
  const requestKey = createRequestKey(params);
  const inFlightRequest = inFlightJsonpRequests.get(requestKey);

  if (inFlightRequest) return inFlightRequest;

  const request = new Promise((resolve, reject) => {
    const callbackName = `rsvpCallback_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const url = new URL(getRsvpApiUrl());
    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("La peticion a Google Apps Script ha caducado."));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      delete window[callbackName];
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    url.searchParams.set("callback", callbackName);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo conectar con Google Apps Script."));
    };
    script.src = url.toString();
    document.body.appendChild(script);
  }).finally(() => {
    inFlightJsonpRequests.delete(requestKey);
  });

  inFlightJsonpRequests.set(requestKey, request);

  return request;
};

const sendToRsvpApi = async (payload) => {
  await fetch(getRsvpApiUrl(), {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload),
  });
};

const decodeConfirmationPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const groupName = decodeGroupName(payload.groupName);

  return {
    ...payload,
    confirmationId: payload.confirmationId || payload.id || "",
    id: payload.confirmationId || payload.id || "",
    groupName,
    guests: Array.isArray(payload.guests)
      ? payload.guests.map((guest) => ({
          ...guest,
          groupName: decodeGroupName(guest.groupName) || groupName,
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
    groups: Array.isArray(response.groups)
      ? response.groups.map(decodeConfirmationPayload)
      : response.groups,
  };
};

const encodeConfirmationPayload = (group) => {
  const confirmation = Confirmation.normalize(group);
  const encodedGroupName = encodeGroupName(confirmation.groupName);

  return {
    ...confirmation,
    confirmationId: confirmation.confirmationId || confirmation.id || "",
    groupName: encodedGroupName,
    guests: confirmation.guests.map((guest) => ({
      ...guest,
      groupName: encodedGroupName,
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

export const findGroupByEmail = async (email) => {
  return decodeApiResponse(
    await requestJsonp({
      email: String(email || "").trim(),
      entity: "confirmations",
      method: "GET",
    }),
  );
};

export const findGroupByPhone = async (phone) => {
  return decodeApiResponse(
    await requestJsonp({
      entity: "confirmations",
      method: "GET",
      phone: String(phone || "").trim(),
    }),
  );
};

export const findAllGroups = async ({ password } = {}) => {
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

export const saveGroup = async (payload, { method = "POST" } = {}) => {
  const confirmation = encodeConfirmationPayload(payload);

  await sendToRsvpApi({
    ...confirmation,
    entity: "confirmations",
    method,
  });

  return {
    success: true,
    confirmationId: responsePlaceholderConfirmationId(payload),
    groupName: Confirmation.normalize(payload).groupName,
  };
};

export const saveAdminGroup = async ({ group, method = "PUT", password }) => {
  const confirmation = encodeConfirmationPayload(group);
  const payload = {
    ...confirmation,
    entity: "confirmations",
    method,
    password,
  };

  await sendToRsvpApi(payload);

  return {
    success: true,
    confirmationId: responsePlaceholderConfirmationId(group),
    groupName: Confirmation.normalize(group).groupName,
  };
};

export const saveAdminTables = async ({ password, tables }) => {
  await sendToRsvpApi({
    entity: "tables",
    method: "PUT",
    password,
    tables,
  });

  return {
    success: true,
    tables,
  };
};

export const deleteAdminGroup = async ({ confirmationId, password }) => {
  await sendToRsvpApi({
    entity: "confirmations",
    confirmationId,
    method: "DELETE",
    password,
  });

  return {
    success: true,
    confirmationId,
  };
};

const responsePlaceholderConfirmationId = (group) =>
  Confirmation.normalize(group).confirmationId;

export const saveAdminProviders = async ({ password, providers }) => {
  await sendToRsvpApi({
    entity: "providers",
    method: "PUT",
    password,
    providers,
  });

  return {
    success: true,
    providers,
  };
};
