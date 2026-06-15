import { RouterProvider } from "react-router-dom";
import AppErrorBoundary from "./components/ui/AppErrorBoundary";
import { router } from "./routes/router";
import { reportAppEnvironmentIssues } from "./config/environment";

export default function App() {
  reportAppEnvironmentIssues();

  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  );
}
