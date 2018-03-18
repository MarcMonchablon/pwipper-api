import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import {DependencyResolver, InstantiatedServices} from './dependency-resolver.model';


export { AbstractModule } from './abstract-module.model';
export { ModuleFactory } from './module-factory.model';
export { ServiceMetadata } from './service.model';

export class Module extends AbstractModule {
  public id: string;
  public isRoot: boolean;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  private parentModule: AbstractModule;
  private subModules: { [moduleId: string]: AbstractModule };
  private services: InstantiatedServices;


  constructor(
    id: string,
    subModules: ModuleFactory[],
    services: ServiceMetadata[],
    parentModule: AbstractModule
  ) {
    super();
    this.id = id;
    this.isRoot = false;
    this.path = [...parentModule.path, id];
    this.dependencyResolver = parentModule.dependencyResolver;
    this.dependencyResolver.registerModuleServices(this, services)
      .then((services: InstantiatedServices) => this.services = services)
      .catch((err: any) => { throw err; });


  }


  public getService(serviceRef: string, askingModuleId?: string): Service {
    return this.services[serviceRef] || this.parentModule.getService(serviceRef, askingModuleId || this.id);
  }

}
