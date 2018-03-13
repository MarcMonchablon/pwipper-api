import { AbstractModule } from './abstract-module.model';


export type ModuleFactory = (
  parentModule: AbstractModule
) => AbstractModule
