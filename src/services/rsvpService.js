const getRsvpApiUrl = () => import.meta.env.VITE_RSVP_API_URL;

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  return await response.json();
};

export const findGroupByEmail = async (email) => {
  return await requestJson(`${getRsvpApiUrl()}?email=${email}`);
};

export const findGroupById = async (groupId) => {
  return await requestJson(`${getRsvpApiUrl()}?groupId=${groupId}`);
};

export const findAllGroups = async ({ password } = {}) => {
  const params = new URLSearchParams({
    action: "list",
  });

  if (password) {
    params.set("password", password);
  }

  return await requestJson(`${getRsvpApiUrl()}?${params.toString()}`);
};

export const saveGroup = async (payload) => {
  await fetch(getRsvpApiUrl(), {
    method: "POST",
    body: JSON.stringify(payload),
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

  await fetch(getRsvpApiUrl(), {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    success: true,
    email: group.email,
  };
};

export const deleteAdminGroup = async ({ groupId, password }) => {
  await fetch(getRsvpApiUrl(), {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      groupId,
      password,
    }),
  });

  return {
    success: true,
    groupId,
  };
};
