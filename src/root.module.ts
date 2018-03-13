import { RootModule, RootModuleFactory } from './core/root-module.model';
import { Service } from './core/service.model';

import { authModuleFactory } from './routes/auth/auth.module';

export function rootModuleFactory(instantiatedServices: { [serviceRef: string]: Service }): RootModule {
  const MODULE_ID = 'root';

  return new RootModule(
    MODULE_ID,
    [authModuleFactory],
    [],
    instantiatedServices);
}
