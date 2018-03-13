import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { DependencyResolver } from './dependency-resolver.model';


export { ModuleFactory } from './module-factory.model';

export class Module extends AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  private parentModule: AbstractModule;
  private subModules: { [moduleId: string]: AbstractModule };
  private services: { [serviceRef: string]: Service };


  constructor(
    id: string,
    subModules: ModuleFactory[],
    services: ServiceMetadata[],
    parentModule: AbstractModule
  ) {
    super();
    this.id = id;
    this.path = [...parentModule.path, id];
    this.dependencyResolver = parentModule.dependencyResolver;
    this.dependencyResolver.registerModuleServices(this.path, services)
      .then(); // TODO


  }
}
