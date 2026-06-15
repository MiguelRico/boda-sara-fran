import {
  deleteAdminConfirmation,
  findAllConfirmations,
  findConfirmationByEmail,
  findConfirmationById,
  findConfirmationByPhone,
  saveAdminConfirmation,
  savePublicConfirmation,
} from "../gateways/appScriptGateway";

export const confirmationRepository = {
  deleteAdmin: deleteAdminConfirmation,
  findAll: findAllConfirmations,
  findByEmail: findConfirmationByEmail,
  findById: findConfirmationById,
  findByPhone: findConfirmationByPhone,
  saveAdmin: saveAdminConfirmation,
  savePublic: savePublicConfirmation,
};
