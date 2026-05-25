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
