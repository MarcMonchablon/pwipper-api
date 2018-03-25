import { Module, AbstractModule } from '../core';

import { middlewareService } from './_services/middleware.service';


const MODULE_ID = 'routing';

export function RoutingModule(parentModule: AbstractModule): Module {
  return new Module(
    MODULE_ID,
    parentModule,
    {
      subModules: [],
      services: [
        middlewareService
      ],
      routes: []
    });
}
