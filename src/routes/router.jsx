import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Details from "../pages/Details";
import Rsvp from "../pages/Rsvp";
import Admin from "../pages/Admin";
import AdminStats from "../pages/AdminStats";
import AdminGuests from "../pages/AdminGuests";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "details",
        element: <Details />,
      },
      {
        path: "rsvp",
        element: <Rsvp />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "admin/stats",
        element: <AdminStats />,
      },
      {
        path: "admin/guests",
        element: <AdminGuests />,
      },
    ],
  },
]);
