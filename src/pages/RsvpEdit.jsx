import { Navigate, useSearchParams } from "react-router-dom";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";
import { RsvpFormPage } from "./RsvpCreate";

export default function RsvpEdit() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner, { mode: "edit" });
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return <Navigate to="/rsvp" replace />;
  }

  return (
    <RsvpFormPage
      rsvp={rsvp}
      spinner={spinner}
      title="Modificar confirmación"
      text="Actualiza los datos de contacto, invitados, alergias y transporte de vuestra confirmación."
    />
  );
}
