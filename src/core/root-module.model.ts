import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { RouteMetadata} from './abstract-route.model';
import { DependencyResolver } from './dependency-resolver.model';


export type RootModuleFactory = (
  instantiatedServices: { [serviceRef: string]: Service }
) => RootModule;


export class RootModule extends AbstractModule {

  constructor(
    id: string,
    services: { [serviceRef: string]: Service },
    declared: {
      subModules: ModuleFactory[];
      services: ServiceMetadata[];
      routes: RouteMetadata[];
    }) {
    const path: string[] = [id];
    super(id, path, true, declared);
    this.dependencyResolver = new DependencyResolver(this, services);
  }


  public getService(serviceRef: string, askingModuleId?: string): Service {
    const service: Service = this.services[serviceRef];
    if (!service) {
      throw new Error(`RootModule::getService(): No service found for ref '${serviceRef}' asked by '${askingModuleId || this.id}'.`);
    }
    return service;
  }
}
