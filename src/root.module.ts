import { RootModule, Service } from './core';


import { RoutingModule } from './routing/routing.module';
import { AuthModule } from './api/auth/auth.module';
import { UserModule } from './api/users/users.module';


const MODULE_ID = 'root';

export function rootModuleFactory(services: { [serviceRef: string]: Service }): RootModule {
  return new RootModule(
    MODULE_ID,
    services,
    {
      subModules: [
        RoutingModule,
        // API
        AuthModule,
        UserModule
      ],
      services: [],
      routes: []
    });
}
