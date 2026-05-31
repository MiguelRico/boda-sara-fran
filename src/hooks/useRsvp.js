import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { createEmptyGuest, MAX_GUESTS } from "../constants/rsvp";
import {
  findGroupByEmail,
  findGroupById,
  saveGroup,
} from "../services/rsvpService";
import { validateRsvpEmail, validateRsvpForm } from "../utils/rsvpValidation";

const createInitialPopup = () => ({
  closeText: "Cerrar",
  closeTo: null,
  open: false,
  type: "success",
  title: "",
  message: "",
});

const hasValidationErrors = (errors) => Object.keys(errors).length > 0;

const normalizeGuest = (guest) => ({
  ...createEmptyGuest(),
  ...guest,
  allergies: Array.isArray(guest?.allergies) ? guest.allergies : [],
  busNeeded: Boolean(guest?.busNeeded),
});

const normalizeGuests = (guests) =>
  Array.isArray(guests) && guests.length
    ? guests.map(normalizeGuest)
    : [createEmptyGuest()];

export default function useRsvp(spinner, { mode = "search" } = {}) {
  const { hide, show } = spinner;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupIdFromUrl = searchParams.get("groupId");
  const isEdition = mode === "edit";
  const navigationGroup =
    isEdition && location.state?.group?.email === groupIdFromUrl
      ? location.state.group
      : null;

  const [groupId, setGroupId] = useState(() => navigationGroup?.email || null);
  const [contact, setContact] = useState(() => ({
    email: navigationGroup?.email || "",
    groupName:
      navigationGroup?.groupName || navigationGroup?.nombre_grupo || "",
    phone: navigationGroup?.phone || "",
  }));
  const [guests, setGuests] = useState(() =>
    normalizeGuests(navigationGroup?.guests),
  );
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(createInitialPopup);

  const totalGuests = useMemo(() => guests.length, [guests]);

  const handleContactChange = (field, value) => {
    setContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadFoundGroup = useCallback((response) => {
    setGroupId(response.email);
    setContact({
      email: response.email,
      groupName: response.groupName || response.nombre_grupo || "",
      phone: response.phone,
    });
    setGuests(normalizeGuests(response.guests));
  }, []);

  const handleGuestChange = (index, field, value) => {
    setGuests((prevGuests) => {
      const updatedGuests = [...prevGuests];

      if (field === "allergies") {
        const allergies = updatedGuests[index].allergies || [];
        const exists = allergies.includes(value);

        updatedGuests[index] = {
          ...updatedGuests[index],
          allergies: exists
            ? allergies.filter((item) => item !== value)
            : [...allergies, value],
        };

        return updatedGuests;
      }

      updatedGuests[index] = {
        ...updatedGuests[index],
        [field]: value,
      };

      return updatedGuests;
    });
  };

  const handleAddGuest = () => {
    if (guests.length >= MAX_GUESTS) return;
    setGuests((prev) => [...prev, createEmptyGuest()]);
  };

  const handleRemoveGuest = (index) => {
    if (guests.length === 1) return;
    setGuests((prev) => prev.filter((_, i) => i !== index));
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

      navigate(`/rsvp/edit?groupId=${encodeURIComponent(response.email)}`, {
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
        groupId: groupId || contact.email,
        email: contact.email,
        groupName: contact.groupName,
        phone: contact.phone,
        guests,
      };

      show("Enviando confirmación...");

      const response = await saveGroup(payload);

      if (response.email) {
        setGroupId(response.email);
      }

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
      if (!isEdition || !groupIdFromUrl) return;
      if (navigationGroup) return;

      try {
        show("Cargando confirmación...");

        const response = await findGroupById(groupIdFromUrl);

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
  }, [groupIdFromUrl, hide, isEdition, loadFoundGroup, navigationGroup, show]);

  return {
    closePopup,
    contact,
    errors,
    groupId,
    guests,
    handleAddGuest,
    handleContactChange,
    handleCreateNew,
    handleGuestChange,
    handleRemoveGuest,
    handleSearchInvitation,
    handleSubmit,
    isEdition,
    popup,
    totalGuests,
  };
}
