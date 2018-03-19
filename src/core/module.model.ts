import { EventEmitter } from 'events';
import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { DependencyResolver, InstantiatedServices } from './dependency-resolver.model';
import { AbstractRoute, RouteMetadata } from './abstract-route.model';


export { AbstractModule } from './abstract-module.model';
export { ModuleFactory } from './module-factory.model';
export { ServiceMetadata } from './service.model';
export { RouteMetadata } from './abstract-route.model';

export class Module extends AbstractModule {
  private _parentModule: AbstractModule;

  constructor(
    id: string,
    parentModule: AbstractModule,
    declared: {
      subModules: ModuleFactory[];
      services: ServiceMetadata[];
      routes: RouteMetadata[];
    }) {
    const path: string[] = [...parentModule.path, id];
    super(id, path, false, declared);
    this.dependencyResolver = parentModule.dependencyResolver;

    this._parentModule = parentModule;
  }


  public getService(serviceRef: string, askingModuleId?: string): Service {
    return this.services[serviceRef] ||
      this._parentModule.getService(serviceRef, askingModuleId || this.id);
  }

}
