import { useRef } from "react";
import { useInView } from "framer-motion";

import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import { rsvpContent } from "../constants/rsvpContent";
import { siteContent } from "../config/siteContent";
import RsvpForm from "../forms/RsvpForm";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";
import { RsvpPageShell, RsvpStatus } from "./Rsvp";

export default function RsvpCreate() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner, { mode: "create" });
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

  return (
    <RsvpPageShell
      forceMobileInner
      innerClassName="max-w-md md:max-w-none py-6"
      spinner={spinner}
      wrapperRef={rsvpRef}
    >
      <CinematicStaggeredRevealItem index={0} isVisible={rsvpInView}>
        <HeaderSection
          eyebrow={siteContent.rsvp.eyebrow}
          title={rsvpContent.createPage.title}
          titleAs="h1"
          text={siteContent.rsvp.text}
        />
      </CinematicStaggeredRevealItem>

      <RsvpForm
        contact={rsvp.contact}
        disableContactFields={{
          email: false,
          confirmationName: false,
          phone: false,
        }}
        errors={rsvp.errors}
        flowMode="create"
        guests={rsvp.guests}
        loading={spinner.loading}
        onAddGuest={rsvp.handleAddGuest}
        onContactChange={rsvp.handleContactChange}
        onGuestChange={rsvp.handleGuestChange}
        onRemoveGuest={rsvp.handleRemoveGuest}
        onSubmit={rsvp.handleSubmit}
        onValidateConfirmation={rsvp.validateConfirmationStep}
        onValidateContact={rsvp.validateContactStep}
        renderItem={renderFormItem}
        cancelTo="/rsvp"
      />

      <RsvpStatus closePopup={rsvp.closePopup} popup={rsvp.popup} />
    </RsvpPageShell>
  );
}

