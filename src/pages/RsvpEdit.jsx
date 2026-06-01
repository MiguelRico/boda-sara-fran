import { useRef } from "react";
import { useInView } from "framer-motion";
import { Navigate, useSearchParams } from "react-router-dom";

import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import { siteContent } from "../config/siteContent";
import RsvpForm from "../forms/RsvpForm";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";
import { RsvpPageShell, RsvpStatus } from "./Rsvp";

export default function RsvpEdit() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner, { mode: "edit" });
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get("groupName");
  const rsvpRef = useRef(null);
  const rsvpInView = useInView(rsvpRef, {
    once: true,
    amount: 0.01,
  });
  const renderFormItem = (index, children) => (
    <CinematicStaggeredRevealItem
      index={index}
      isVisible={rsvpInView}
      key={index}
    >
      {children}
    </CinematicStaggeredRevealItem>
  );

  if (!groupName) {
    return <Navigate to="/rsvp" replace />;
  }

  return (
    <RsvpPageShell spinner={spinner} wrapperRef={rsvpRef}>
      <CinematicStaggeredRevealItem index={0} isVisible={rsvpInView}>
        <HeaderSection
          eyebrow={siteContent.rsvp.eyebrow}
          title="Modificar confirmación"
          titleAs="h1"
          text="Actualiza los invitados, alergias y transporte de vuestra confirmación."
        />
      </CinematicStaggeredRevealItem>

      <RsvpForm
        contact={rsvp.contact}
        disableContactFields={{ groupName: true }}
        errors={rsvp.errors}
        guests={rsvp.guests}
        loading={spinner.loading}
        onAddGuest={rsvp.handleAddGuest}
        onContactChange={rsvp.handleContactChange}
        onGuestChange={rsvp.handleGuestChange}
        onRemoveGuest={rsvp.handleRemoveGuest}
        onSubmit={rsvp.handleSubmit}
        renderItem={renderFormItem}
        cancelTo="/rsvp"
      />

      <RsvpStatus closePopup={rsvp.closePopup} popup={rsvp.popup} />
    </RsvpPageShell>
  );
}
