import { Module, AbstractModule } from '../core';


const MODULE_ID = 'routing';

export function RoutingModule(parentModule: AbstractModule): Module {
  return new Module(
    MODULE_ID,
    parentModule,
    {
      subModules: [],
      services: [],
      routes: []
    });
}
