import { useRef } from "react";
import { useInView } from "framer-motion";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/common/HeaderSection";
import PrimaryButton from "../components/common/PrimaryButton";
import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import { siteContent } from "../config/siteContent";
import { MAX_GUESTS } from "../constants/rsvp";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";
import { RsvpPageShell, RsvpStatus } from "./Rsvp";

export default function RsvpCreate() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner, { mode: "create" });

  return (
    <RsvpFormPage
      rsvp={rsvp}
      spinner={spinner}
      title="Crear confirmación"
      text={siteContent.rsvp.text}
    />
  );
}

export function RsvpFormPage({ rsvp, spinner, text, title }) {
  const rsvpRef = useRef(null);
  const rsvpInView = useInView(rsvpRef, {
    once: true,
    amount: 0.01,
  });

  return (
    <RsvpPageShell spinner={spinner} wrapperRef={rsvpRef}>
      <CinematicStaggeredRevealItem index={0} isVisible={rsvpInView}>
        <HeaderSection
          eyebrow={siteContent.rsvp.eyebrow}
          title={title}
          titleAs="h1"
          text={text}
        />
      </CinematicStaggeredRevealItem>

      <form className="mt-4 space-y-6" noValidate onSubmit={rsvp.handleSubmit}>
        <CinematicStaggeredRevealItem index={1} isVisible={rsvpInView}>
          <ContactDetailsCard
            contact={rsvp.contact}
            disableFilledFields={false}
            errors={rsvp.errors}
            onContactChange={rsvp.handleContactChange}
          />
        </CinematicStaggeredRevealItem>

        {rsvp.guests.map((guest, index) => (
          <CinematicStaggeredRevealItem
            index={2 + index}
            key={index}
            isVisible={rsvpInView}
          >
            <GuestCard
              canRemove={rsvp.guests.length > 1}
              errors={rsvp.errors}
              guest={guest}
              index={index}
              onGuestChange={rsvp.handleGuestChange}
              onRemoveGuest={rsvp.handleRemoveGuest}
            />
          </CinematicStaggeredRevealItem>
        ))}

        <CinematicStaggeredRevealItem
          index={2 + rsvp.guests.length}
          isVisible={rsvpInView}
        >
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3">
            {rsvp.totalGuests < MAX_GUESTS && (
              <button
                type="button"
                disabled={spinner.loading}
                onClick={rsvp.handleAddGuest}
                className="btn-secondary disabled:opacity-50"
              >
                Añadir invitado
              </button>
            )}

            <button
              type="button"
              onClick={rsvp.handleSubmit}
              disabled={spinner.loading}
              className="btn-primary disabled:opacity-50"
            >
              Confirmar asistencia
            </button>

            <PrimaryButton to="/rsvp" variant="secondary">
              Volver
            </PrimaryButton>
          </div>
        </CinematicStaggeredRevealItem>
      </form>

      <RsvpStatus closePopup={rsvp.closePopup} popup={rsvp.popup} />
    </RsvpPageShell>
  );
}
