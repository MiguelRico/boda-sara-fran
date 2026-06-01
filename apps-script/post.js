/* eslint-disable */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const method = getRequestMethod(data);

    if (method === "POST") return routePost(data);
    if (method === "PUT") return routePut(data);
    if (method === "DELETE") return routeDelete(data);

    throw new Error("Method not supported");
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message,
    });
  }
}

function getRequestMethod(data) {
  const explicitMethod = String(data.method || "").trim();

  if (explicitMethod) return explicitMethod.toUpperCase();

  return "POST";
}

function getRequestEntity(data) {
  const explicitEntity = String(data.entity || "").trim();

  if (explicitEntity) return explicitEntity;

  return "";
}

function routePost(data) {
  const entity = getRequestEntity(data);

  if (entity === "confirmations") {
    return saveConfirmation(data);
  }

  throw new Error("Resource not supported");
}
