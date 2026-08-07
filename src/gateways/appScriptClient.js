import { getRequiredRsvpApiUrl } from "@/config/environment";

const inFlightRequests = new Map();
const READ_REQUEST_TIMEOUT_MS = 30000;
const WRITE_VERIFY_ATTEMPTS = 5;
const WRITE_VERIFY_DELAY_MS = 700;

const getRsvpApiUrl = getRequiredRsvpApiUrl;

const createRequestKey = (params) =>
  JSON.stringify(
    Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      )
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
  );

export const requestJsonp = (params) => {
  const requestKey = createRequestKey(params);
  const inFlightRequest = inFlightRequests.get(requestKey);

  if (inFlightRequest) return inFlightRequest;

  const url = new URL(getRsvpApiUrl());

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    READ_REQUEST_TIMEOUT_MS,
  );
  const request = fetch(url, {
    headers: { Accept: "application/json" },
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Apps Script devolvio HTTP ${response.status}.`);
      }

      return response.json();
    })
    .catch((error) => {
      throw new Error(
        `No se pudo consultar Apps Script. Revise la deployment, sus permisos y la URL configurada: ${url.toString()}`,
        { cause: error },
      );
    })
    .finally(() => {
      window.clearTimeout(timeoutId);
      inFlightRequests.delete(requestKey);
    });

  inFlightRequests.set(requestKey, request);

  return request;
};

export const sendToRsvpApi = async (payload) => {
  await fetch(getRsvpApiUrl(), {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload),
  });
};

const wait = (milliseconds) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

export const verifyWrite = async ({ errorMessage, isVerified, read }) => {
  let lastResponse;
  let lastReadError;

  for (let attempt = 1; attempt <= WRITE_VERIFY_ATTEMPTS; attempt += 1) {
    if (attempt > 1) {
      await wait(WRITE_VERIFY_DELAY_MS);
    }

    try {
      lastResponse = await read();
      lastReadError = null;
    } catch (error) {
      lastReadError = error;
      continue;
    }

    if (lastResponse?.success === false) {
      throw new Error(lastResponse.error || errorMessage);
    }

    if (isVerified(lastResponse)) return lastResponse;
  }

  throw new Error(errorMessage, { cause: lastReadError });
};
