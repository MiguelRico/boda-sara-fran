import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicSection from "../components/cinematic/CinematicSection";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import HeaderSection from "../components/common/HeaderSection";
import CreateInvitationCard from "../components/rsvp/CreateInvitationCard";
import RsvpStatusDialog from "../components/rsvp/RsvpStatusDialog";
import SearchInvitationCard from "../components/rsvp/SearchInvitationCard";
import Spinner from "../components/spinner/Spinner";
import { siteContent } from "../config/siteContent";
import useRsvp from "../hooks/useRsvp";
import useSpinner from "../hooks/useSpinner.js";

export default function Rsvp() {
  const spinner = useSpinner();
  const rsvp = useRsvp(spinner, { mode: "search" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rsvpRef = useRef(null);
  const rsvpInView = useInView(rsvpRef, {
    once: true,
    amount: 0.35,
  });

  useEffect(() => {
    const groupId = searchParams.get("groupId");

    if (groupId) {
      navigate(`/rsvp/edit?groupId=${encodeURIComponent(groupId)}`, {
        replace: true,
      });
    }
  }, [navigate, searchParams]);

  return (
    <RsvpPageShell spinner={spinner} wrapperRef={rsvpRef}>
      <CinematicStaggeredRevealItem index={0} isVisible={rsvpInView}>
        <HeaderSection
          eyebrow={siteContent.rsvp.eyebrow}
          title={siteContent.rsvp.title}
          titleAs="h1"
          text={siteContent.rsvp.text}
        />
      </CinematicStaggeredRevealItem>

      <CinematicStaggeredRevealItem index={1} isVisible={rsvpInView}>
        <div className="mt-4">
          <CreateInvitationCard onCreateNew={rsvp.handleCreateNew} />

          <SearchInvitationCard
            email={rsvp.contact.email}
            emailError={rsvp.errors.email}
            loading={spinner.loading}
            onEmailChange={(value) => rsvp.handleContactChange("email", value)}
            onSearchInvitation={rsvp.handleSearchInvitation}
          />
        </div>
      </CinematicStaggeredRevealItem>

      <RsvpStatus
        closePopup={rsvp.closePopup}
        popup={rsvp.popup}
      />
    </RsvpPageShell>
  );
}

export function RsvpPageShell({ children, spinner, wrapperRef }) {
  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <CinematicSection
        id="search"
        className="surface-soft"
        innerClassName="max-w-4xl py-6"
        reveal={false}
      >
        <div ref={wrapperRef}>{children}</div>
      </CinematicSection>
    </CinematicPage>
  );
}

export function RsvpStatus({ closePopup, popup }) {
  return (
    <RsvpStatusDialog
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
