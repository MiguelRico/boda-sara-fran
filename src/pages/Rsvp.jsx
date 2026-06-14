import { useRef } from "react";
import { useInView } from "framer-motion";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/ui/HeaderSection";
import CreateInvitationCard from "../components/rsvp/CreateInvitationCard";
import StatusDialog from "../components/ui/StatusDialog";
import SearchInvitationCard from "../components/rsvp/SearchInvitationCard";
import Spinner from "../components/ui/Spinner";
import { siteContent } from "../constants/siteContent";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";

export default function Rsvp() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner, { mode: "search" });
  const rsvpRef = useRef(null);
  const rsvpInView = useInView(rsvpRef, {
    once: true,
    amount: 0.35,
  });

  return (
    <RsvpPageShell spinner={spinner} wrapperRef={rsvpRef}>
      <CinematicStaggeredRevealItem index={0} isVisible={rsvpInView}>
        <HeaderSection
          eyebrow={siteContent.rsvp.eyebrow}
          title={siteContent.rsvp.title}
          titleAs="h1"
          text={siteContent.rsvp.text}
          hideTextOnMobile={true}
        />
      </CinematicStaggeredRevealItem>

      <CinematicStaggeredRevealItem index={1} isVisible={rsvpInView}>
        <div className="mt-4">
          <CreateInvitationCard
            hideTextOnMobile={true}
            onCreateNew={rsvp.handleCreateNew}
          />

          <SearchInvitationCard
            hideTextOnMobile={true}
            email={rsvp.contact.email}
            emailError={rsvp.errors.email}
            loading={spinner.loading}
            onEmailChange={(value) => rsvp.handleContactChange("email", value)}
            onPhoneChange={(value) => rsvp.handleContactChange("phone", value)}
            onSearchInvitation={rsvp.handleSearchInvitation}
            phone={rsvp.contact.phone}
            phoneError={rsvp.errors.phone}
          />
        </div>
      </CinematicStaggeredRevealItem>

      <RsvpStatus closePopup={rsvp.closePopup} popup={rsvp.popup} />
    </RsvpPageShell>
  );
}

export function RsvpPageShell({
  children,
  innerClassName = "max-w-4xl py-6",
  spinner,
  wrapperRef,
}) {
  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <CinematicSection
        id="search"
        className="surface-soft"
        innerClassName={innerClassName}
        reveal={false}
      >
        <div ref={wrapperRef}>{children}</div>
      </CinematicSection>
    </CinematicPage>
  );
}

export function RsvpStatus({ closePopup, popup }) {
  return (
    <StatusDialog
      closeText={popup.closeText}
      closeTo={popup.closeTo}
      eyebrow={popup.eyebrow}
      message={popup.message}
      onClose={closePopup}
      open={popup.open}
      title={popup.title}
      type={popup.type}
    />
  );
}
