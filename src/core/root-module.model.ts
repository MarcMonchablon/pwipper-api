import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { DependencyResolver } from './dependency-resolver.model';


export type RootModuleFactory = (
  instantiatedServices: { [serviceRef: string]: Service }
) => RootModule;


export class RootModule extends AbstractModule {
  public id: string;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  private subModules: { [moduleId: string]: AbstractModule };
  private services: { [serviceRef: string]: Service };
  

  
  constructor(
    id: string,
    subModules: ModuleFactory[],
    services: ServiceMetadata[],
    instantiatedServices: { [serviceRef: string]: Service }
  ) {
    super();
    this.id = id;
    this.path = [id];
    this.dependencyResolver = new DependencyResolver(this.path, instantiatedServices);

    this.dependencyResolver.registerModuleServices(this.path, services)
      .then(); // TODO

    this.subModules = {};
    subModules
      .map((moduleFactory: ModuleFactory) => moduleFactory(this))
      .forEach((module: AbstractModule) => this.subModules[module.id] = module);
    

    this.dependencyResolver.doYourThing();
  }

  private onInstantiatedServices(instantiatedServices: { [serviceRef: string]: Service }): void {
    console.log(`Services instantiated for module ${this.id}`);
    this.services = instantiatedServices;

    // Après, dans la promise
  }
  
  

}


