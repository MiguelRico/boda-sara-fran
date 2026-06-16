import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { MAX_GUESTS } from "../constants/rsvp";
import { rsvpContent } from "../constants/rsvpContent";
import { Confirmation, Guest } from "../models";
import { confirmationRepository } from "../repositories/confirmationRepository";
import { getConfirmationIdUrl } from "../utils/confirmationNameCodec";
import {
  validateRsvpContact,
  validateRsvpForm,
  validateRsvpSearch,
} from "../utils/rsvpValidation";

const createInitialPopup = () => ({
  closeText: rsvpContent.status.close,
  closeTo: null,
  open: false,
  type: "success",
  title: "",
  message: "",
});

const hasValidationErrors = (errors) => Object.keys(errors).length > 0;
const removeEmptyExtraGuests = (guests) => {
  const normalizedGuests = Guest.normalizeList(guests);

  if (normalizedGuests.length <= 1) return normalizedGuests;

  const guestsWithData = normalizedGuests.filter((guest) => !Guest.isEmpty(guest));

  return guestsWithData.length ? guestsWithData : normalizedGuests;
};

export default function useRsvp(spinner, { mode = "search" } = {}) {
  const { hide, show } = spinner;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirmationIdFromUrl = searchParams.get("confirmationId") || "";
  const isEdition = mode === "edit";
  const navigationGroup =
    isEdition &&
    location.state?.group?.confirmationId === confirmationIdFromUrl
      ? Confirmation.normalize(location.state.group)
      : null;

  const [currentConfirmationName, setCurrentConfirmationName] = useState(
    () => navigationGroup?.confirmationName || null,
  );
  const [currentConfirmationId, setCurrentConfirmationId] = useState(
    () => navigationGroup?.confirmationId || navigationGroup?.id || "",
  );
  const [contact, setContact] = useState(() => ({
    email: navigationGroup?.email || "",
    confirmationName: navigationGroup?.confirmationName || "",
    phone: navigationGroup?.phone || "",
  }));
  const [guests, setGuests] = useState(() =>
    Guest.normalizeList(navigationGroup?.guests),
  );
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(createInitialPopup);

  const totalGuests = useMemo(() => guests.length, [guests]);

  const handleContactChange = (field, value) => {
    if (isEdition && field === "confirmationName") return;

    setContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadFoundGroup = useCallback((response) => {
    const confirmation = Confirmation.normalize(response);

    setCurrentConfirmationId(confirmation.confirmationId || confirmation.id || "");
    setCurrentConfirmationName(confirmation.confirmationName);
    setContact({
      email: confirmation.email,
      confirmationName: confirmation.confirmationName,
      phone: confirmation.phone,
    });
    setGuests(Guest.normalizeList(confirmation.guests));
  }, []);

  const handleGuestChange = (index, field, value) => {
    setGuests((prevGuests) => {
      const updatedGuests = [...prevGuests];

      updatedGuests[index] = Guest.withUpdatedField(
        updatedGuests[index],
        field,
        value,
      );

      return updatedGuests;
    });
  };

  const handleAddGuest = () => {
    setGuests((prev) =>
      Confirmation.withAddedGuestList(prev, { maxGuests: MAX_GUESTS }),
    );
  };

  const handleRemoveGuest = (index) => {
    setGuests((prev) => Confirmation.withRemovedGuestList(prev, index));
  };

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleCreateNew = () => {
    navigate("/rsvp/create");
  };

  const handleSearchInvitation = async () => {
    const validationErrors = validateRsvpSearch(contact);
    let keepSpinnerUntilNavigation = false;

    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) return;

    try {
      show(rsvpContent.status.searchLoading);

      const response = contact.email.trim()
        ? await confirmationRepository.findByEmail(contact.email)
        : await confirmationRepository.findByPhone(contact.phone);

      if (!response.found) {
        setPopup({
          closeText: rsvpContent.status.close,
          closeTo: null,
          open: true,
          type: "error",
          title: rsvpContent.status.notFoundTitle,
          message: rsvpContent.status.notFoundMessage,
        });
        return;
      }

      if (!response.confirmationId) {
        throw new Error(rsvpContent.status.missingIdError);
      }

      navigate(getConfirmationIdUrl(response.confirmationId), {
        state: { group: response },
      });
      keepSpinnerUntilNavigation = true;
    } catch (error) {
      console.error(error);

      setPopup({
        closeText: rsvpContent.status.backHome,
        closeTo: "/",
        open: true,
        type: "error",
        title: rsvpContent.status.problemTitle,
        message: rsvpContent.status.searchError,
      });
    } finally {
      if (!keepSpinnerUntilNavigation) {
        hide();
      }
    }
  };

  const validateContactStep = () => {
    const validationErrors = validateRsvpContact(contact);

    setErrors((current) => ({
      ...current,
      email: validationErrors.email,
      confirmationName: validationErrors.confirmationName,
      phone: validationErrors.phone,
    }));

    return !hasValidationErrors(validationErrors);
  };

  const validateConfirmationStep = () => {
    const guestsToValidate = removeEmptyExtraGuests(guests);
    const validationErrors = validateRsvpForm({
      contact,
      guests: guestsToValidate,
    });

    if (guestsToValidate.length !== guests.length) {
      setGuests(guestsToValidate);
    }
    setErrors(validationErrors);

    return !hasValidationErrors(validationErrors);
  };

  const validateUniqueContact = async () => {
    const normalizedEmail = contact.email.trim();
    const normalizedPhone = contact.phone.trim();
    const [emailResponse, phoneResponse] = await Promise.all([
      normalizedEmail
        ? confirmationRepository.findByEmail(normalizedEmail)
        : null,
      normalizedPhone
        ? confirmationRepository.findByPhone(normalizedPhone)
        : null,
    ]);
    const currentId = String(currentConfirmationId || "").trim();
    const duplicatedEmail =
      emailResponse?.found &&
      String(emailResponse.confirmationId || emailResponse.id || "").trim() !==
        currentId;
    const duplicatedPhone =
      phoneResponse?.found &&
      String(phoneResponse.confirmationId || phoneResponse.id || "").trim() !==
        currentId;

    if (!duplicatedEmail && !duplicatedPhone) return true;

    setErrors((current) => ({
      ...current,
      email: duplicatedEmail
        ? rsvpContent.status.duplicatedEmail
        : current.email,
      phone: duplicatedPhone
        ? rsvpContent.status.duplicatedPhone
        : current.phone,
    }));
    setPopup({
      closeText: rsvpContent.status.close,
      closeTo: null,
      open: true,
      type: "error",
      title: rsvpContent.status.duplicatedContactTitle,
      message: rsvpContent.status.duplicatedContactMessage,
    });

    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const guestsToSubmit = removeEmptyExtraGuests(guests);
    const validationErrors = validateRsvpForm({
      contact,
      guests: guestsToSubmit,
    });

    if (guestsToSubmit.length !== guests.length) {
      setGuests(guestsToSubmit);
    }

    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      setPopup({
        closeText: rsvpContent.status.close,
        closeTo: null,
        open: true,
        type: "error",
        title: rsvpContent.status.validationTitle,
        message: rsvpContent.status.validationMessage,
      });
      return;
    }

    try {
      const payload = {
        ...Confirmation.normalize({
          ...contact,
          confirmationId: currentConfirmationId,
          id: currentConfirmationId,
          confirmationName: currentConfirmationName || contact.confirmationName,
          guests: guestsToSubmit,
        }),
      };

      show(rsvpContent.status.submitLoading);

      const hasUniqueContact = await validateUniqueContact();

      if (!hasUniqueContact) return;

      await confirmationRepository.savePublic(payload, {
        method: isEdition ? "PUT" : "POST",
      });

      setErrors({});

      setPopup({
        closeText: rsvpContent.status.backHome,
        closeTo: "/",
        open: true,
        type: "success",
        title: rsvpContent.status.submitSuccessTitle,
        message: isEdition
          ? rsvpContent.status.submitEditSuccess
          : rsvpContent.status.submitCreateSuccess,
      });
    } catch (error) {
      console.error(error);

      setPopup({
        closeText: rsvpContent.status.backHome,
        closeTo: "/",
        open: true,
        type: "error",
        title: rsvpContent.status.problemTitle,
        message: rsvpContent.status.submitError,
      });
    } finally {
      hide();
    }
  };

  useEffect(() => {
    const loadGroup = async () => {
      if (!isEdition || !confirmationIdFromUrl) return;
      if (navigationGroup) return;

      try {
        show(rsvpContent.status.loadLoading);

        const response =
          await confirmationRepository.findById(confirmationIdFromUrl);

        if (!response.found) {
          setPopup({
            closeText: rsvpContent.status.backHome,
            closeTo: "/",
            open: true,
            type: "error",
            title: rsvpContent.status.problemTitle,
            message: rsvpContent.status.loadMissing,
          });

          return;
        }

        loadFoundGroup(response);
      } catch (error) {
        console.error(error);

        setPopup({
          closeText: rsvpContent.status.backHome,
          closeTo: "/",
          open: true,
          type: "error",
          title: rsvpContent.status.problemTitle,
          message: rsvpContent.status.loadError,
        });
      } finally {
        hide();
      }
    };

    loadGroup();
  }, [
    confirmationIdFromUrl,
    hide,
    isEdition,
    loadFoundGroup,
    navigationGroup,
    show,
  ]);

  return {
    closePopup,
    contact,
    errors,
    confirmationName: currentConfirmationName,
    guests,
    handleAddGuest,
    handleContactChange,
    handleCreateNew,
    handleGuestChange,
    handleRemoveGuest,
    handleSearchInvitation,
    handleSubmit,
    validateConfirmationStep,
    validateContactStep,
    isEdition,
    popup,
    totalGuests,
  };
}

