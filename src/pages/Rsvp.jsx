import { useInView } from "framer-motion";
import { useRef } from "react";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import RsvpStatusDialog from "../components/rsvp/RsvpStatusDialog";
import SearchInvitationCard from "../components/rsvp/SearchInvitationCard";
import Spinner from "../components/ui/Spinner";
import { MAX_GUESTS } from "../constants/rsvp";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";

export default function Rsvp() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner);
  const rsvpRef = useRef(null);
  const rsvpInView = useInView(rsvpRef, {
    once: true,
    amount: 0.35,
  });

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <CinematicSection
        id="search"
        className="surface-soft"
        innerClassName="max-w-4xl"
        reveal={false}
      >
        <div ref={rsvpRef}>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <CinematicStaggeredRevealItem index={0} isVisible={rsvpInView}>
              <p className="section-eyebrow">Sara & Fran</p>
            </CinematicStaggeredRevealItem>

            <CinematicStaggeredRevealItem index={1} isVisible={rsvpInView}>
              <h1 className="section-title">Confirmación de asistencia</h1>
            </CinematicStaggeredRevealItem>

            <CinematicStaggeredRevealItem index={2} isVisible={rsvpInView}>
              <p className="section-text">
                Estamos deseando celebrar este día con vosotros. Podéis
                confirmar vuestra asistencia y gestionar todos los invitados
                desde este formulario.
              </p>
            </CinematicStaggeredRevealItem>
          </div>

          {!rsvp.mode && !rsvp.hasGroupId && (
            <CinematicStaggeredRevealItem index={3} isVisible={rsvpInView}>
              <SearchInvitationCard
                email={rsvp.contact.email}
                emailError={rsvp.errors.email}
                loading={spinner.loading}
                onCreateNew={rsvp.handleCreateNew}
                onEmailChange={(value) =>
                  rsvp.handleContactChange("email", value)
                }
                onSearchInvitation={rsvp.handleSearchInvitation}
              />
            </CinematicStaggeredRevealItem>
          )}

          {rsvp.mode === "form" && (
            <form onSubmit={rsvp.handleSubmit} className="space-y-6">
              <CinematicStaggeredRevealItem index={3} isVisible={rsvpInView}>
                <ContactDetailsCard
                  contact={rsvp.contact}
                  errors={rsvp.errors}
                  onContactChange={rsvp.handleContactChange}
                />
              </CinematicStaggeredRevealItem>

              {rsvp.guests.map((guest, index) => (
                <CinematicStaggeredRevealItem
                  key={index}
                  index={4 + index}
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
                index={4 + rsvp.guests.length}
                isVisible={rsvpInView}
              >
                <div className="flex flex-col gap-4">
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
                    type="submit"
                    disabled={spinner.loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    Confirmar asistencia
                  </button>
                </div>
              </CinematicStaggeredRevealItem>
            </form>
          )}

          <RsvpStatusDialog popup={rsvp.popup} onClose={rsvp.closePopup} />
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}
