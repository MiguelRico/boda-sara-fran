import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestPager from "../components/rsvp/GuestPager";
import {
  ContactSummaryCard,
  MobileActionsPanel,
  MobileGuestList,
  MobileRsvpReview,
} from "../components/rsvp/RsvpReview";
import { FieldError, FormCard } from "../components/rsvp/FormPrimitives";
import DeleteDialog from "../components/ui/DeleteDialog";
import IconButton from "../components/ui/IconButton";
import { MAX_GUESTS } from "../constants/rsvp";
import { rsvpContent } from "../constants/rsvpContent";
import { Guest } from "../models";
import useIsMobileView from "../hooks/useIsMobileView";

const defaultRenderItem = (_index, children) => children;

export default function RsvpForm({
  addText = rsvpContent.form.defaultAddText,
  cancelText = rsvpContent.form.defaultCancelText,
  cancelTo,
  canAddGuests = true,
  contact,
  deleteContextText = rsvpContent.form.defaultDeleteContext,
  disableContactFields = false,
  errors = {},
  formError = "",
  flowMode = "create",
  guests,
  isMobileView: forcedIsMobileView,
  loading = false,
  onAddGuest,
  onCancel,
  onContactChange,
  onGuestChange,
  onRemoveGuest,
  onSubmit,
  onValidateConfirmation,
  onValidateContact,
  renderItem = defaultRenderItem,
  showContactDetails = true,
  showEntityHeader = true,
  showGuestList = true,
  submitText = rsvpContent.form.defaultSubmitText,
  submitDisabled = false,
  variant = "public",
}) {
  const detectedIsMobileView = useIsMobileView();
  const isMobileView = forcedIsMobileView ?? detectedIsMobileView;
  const publicFlowIsMobileView = variant !== "admin" ? true : isMobileView;
  const [guestDeleteTarget, setGuestDeleteTarget] = useState(null);
  const [guestPage, setGuestPage] = useState(1);
  const [guestPageDirection, setGuestPageDirection] = useState(1);
  const guestDeleteName = guestDeleteTarget
    ? Guest.getFullName(guestDeleteTarget.guest)
    : "";
  const totalGuestPages = Math.max(guests.length, 1);
  const currentGuestPage = Math.min(guestPage, totalGuestPages);
  const currentGuestIndex = currentGuestPage - 1;
  const currentGuest = guests[currentGuestIndex];
  const hasInvalidGuest = Guest.hasInvalidGuests(guests);
  const addIcon = <UserPlus size={16} strokeWidth={1.8} />;
  const submitIcon =
    variant === "admin" ? (
      <Save size={16} strokeWidth={1.8} />
    ) : (
      <Save size={16} strokeWidth={1.8} />
    );
  const reviewSubmitText =
    variant === "admin" ? submitText : rsvpContent.form.reviewSubmitText;
  const cancelIcon =
    variant === "admin" ? (
      <X size={16} strokeWidth={1.8} />
    ) : (
      <ArrowLeft size={16} strokeWidth={1.8} />
    );

  const handleGuestPageChange = (nextPage) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalGuestPages);

    if (clampedPage === currentGuestPage) return;

    setGuestPageDirection(clampedPage > currentGuestPage ? 1 : -1);
    setGuestPage(clampedPage);
  };

  const handleAddGuest = () => {
    onAddGuest();
    setGuestPageDirection(1);
    setGuestPage(Math.min(guests.length + 1, MAX_GUESTS));
  };

  const handleConfirmGuestDelete = () => {
    if (!guestDeleteTarget) return;

    onRemoveGuest(guestDeleteTarget.index);
    setGuestPageDirection(-1);
    setGuestPage((current) =>
      Math.min(current, Math.max(guests.length - 1, 1)),
    );
    setGuestDeleteTarget(null);
  };
  const getGuestDeleteTarget = (guestOrIndex, index) => {
    const rawIndex = index ?? guestOrIndex;
    const resolvedIndex = Number(rawIndex);

    if (
      !Number.isInteger(resolvedIndex) ||
      resolvedIndex < 0 ||
      resolvedIndex >= guests.length
    ) {
      return null;
    }

    return {
      guest:
        index == null
          ? guests[resolvedIndex]
          : (guestOrIndex ?? guests[resolvedIndex]),
      index: resolvedIndex,
    };
  };
  const handleRemoveGuest = (guestOrIndex, index) => {
    const target = getGuestDeleteTarget(guestOrIndex, index);

    if (!target) return;

    if (variant !== "admin" && Guest.isEmpty(target.guest)) {
      onRemoveGuest(target.index);
      setGuestPageDirection(-1);
      setGuestPage((current) =>
        Math.min(current, Math.max(guests.length - 1, 1)),
      );
      return;
    }

    setGuestDeleteTarget(target);
  };
  const handleSubmit = (event) => {
    event.preventDefault();

    if (variant !== "admin") {
      const isValid = onValidateConfirmation
        ? onValidateConfirmation()
        : !hasInvalidGuest;

      if (!isValid) return;

      onSubmit(event);
      return;
    }

    onSubmit(event);
  };
  const isMobilePublicFlow = variant !== "admin";

  if (isMobilePublicFlow) {
    return (
      <>
        <MobilePublicRsvpFlow
          addIcon={addIcon}
          addText={addText}
          canAddGuests={canAddGuests}
          contact={contact}
          currentGuestPage={currentGuestPage}
          deleteContextText={deleteContextText}
          disableContactFields={disableContactFields}
          errors={errors}
          flowMode={flowMode}
          formError={formError}
          guestDeleteName={guestDeleteName}
          guestDeleteTarget={guestDeleteTarget}
          guestPageDirection={guestPageDirection}
          guests={guests}
          hasInvalidGuest={hasInvalidGuest}
          isMobileView={publicFlowIsMobileView}
          loading={loading}
          onAddGuest={handleAddGuest}
          onContactChange={onContactChange}
          onGuestChange={onGuestChange}
          onGuestPageChange={handleGuestPageChange}
          onRemoveGuest={handleRemoveGuest}
          onSubmit={handleSubmit}
          onValidateConfirmation={onValidateConfirmation}
          onValidateContact={onValidateContact}
          setGuestDeleteTarget={setGuestDeleteTarget}
          submitIcon={submitIcon}
          submitText={reviewSubmitText}
          totalGuestPages={totalGuestPages}
        />
      </>
    );
  }

  return (
    <>
      <form className="mt-4 space-y-6" noValidate onSubmit={handleSubmit}>
        {variant === "admin" && (
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
            <IconButton
              className="w-full"
              disabled={loading || submitDisabled}
              icon={submitIcon}
              keepTextOnAdminSubpages
              label={submitText}
              showText="always"
              tone="primary"
              type="submit"
            >
              {submitText}
            </IconButton>
          </div>
        )}

        {showContactDetails &&
          renderItem(
            1,
            <ContactDetailsCard
              contact={contact}
              disableFilledFields={disableContactFields}
              errors={errors}
              onContactChange={onContactChange}
              showHeader={showEntityHeader}
            />,
          )}

        {showGuestList &&
          currentGuest &&
          renderItem(
            2,
            <GuestPager
              addText={addText}
              canAddGuests={canAddGuests}
              canRemove={guests.length > 1}
              currentGuest={currentGuest}
              currentGuestIndex={currentGuestIndex}
              currentGuestPage={currentGuestPage}
              direction={guestPageDirection}
              errors={errors}
              guests={guests}
              hasInvalidGuest={hasInvalidGuest}
              isMobileView={isMobileView}
              loading={loading}
              onAddGuest={handleAddGuest}
              onGuestChange={onGuestChange}
              onGuestPageChange={handleGuestPageChange}
              onRemoveGuest={handleRemoveGuest}
              showHeader={showEntityHeader}
              totalGuestPages={totalGuestPages}
              variant={variant}
            />,
          )}

        {formError && <FieldError>{formError}</FieldError>}

        {variant !== "admin" &&
          renderItem(
            2 + guests.length,
            <FormCard>
              <p className="section-eyebrow mb-4">
                {rsvpContent.form.actionsEyebrow}
              </p>
              <div className="grid w-full grid-cols-2 gap-3">
                <IconButton
                  className="w-full"
                  disabled={loading}
                  icon={cancelIcon}
                  label={cancelText}
                  onClick={onCancel}
                  to={cancelTo}
                  tone="terciary"
                >
                  {cancelText}
                </IconButton>

                {canAddGuests && guests.length < MAX_GUESTS && (
                  <IconButton
                    className="w-full"
                    disabled={loading || hasInvalidGuest}
                    icon={addIcon}
                    label={addText}
                    onClick={handleAddGuest}
                    tone="secondary"
                  >
                    {addText}
                  </IconButton>
                )}

                <IconButton
                  className="w-full"
                  disabled={loading}
                  icon={submitIcon}
                  label={reviewSubmitText}
                  tone="primary"
                  type="submit"
                >
                  {reviewSubmitText}
                </IconButton>
              </div>
            </FormCard>,
          )}
      </form>

      {guestDeleteTarget && (
        <DeleteDialog
          message={rsvpContent.form.deleteGuestMessage({
            context: deleteContextText,
            guestName: guestDeleteName,
            guestNumber: guestDeleteTarget.index + 1,
          })}
          onCancel={() => setGuestDeleteTarget(null)}
          onConfirm={handleConfirmGuestDelete}
          title={rsvpContent.form.deleteGuestTitle}
        />
      )}
    </>
  );
}
function MobilePublicRsvpFlow({
  addIcon,
  addText,
  canAddGuests,
  contact,
  currentGuestPage,
  deleteContextText,
  disableContactFields,
  errors,
  flowMode,
  formError,
  guestDeleteName,
  guestDeleteTarget,
  guestPageDirection,
  guests,
  hasInvalidGuest,
  isMobileView,
  loading,
  onAddGuest,
  onContactChange,
  onGuestChange,
  onGuestPageChange,
  onRemoveGuest,
  onSubmit,
  onValidateConfirmation,
  onValidateContact,
  setGuestDeleteTarget,
  submitIcon,
  submitText,
  totalGuestPages,
}) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(flowMode === "edit" ? "review" : "contact");
  const canRemove = guests.length > 1;
  const currentGuestIndex = currentGuestPage - 1;
  const currentGuest = guests[currentGuestIndex];
  const stepVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      };

  const handleContinueToGuests = () => {
    if (onValidateContact && !onValidateContact()) return;

    setStep("guests");
  };
  const handleReview = () => {
    if (onValidateConfirmation && !onValidateConfirmation()) return;

    setStep("review");
  };
  const handleMobileSubmit = (event) => {
    if (step === "review") {
      onSubmit(event);
      return;
    }

    event.preventDefault();

    if (step === "contact") {
      handleContinueToGuests();
      return;
    }

    handleReview();
  };
  const handleRemoveGuest = (guest, index) => {
    if (Guest.isEmpty(guest)) {
      onRemoveGuest(index);
      onGuestPageChange(
        Math.min(currentGuestPage, Math.max(guests.length - 1, 1)),
      );
      return;
    }

    setGuestDeleteTarget({ guest, index });
  };
  const handleConfirmGuestDelete = () => {
    if (!guestDeleteTarget) return;

    onRemoveGuest(guestDeleteTarget.index);
    onGuestPageChange(
      Math.min(currentGuestPage, Math.max(guests.length - 1, 1)),
    );
    setGuestDeleteTarget(null);
  };
  const guestActionsClassName = canRemove
    ? "grid w-full grid-cols-3 gap-3"
    : "grid w-full grid-cols-2 gap-3";
  const guestActions = (
    <div className={guestActionsClassName}>
      {canRemove && (
        <IconButton
          className="w-full"
          icon={<Trash2 size={16} strokeWidth={1.8} />}
          label={rsvpContent.form.removeGuestLabel(currentGuestIndex + 1)}
          onClick={() =>
            currentGuest && handleRemoveGuest(currentGuest, currentGuestIndex)
          }
          tone="danger"
          type="button"
        />
      )}

      {canAddGuests && guests.length < MAX_GUESTS && (
        <IconButton
          className="w-full"
          disabled={loading || hasInvalidGuest}
          icon={addIcon}
          label={addText}
          onClick={onAddGuest}
          tone="secondary"
          type="button"
        >
          {addText}
        </IconButton>
      )}

      <IconButton
        className="w-full"
        disabled={loading}
        icon={<Check size={16} strokeWidth={1.8} />}
        label={rsvpContent.form.saveGuests}
        onClick={handleReview}
        tone="primary"
        type="button"
      >
        {rsvpContent.form.saveGuests}
      </IconButton>
    </div>
  );

  return (
    <>
      <form className="mt-4 space-y-5" noValidate onSubmit={handleMobileSubmit}>
        <AnimatePresence mode="wait">
          <motion.div
            animate="visible"
            exit="hidden"
            initial="hidden"
            key={step}
            transition={{ duration: reduceMotion ? 0.16 : 0.34 }}
            variants={stepVariants}
          >
            {step === "contact" && (
              <div className="space-y-5">
                <FormCard>
                  <div className="grid grid-cols-1">
                    <IconButton
                      className="w-full"
                      disabled={loading}
                      icon={<UserPlus size={16} strokeWidth={1.8} />}
                      label="Añadir invitados"
                      onClick={handleContinueToGuests}
                      showText="always"
                      tone="primary"
                      type="button"
                    >
                      Añadir invitados
                    </IconButton>
                  </div>
                </FormCard>

                <ContactDetailsCard
                  contact={contact}
                  disableFilledFields={disableContactFields}
                  errors={errors}
                  forceMobileLayout
                  onContactChange={onContactChange}
                />
              </div>
            )}

            {step === "guests" && (
              <div className="space-y-5">
                <ContactSummaryCard
                  contact={contact}
                  guests={guests}
                  onEdit={() => setStep("contact")}
                />

                <MobileActionsPanel>{guestActions}</MobileActionsPanel>

                <MobileGuestList
                  currentGuestPage={currentGuestPage}
                  errors={errors}
                  guestPageDirection={guestPageDirection}
                  guests={guests}
                  isMobileView={isMobileView}
                  onGuestChange={onGuestChange}
                  onGuestPageChange={onGuestPageChange}
                  totalPages={totalGuestPages}
                />
              </div>
            )}

            {step === "review" && (
              <MobileRsvpReview
                contact={contact}
                guests={guests}
                loading={loading}
                onEditContact={() => setStep("contact")}
                onEditGuests={() => setStep("guests")}
                submitIcon={submitIcon}
                submitText={submitText}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {formError && <FieldError>{formError}</FieldError>}
      </form>

      {guestDeleteTarget && (
        <DeleteDialog
          message={rsvpContent.form.deleteGuestMessage({
            context: deleteContextText,
            guestName: guestDeleteName,
            guestNumber: guestDeleteTarget.index + 1,
          })}
          onCancel={() => setGuestDeleteTarget(null)}
          onConfirm={handleConfirmGuestDelete}
          title={rsvpContent.form.deleteGuestTitle}
        />
      )}
    </>
  );
}
