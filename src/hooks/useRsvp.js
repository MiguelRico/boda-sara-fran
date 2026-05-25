import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { createEmptyGuest, MAX_GUESTS } from "../constants/rsvp";
import {
  findGroupByEmail,
  findGroupById,
  saveGroup,
} from "../services/rsvpService";
import { validateRsvpEmail, validateRsvpForm } from "../utils/rsvpValidation";

const createInitialPopup = () => ({
  open: false,
  type: "success",
  title: "",
  message: "",
});

export default function useRsvp(spinner) {
  const { hide, show } = spinner;
  const [searchParams] = useSearchParams();

  const groupIdFromUrl = searchParams.get("groupId");
  const hasGroupId = Boolean(groupIdFromUrl);

  const [mode, setMode] = useState(null);
  const [isEdition, setIsEdition] = useState(false);
  const [groupId, setGroupId] = useState(null);
  const [contact, setContact] = useState({
    email: "",
    phone: "",
  });
  const [guests, setGuests] = useState([createEmptyGuest()]);
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
      phone: response.phone,
    });
    setGuests(response.guests);
    setMode("form");
    setIsEdition(true);
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

  const handleSearchInvitation = async () => {
    const emailError = validateRsvpEmail(contact.email);
    const validationErrors = emailError ? { email: emailError } : {};

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      show("Buscando confirmación...");

      const response = await findGroupByEmail(contact.email);

      if (!response.found) {
        setPopup({
          open: true,
          type: "error",
          title: "No encontrada",
          message: "No hemos encontrado una invitación asociada a este email.",
        });
        return;
      }

      loadFoundGroup(response);
      window.history.replaceState(null, "", `/rsvp?groupId=${response.email}`);
    } catch (error) {
      console.error(error);

      setPopup({
        open: true,
        type: "error",
        title: "Ha ocurrido un problema",
        message:
          "Ha ocurrido un error buscando tu confirmación. Por favor, inténtalo de nuevo en unos minutos.",
      });
    } finally {
      hide();
    }
  };

  const handleCreateNew = () => {
    setMode("form");
    setGroupId(null);
    setIsEdition(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateRsvpForm({ contact, guests });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      const payload = {
        groupId: contact.email,
        email: contact.email,
        phone: contact.phone,
        guests,
      };

      show("Enviando confirmación...");

      const response = await saveGroup(payload);

      if (response.email) {
        setGroupId(response.email);
      }

      setPopup({
        open: true,
        type: "success",
        title: "¡Confirmación recibida!",
        message: isEdition
          ? "Hemos actualizado correctamente vuestra asistencia."
          : "Hemos guardado correctamente vuestra asistencia.",
      });
    } catch (error) {
      console.error(error);

      setPopup({
        open: true,
        type: "error",
        title: "Ha ocurrido un problema",
        message:
          "No hemos podido guardar vuestra información. Por favor, intentadlo de nuevo en unos minutos.",
      });
    } finally {
      hide();
    }
  };

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupIdFromUrl) return;

      try {
        show("Cargando confirmación...");

        const response = await findGroupById(groupIdFromUrl);

        if (!response.found) {
          setPopup({
            open: true,
            type: "error",
            title: "Ha ocurrido un problema",
            message: "No se encontró la invitación.",
          });

          return;
        }

        loadFoundGroup(response);
      } catch (error) {
        console.error(error);

        setPopup({
          open: true,
          type: "error",
          title: "Ha ocurrido un problema",
          message: "Error cargando invitación.",
        });
      } finally {
        hide();
      }
    };

    loadGroup();
  }, [groupIdFromUrl, hide, loadFoundGroup, show]);

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
    hasGroupId,
    mode,
    popup,
    totalGuests,
  };
}
