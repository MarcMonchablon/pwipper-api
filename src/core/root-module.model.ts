import { EventEmitter } from 'events';
import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { DependencyResolver, InstantiatedServices } from './dependency-resolver.model';


export type RootModuleFactory = (
  instantiatedServices: { [serviceRef: string]: Service }
) => RootModule;


export class RootModule extends AbstractModule {
  public id: string;
  public path: string[];
  public isRoot: boolean;
  public status$: EventEmitter;
  public dependencyResolver: DependencyResolver;

  private subModules: { [moduleId: string]: AbstractModule };
  private services: InstantiatedServices;
  

  
  constructor(
    id: string,
    subModules: ModuleFactory[],
    services: ServiceMetadata[],
    instantiatedServices: { [serviceRef: string]: Service }
  ) {
    super();
    this.id = id;
    this.path = [id];
    this.isRoot = true;
    this.status$ = new EventEmitter();
    this.status$.on('error', err => { throw err; });
    this.dependencyResolver = new DependencyResolver(this, instantiatedServices);

    this.status$.emit('register-services');
    this.dependencyResolver.registerModuleServices(this, services)
      .then((services: InstantiatedServices) => {
        this.services = services;
        this.status$.emit('services-instantiated');
        this.status$.emit('all-done');
      })
      .catch((err: any) => { throw err; });

    this.status$.emit('register-modules');
    this.subModules = {};
    subModules
      .map((moduleFactory: ModuleFactory) => moduleFactory(this))
      .forEach((module: AbstractModule) => this.subModules[module.id] = module);


    this.status$.emit('resolving-dependencies');
    this.dependencyResolver.doYourThing();
  }


  public getService(serviceRef: string, askingModuleId?: string): Service {
    const service: Service = this.services[serviceRef];
    if (!service) {
      throw new Error(`RootModule::getService(): No service found for ref '${serviceRef}' asked by module '${askingModuleId || this.id}'.`);
    }
    return service;
  }
}


