import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  MailCheck,
  Pencil,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import AdminTableSection from "../components/admin/AdminTableSection";
import { FieldError, FormCard } from "../components/rsvp/FormPrimitives";
import DeleteDialog from "../components/ui/DeleteDialog";
import Chip from "../components/ui/Chip";
import IconButton from "../components/ui/IconButton";
import PaginatedContent from "../components/ui/PaginatedContent";
import Pagination from "../components/ui/Pagination";
import { MAX_GUESTS } from "../constants/rsvp";
import { adminContent } from "../constants/adminContent";
import { rsvpContent } from "../constants/rsvpContent";
import { Guest } from "../models";
import {
  getGroupSummaryChips,
  getGuestSummaryChips,
} from "../utils/rsvpSummaryChips";
import useIsMobileView from "../hooks/useIsMobileView";
import useViewportScrollLock from "../hooks/useViewportScrollLock";

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
  showGuestList = true,
  submitText = rsvpContent.form.defaultSubmitText,
  variant = "public",
}) {
  const detectedIsMobileView = useIsMobileView();
  const isMobileView = forcedIsMobileView ?? detectedIsMobileView;
  const publicFlowIsMobileView = variant !== "admin" ? true : isMobileView;
  const [guestDeleteTarget, setGuestDeleteTarget] = useState(null);
  const [guestPage, setGuestPage] = useState(1);
  const [guestPageDirection, setGuestPageDirection] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
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
  const reviewSubmitText = variant === "admin" ? submitText : "Guardar";
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
  const handleRemoveGuest = (guest, index) => {
    setGuestDeleteTarget({ guest, index });
  };
  const openReviewDialog = () => {
    const isValid = onValidateConfirmation
      ? onValidateConfirmation()
      : !hasInvalidGuest;

    if (!isValid) return;

    setReviewDialogOpen(true);
  };
  const handleSubmit = (event) => {
    event.preventDefault();

    if (variant !== "admin") {
      openReviewDialog();
      return;
    }

    onSubmit(event);
  };
  const handleConfirmSubmit = () => {
    setReviewDialogOpen(false);
    onSubmit({ preventDefault: () => {} });
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
        {reviewDialogOpen && (
          <RsvpConfirmationReviewDialog
            contact={contact}
            guests={guests}
            loading={loading}
            onCancel={() => setReviewDialogOpen(false)}
            onConfirm={handleConfirmSubmit}
            submitText="Enviar"
          />
        )}
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
              disabled={loading}
              icon={submitIcon}
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
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
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

      {reviewDialogOpen && (
        <RsvpConfirmationReviewDialog
          contact={contact}
          guests={guests}
          loading={loading}
          onCancel={() => setReviewDialogOpen(false)}
          onConfirm={handleConfirmSubmit}
          submitText="Enviar"
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
        label="Guardar invitados"
        onClick={handleReview}
        tone="primary"
        type="button"
      >
        Guardar invitados
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

                <AdminTableSection
                  eyebrow={adminContent.guests.editor.guestListEyebrow}
                  getKey={(_guest, { index }) => index}
                  isMobileView={isMobileView}
                  items={guests}
                  lockPageHeight={false}
                  mobilePageLabel={adminContent.guests.editor.guestListTitle}
                  onNextPage={() => onGuestPageChange(currentGuestPage + 1)}
                  onPrevPage={() => onGuestPageChange(currentGuestPage - 1)}
                  page={currentGuestPage}
                  pageDirection={guestPageDirection}
                  paginationLabel={rsvpContent.form.guestPageLabel({
                    page: currentGuestPage,
                    total: totalGuestPages,
                  })}
                  pageSize={1}
                  renderPage={(items, pageNumber) => (
                    <div className="h-full rounded-[2rem] ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]">
                      <GuestCard
                        canRemove={false}
                        card
                        errors={errors}
                        forceMobileLayout
                        guest={items[0]}
                        index={pageNumber - 1}
                        onGuestChange={onGuestChange}
                        onRemoveGuest={() => {}}
                        showHeader={false}
                        variant="public"
                      />
                    </div>
                  )}
                  title={adminContent.guests.editor.guestListTitle}
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

function ContactSummaryCard({ contact, guests, onEdit }) {
  const chips = getGroupSummaryChips(contact, guests);

  return (
    <FormCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow mb-2">Datos de contacto</p>
          <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
            {contact.confirmationName || "Grupo sin nombre"}
          </h2>
        </div>
        <IconButton
          icon={<Pencil size={16} strokeWidth={1.8} />}
          label="Editar datos"
          onClick={onEdit}
          tone="secondary"
          type="button"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chips.map((chip) => (
          <Chip
            className={chip.className}
            href={chip.href}
            icon={chip.icon}
            key={chip.key}
            strong={chip.strong}
            tone={chip.tone}
            value={chip.value}
            valueClassName={chip.valueClassName}
          />
        ))}
      </div>
    </FormCard>
  );
}

function MobileActionsPanel({ children }) {
  return (
    <div className="mt-0 mb-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
      {children}
    </div>
  );
}

function MobileRsvpReview({
  contact,
  guests,
  loading,
  onEditContact,
  onEditGuests,
  submitIcon,
  submitText,
}) {
  return (
    <div className="space-y-5">
      <div className="relative mb-0 items-center justify-center text-center">
        <p className="section-text">
          Revisa tus datos de contacto e invitados antes de confirmar
        </p>
      </div>

      <MobileActionsPanel>
        <IconButton
          className="w-full"
          disabled={loading}
          icon={submitIcon}
          label={submitText}
          showText="always"
          tone="primary"
          type="submit"
        >
          {submitText}
        </IconButton>
      </MobileActionsPanel>

      <ContactSummaryCard
        contact={contact}
        guests={guests}
        onEdit={onEditContact}
      />

      <FormCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Invitados confirmados</p>
            <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
              {guests.length} Invitados
            </h2>
          </div>
          <IconButton
            icon={<Pencil size={16} strokeWidth={1.8} />}
            label="Editar invitados"
            onClick={onEditGuests}
            tone="secondary"
            type="button"
          />
        </div>

        <div className="mt-4 grid gap-3">
          {guests.map((guest, index) => (
            <GuestSummaryCard guest={guest} index={index} key={index} />
          ))}
        </div>
      </FormCard>
    </div>
  );
}

function RsvpConfirmationReviewDialog({
  contact,
  guests,
  loading,
  onCancel,
  onConfirm,
  submitText,
}) {
  const normalizedGuests = Guest.normalizeList(guests, { ensureOne: false });
  const groupChips = getGroupSummaryChips(contact, normalizedGuests);

  useViewportScrollLock(true);

  const dialog = (
    <div className="rsvp-dialog-overlay">
      <div
        aria-labelledby="rsvp-confirmation-review-title"
        aria-modal="true"
        className="premium-card rsvp-dialog-card"
        role="alertdialog"
      >
        <p className="section-eyebrow mb-3">Revisión</p>
        <h2
          className="font-serif text-3xl text-[var(--color-accent-dark)]"
          id="rsvp-confirmation-review-title"
        >
          Revisa la confirmación
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-accent)]">
          Comprueba los datos antes de enviar el formulario.
        </p>

        <div className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <IconButton
              className="flex-1"
              disabled={loading}
              icon={<MailCheck size={16} strokeWidth={1.8} />}
              onClick={onConfirm}
              showText="always"
              tone="primary"
              type="button"
            >
              {submitText}
            </IconButton>
            <IconButton
              className="flex-1"
              disabled={loading}
              icon={<X size={16} strokeWidth={1.8} />}
              onClick={onCancel}
              showText="always"
              tone="terciary"
              type="button"
            >
              Seguir editando
            </IconButton>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-left">
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4">
            <p className="section-eyebrow mb-2">Contacto</p>
            <h3 className="break-words font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
              {contact.confirmationName || "Grupo sin nombre"}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {groupChips.map((chip) => (
                <Chip
                  className={chip.className}
                  href={chip.href}
                  icon={chip.icon}
                  key={chip.key}
                  strong={chip.strong}
                  tone={chip.tone}
                  value={chip.value}
                  valueClassName={chip.valueClassName}
                />
              ))}
            </div>
          </div>

          {normalizedGuests.map((guest, index) => (
            <GuestSummaryCard
              guest={guest}
              index={index}
              key={guest.id || guest.guestId || index}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function GuestSummaryCard({ guest, index }) {
  const normalizedGuest = Guest.normalize(guest);
  const fullName = Guest.getDisplayName(normalizedGuest, index);
  const chips = getGuestSummaryChips(normalizedGuest);

  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4">
      <p className="section-eyebrow mb-2">
        {rsvpContent.guest.fallbackName(index + 1)}
      </p>
      <h3 className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
        {fullName}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chips.map((chip) => (
          <Chip
            className={chip.className}
            icon={chip.icon}
            key={chip.key}
            strong={chip.strong}
            value={chip.value}
            valueClassName={chip.valueClassName}
          />
        ))}
      </div>
    </div>
  );
}

function GuestPager({
  addText,
  canAddGuests,
  canRemove,
  currentGuest,
  currentGuestIndex,
  currentGuestPage,
  direction,
  errors,
  guests,
  hasInvalidGuest,
  isMobileView,
  loading,
  onAddGuest,
  onGuestChange,
  onGuestPageChange,
  onRemoveGuest,
  totalGuestPages,
  variant,
}) {
  const isAdmin = variant === "admin";
  const pageLabel = rsvpContent.form.guestPageLabel({
    page: currentGuestPage,
    total: totalGuestPages,
  });
  const removeButton = canRemove ? (
    <IconButton
      className="w-full"
      icon={<Trash2 size={16} strokeWidth={1.8} />}
      label={rsvpContent.form.removeGuestLabel(currentGuestIndex + 1)}
      onClick={() => onRemoveGuest(currentGuest, currentGuestIndex)}
      tone="danger"
    />
  ) : null;
  const renderGuestPage = (items, pageNumber, { card = false } = {}) => (
    <GuestCard
      canRemove={false}
      card={card}
      errors={errors}
      forceMobileLayout={variant !== "admin"}
      guest={items[0]}
      index={pageNumber - 1}
      onGuestChange={onGuestChange}
      onRemoveGuest={() => {}}
      showHeader={false}
      variant={variant}
    />
  );
  const renderAdminGuestPage = (items, pageNumber) => (
    <div className="h-full rounded-[2rem] ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]">
      {renderGuestPage(items, pageNumber, { card: true })}
    </div>
  );

  if (isAdmin) {
    const actionItems = [
      removeButton,
      canAddGuests && guests.length < MAX_GUESTS ? (
        <IconButton
          className="w-full"
          disabled={loading || hasInvalidGuest}
          icon={<UserPlus size={16} strokeWidth={1.8} />}
          key="add"
          label={addText}
          onClick={onAddGuest}
          tone="secondary"
        >
          {addText}
        </IconButton>
      ) : null,
    ].filter(Boolean);

    return (
      <AdminTableSection
        actions={
          actionItems.length ? (
            <div
              className={`grid w-full gap-3 ${
                actionItems.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {actionItems}
            </div>
          ) : null
        }
        eyebrow={adminContent.guests.editor.guestListEyebrow}
        getKey={(_guest, { index }) => index}
        isMobileView={isMobileView}
        items={guests}
        lockPageHeight={false}
        onNextPage={() => onGuestPageChange(currentGuestPage + 1)}
        onPrevPage={() => onGuestPageChange(currentGuestPage - 1)}
        page={currentGuestPage}
        pageDirection={direction}
        paginationLabel={pageLabel}
        pageSize={1}
        renderPage={renderAdminGuestPage}
        title={adminContent.guests.editor.guestListTitle}
        totalPages={totalGuestPages}
      />
    );
  }

  return (
    <>
      <FormCard>
        <div className="flex items-center justify-between gap-4">
          <p className={`section-eyebrow ${canRemove ? "mb-0" : ""}`}>
            {rsvpContent.form.guestLabel(currentGuestIndex + 1)}
          </p>

          {canRemove && removeButton}
        </div>

        <PaginatedContent
          allItems={guests}
          direction={direction}
          getKey={(_guest, { index }) => index}
          page={currentGuestPage}
          pageSize={1}
          totalPages={totalGuestPages}
          renderPage={renderGuestPage}
        />
      </FormCard>

      <Pagination
        className="mt-4"
        isMobileView={isMobileView}
        label={pageLabel}
        nextLabel={rsvpContent.form.next}
        onNext={() => onGuestPageChange(currentGuestPage + 1)}
        onPrev={() => onGuestPageChange(currentGuestPage - 1)}
        page={currentGuestPage}
        previousLabel={rsvpContent.form.previous}
        totalPages={totalGuestPages}
      />
    </>
  );
}
