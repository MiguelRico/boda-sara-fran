import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Details from "../pages/Details";
import Rsvp from "../pages/Rsvp";

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
    ],
  },
]);
