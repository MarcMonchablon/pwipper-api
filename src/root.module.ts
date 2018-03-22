import { RootModule, Service } from './core';


import { RoutingModule } from './routing/routing.module';
import { AuthModule } from './routes/auth/auth.module';


const MODULE_ID = 'root';

export function rootModuleFactory(services: { [serviceRef: string]: Service }): RootModule {
  return new RootModule(
    MODULE_ID,
    services,
    {
      subModules: [
        RoutingModule,
        // API
        AuthModule
      ],
      services: [],
      routes: []
    });
}
