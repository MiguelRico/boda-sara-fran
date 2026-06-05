import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { MAX_GUESTS } from "../constants/rsvp";
import { Confirmation, Guest } from "../models";
import {
  findGroupByEmail,
  findGroupByName,
  saveGroup,
} from "../services/rsvpService";
import { decodeGroupName, getGroupNameUrl } from "../utils/groupNameCodec";
import {
  validateRsvpContact,
  validateRsvpEmail,
  validateRsvpForm,
} from "../utils/rsvpValidation";

const createInitialPopup = () => ({
  closeText: "Cerrar",
  closeTo: null,
  open: false,
  type: "success",
  title: "",
  message: "",
});

const hasValidationErrors = (errors) => Object.keys(errors).length > 0;

export default function useRsvp(spinner, { mode = "search" } = {}) {
  const { hide, show } = spinner;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupNameFromUrl = decodeGroupName(searchParams.get("groupName"));
  const isEdition = mode === "edit";
  const navigationGroup =
    isEdition && location.state?.group?.groupName === groupNameFromUrl
      ? Confirmation.normalize(location.state.group)
      : null;

  const [currentGroupName, setCurrentGroupName] = useState(
    () => navigationGroup?.groupName || null,
  );
  const [contact, setContact] = useState(() => ({
    email: navigationGroup?.email || "",
    groupName: navigationGroup?.groupName || "",
    phone: navigationGroup?.phone || "",
  }));
  const [guests, setGuests] = useState(() =>
    Guest.normalizeList(navigationGroup?.guests),
  );
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(createInitialPopup);

  const totalGuests = useMemo(() => guests.length, [guests]);

  const handleContactChange = (field, value) => {
    if (isEdition && field === "groupName") return;

    setContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadFoundGroup = useCallback((response) => {
    const confirmation = Confirmation.normalize(response);

    setCurrentGroupName(confirmation.groupName);
    setContact({
      email: confirmation.email,
      groupName: confirmation.groupName,
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
    const emailError = validateRsvpEmail(contact.email);
    const validationErrors = emailError ? { email: emailError } : {};
    let keepSpinnerUntilNavigation = false;

    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) return;

    try {
      show("Buscando confirmación...");

      const response = await findGroupByEmail(contact.email);

      if (!response.found) {
        setPopup({
          closeText: "Cerrar",
          closeTo: null,
          open: true,
          type: "error",
          title: "No encontrada",
          message:
            "No hemos encontrado una confirmación asociada a este email.",
        });
        return;
      }

      navigate(getGroupNameUrl(response.groupName), {
        state: { group: response },
      });
      keepSpinnerUntilNavigation = true;
    } catch (error) {
      console.error(error);

      setPopup({
        closeText: "Volver al inicio",
        closeTo: "/",
        open: true,
        type: "error",
        title: "Ha ocurrido un problema",
        message:
          "Ha ocurrido un error buscando tu confirmación. Por favor, inténtalo de nuevo en unos minutos. Si el problema persiste ponte en contacto con Sara o Fran.",
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
      groupName: validationErrors.groupName,
      phone: validationErrors.phone,
    }));

    return !hasValidationErrors(validationErrors);
  };

  const validateConfirmationStep = () => {
    const validationErrors = validateRsvpForm({ contact, guests });

    setErrors(validationErrors);

    return !hasValidationErrors(validationErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateRsvpForm({ contact, guests });
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      setPopup({
        closeText: "Cerrar",
        closeTo: null,
        open: true,
        type: "error",
        title: "Revisa la confirmación",
        message:
          "Hay campos obligatorios o con formato incorrecto. Corrígelos antes de enviar la confirmación.",
      });
      return;
    }

    try {
      const payload = {
        ...Confirmation.normalize({
          ...contact,
          groupName: currentGroupName || contact.groupName,
          guests,
        }),
      };

      show("Enviando confirmación...");

      await saveGroup(payload, {
        method: isEdition ? "PUT" : "POST",
      });

      setCurrentGroupName(null);
      setContact({
        email: "",
        groupName: "",
        phone: "",
      });
      setGuests(Guest.normalizeList());
      setErrors({});

      setPopup({
        closeText: "Volver al inicio",
        closeTo: "/",
        open: true,
        type: "success",
        title: "¡Confirmación recibida!",
        message: isEdition
          ? "Hemos actualizado correctamente vuestra confirmación."
          : "Hemos guardado correctamente vuestra confirmación.",
      });
    } catch (error) {
      console.error(error);

      setPopup({
        closeText: "Volver al inicio",
        closeTo: "/",
        open: true,
        type: "error",
        title: "Ha ocurrido un problema",
        message:
          "No hemos podido guardar vuestra confirmación. Por favor, intentadlo de nuevo en unos minutos. Si el problema persiste ponte en contacto con Sara o Fran.",
      });
    } finally {
      hide();
    }
  };

  useEffect(() => {
    const loadGroup = async () => {
      if (!isEdition || !groupNameFromUrl) return;
      if (navigationGroup) return;

      try {
        show("Cargando confirmación...");

        const response = await findGroupByName(groupNameFromUrl);

        if (!response.found) {
          setPopup({
            closeText: "Volver al inicio",
            closeTo: "/",
            open: true,
            type: "error",
            title: "Ha ocurrido un problema",
            message:
              "No se encontró la confirmación. Si el problema persiste ponte en contacto con Sara o Fran.",
          });

          return;
        }

        loadFoundGroup(response);
      } catch (error) {
        console.error(error);

        setPopup({
          closeText: "Volver al inicio",
          closeTo: "/",
          open: true,
          type: "error",
          title: "Ha ocurrido un problema",
          message:
            "Error cargando confirmación. Si el problema persiste ponte en contacto con Sara o Fran.",
        });
      } finally {
        hide();
      }
    };

    loadGroup();
  }, [groupNameFromUrl, hide, isEdition, loadFoundGroup, navigationGroup, show]);

  return {
    closePopup,
    contact,
    errors,
    groupName: currentGroupName,
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
