import { getRequiredRsvpApiUrl } from "@/config/environment";

const inFlightJsonpRequests = new Map();
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
      reject(
        new Error(
          `No se pudo conectar con Google Apps Script. URL: ${url.toString()}`,
        ),
      );
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      delete window[callbackName];
    };

    const rejectWithRemoteError = (message) => {
      cleanup();
      reject(new Error(message));
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
      rejectWithRemoteError(
        `No se pudo cargar la URL de Apps Script. Revise la deployment o la URL configurada: ${url.toString()}`,
      );
    };

    script.onload = () => {
      window.setTimeout(() => {
        if (window[callbackName]) {
          rejectWithRemoteError(
            `Apps Script respondió pero no ejecutó el callback esperado. Revise la deployment y los permisos de ejecución del endpoint: ${url.toString()}`,
          );
        }
      }, 250);
    };

    script.src = url.toString();
    document.body.appendChild(script);
  }).finally(() => {
    inFlightJsonpRequests.delete(requestKey);
  });

  inFlightJsonpRequests.set(requestKey, request);

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

  for (let attempt = 1; attempt <= WRITE_VERIFY_ATTEMPTS; attempt += 1) {
    if (attempt > 1) {
      await wait(WRITE_VERIFY_DELAY_MS);
    }

    lastResponse = await read();

    if (lastResponse?.success === false) {
      throw new Error(lastResponse.error || errorMessage);
    }

    if (isVerified(lastResponse)) return lastResponse;
  }

  throw new Error(errorMessage);
};
