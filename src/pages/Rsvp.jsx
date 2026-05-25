import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicRevealItem from "../components/cinematic/CinematicRevealItem";
import CinematicSection from "../components/cinematic/CinematicSection";
import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import RsvpStatusDialog from "../components/rsvp/RsvpStatusDialog";
import SearchInvitationCard from "../components/rsvp/SearchInvitationCard";
import Spinner from "../components/spinner/Spinner";
import { MAX_GUESTS } from "../constants/rsvp";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";

export default function Rsvp() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner);

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <CinematicSection
        id="search"
        className="surface-soft"
        innerClassName="max-w-4xl"
      >
        <div>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="section-eyebrow">Sara & Fran</p>

            <h1 className="section-title">Confirmación de asistencia</h1>

            <p className="section-text">
              Estamos deseando celebrar este día con vosotros. Podéis confirmar
              vuestra asistencia y gestionar todos los invitados desde este
              formulario.
            </p>
          </div>

          {!rsvp.mode && !rsvp.hasGroupId && (
            <CinematicRevealItem delay={0.15}>
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
            </CinematicRevealItem>
          )}

          {rsvp.mode === "form" && (
            <form onSubmit={rsvp.handleSubmit} className="space-y-6">
              <ContactDetailsCard
                contact={rsvp.contact}
                errors={rsvp.errors}
                onContactChange={rsvp.handleContactChange}
              />

              {rsvp.guests.map((guest, index) => (
                <GuestCard
                  key={index}
                  canRemove={rsvp.guests.length > 1}
                  errors={rsvp.errors}
                  guest={guest}
                  index={index}
                  onGuestChange={rsvp.handleGuestChange}
                  onRemoveGuest={rsvp.handleRemoveGuest}
                />
              ))}

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
            </form>
          )}

          <RsvpStatusDialog popup={rsvp.popup} onClose={rsvp.closePopup} />
        </div>
      </CinematicSection>
    </CinematicPage>
  );
}
