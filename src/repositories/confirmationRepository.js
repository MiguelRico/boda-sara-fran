import {
  deleteAdminConfirmation,
  findAllConfirmations,
  findConfirmationByEmail,
  findConfirmationById,
  findConfirmationByPhone,
  saveAdminConfirmation,
  savePublicConfirmation,
} from "../services/rsvpService";

export const confirmationRepository = {
  deleteAdminConfirmation,
  findAllConfirmations,
  findByEmail: findConfirmationByEmail,
  findById: findConfirmationById,
  findByPhone: findConfirmationByPhone,
  saveAdminConfirmation,
  savePublicConfirmation,
};
