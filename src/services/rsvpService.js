const getRsvpApiUrl = () => import.meta.env.VITE_RSVP_API_URL;

const requestJsonp = (params) =>
  new Promise((resolve, reject) => {
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
  });

const sendToRsvpApi = async (payload) => {
  await fetch(getRsvpApiUrl(), {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload),
  });
};

export const findGroupByEmail = async (email) => {
  return await requestJsonp({
    action: "search",
    groupId: email,
  });
};

export const findGroupById = async (groupId) => {
  return await requestJsonp({
    action: "search",
    groupId,
  });
};

export const findAllGroups = async ({ password } = {}) => {
  return await requestJsonp({
    action: "list",
    password,
  });
};

export const saveGroup = async (payload) => {
  await sendToRsvpApi({
    ...payload,
    action: "save",
  });

  return {
    success: true,
    email: payload.email,
  };
};

export const saveAdminGroup = async ({ group, password }) => {
  const payload = {
    ...group,
    action: "save",
    password,
  };

  await sendToRsvpApi(payload);

  return {
    success: true,
    email: group.email,
  };
};

export const deleteAdminGroup = async ({ groupId, password }) => {
  await sendToRsvpApi({
    action: "delete",
    groupId,
    password,
  });

  return {
    success: true,
    groupId,
  };
};
