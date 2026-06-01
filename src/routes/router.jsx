import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Details from "../pages/Details";
import Rsvp from "../pages/Rsvp";
import RsvpCreate from "../pages/RsvpCreate";
import RsvpEdit from "../pages/RsvpEdit";
import Admin from "../pages/Admin";
import AdminStats from "../pages/AdminStats";
import AdminGuests from "../pages/AdminGuests";
import AdminTables from "../pages/AdminTables";

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
        path: "rsvp/create",
        element: <RsvpCreate />,
      },
      {
        path: "rsvp/edit",
        element: <RsvpEdit />,
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
      {
        path: "admin/tables",
        element: <AdminTables />,
      },
    ],
  },
]);
