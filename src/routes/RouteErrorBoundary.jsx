import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import ErrorScreen from "../components/ui/ErrorScreen";
import { uiContent } from "../constants/uiContent";

function getRouteErrorContent(error) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        message: uiContent.error.notFoundMessage,
        title: uiContent.error.notFoundTitle,
      };
    }

    return {
      message: error.statusText || uiContent.error.message,
      title: uiContent.error.routeTitle(error.status),
    };
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : uiContent.error.message;

  return {
    message,
    title: uiContent.error.title,
  };
}

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const content = getRouteErrorContent(error);

  return <ErrorScreen message={content.message} title={content.title} />;
}
