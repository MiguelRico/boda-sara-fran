import {
  findAllProviders,
  saveAdminProviders,
} from "../gateways/appScriptGateway";

export const providerRepository = {
  findAll: findAllProviders,
  saveAdmin: saveAdminProviders,
};
