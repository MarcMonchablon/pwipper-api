import { RootModule, ModuleFactory, Service, ServiceMetadata, RouteMetadata } from './core';


import { authModule } from './routes/auth/auth.module';


export function rootModuleFactory(services: { [serviceRef: string]: Service }): RootModule {
  const MODULE_ID = 'root';

  const declaredSubModules: ModuleFactory[] = [
    authModule
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
