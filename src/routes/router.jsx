import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import RouteErrorBoundary from "./RouteErrorBoundary";

const lazyPage = (loader) => async () => ({
  Component: (await loader()).default,
});

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/Home")),
      },
      {
        path: "details",
        lazy: lazyPage(() => import("../pages/Details")),
      },
      {
        path: "rsvp",
        lazy: lazyPage(() => import("../pages/Rsvp")),
      },
      {
        path: "rsvp/create",
        lazy: lazyPage(() => import("../pages/RsvpCreate")),
      },
      {
        path: "rsvp/edit",
        lazy: lazyPage(() => import("../pages/RsvpEdit")),
      },
      {
        path: "admin",
        lazy: lazyPage(() => import("../pages/Admin")),
      },
      {
        path: "admin/stats",
        lazy: lazyPage(() => import("../pages/AdminStats")),
      },
      {
        path: "admin/guests",
        lazy: lazyPage(() => import("../pages/AdminGuests")),
      },
      {
        path: "admin/tables",
        lazy: lazyPage(() => import("../pages/AdminTables")),
      },
      {
        path: "admin/providers",
        lazy: lazyPage(() => import("../pages/AdminProviders")),
      },
      {
        path: "admin/notifications",
        lazy: lazyPage(() => import("../pages/AdminNotifications")),
      },
      {
        path: "admin/tasks",
        lazy: lazyPage(() => import("../pages/AdminTasks")),
      },
    ],
  },
]);
