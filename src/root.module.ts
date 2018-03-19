import { RootModule, RootModuleFactory } from './core/root-module.model';
import { ModuleFactory } from './core/module-factory.model';
import { Service, ServiceMetadata } from './core/service.model';
import { RouteMetadata } from './core/abstract-route.model';

import { authModuleFactory } from './routes/auth/auth.module';


export function rootModuleFactory(services: { [serviceRef: string]: Service }): RootModule {
  const MODULE_ID = 'root';

  const declaredSubModules: ModuleFactory[] = [
    authModuleFactory
  ];

  const declaredServices: ServiceMetadata[] = [];

  const declaredRoutes: RouteMetadata[] = [];


  return new RootModule(
    MODULE_ID,
    services,
    {
      subModules: declaredSubModules,
      services: declaredServices,
      routes: declaredRoutes
    });
}
