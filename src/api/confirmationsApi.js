import { confirmationRepository } from "../repositories/confirmationRepository";

export const deleteAdminConfirmation =
  confirmationRepository.deleteAdminConfirmation;
export const findAllConfirmations = confirmationRepository.findAllConfirmations;
export const findConfirmationById = confirmationRepository.findById;
export const findConfirmationByEmail = confirmationRepository.findByEmail;
export const findConfirmationByPhone = confirmationRepository.findByPhone;
export const saveAdminConfirmation =
  confirmationRepository.saveAdminConfirmation;
export const savePublicConfirmation =
  confirmationRepository.savePublicConfirmation;
