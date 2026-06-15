import { appEnvironment } from "./environment";

export const features = {
  menuModule: appEnvironment.features.menuModule,
};

export const isMenuModuleEnabled = features.menuModule;
