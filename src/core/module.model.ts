import { EventEmitter } from 'events';
import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { DependencyResolver, InstantiatedServices } from './dependency-resolver.model';
import { AbstractRoute, RouteMetadata } from './abstract-route.model';


export { AbstractModule } from './abstract-module.model';
export { ModuleFactory } from './module-factory.model';
export { ServiceMetadata } from './service.model';

export class Module extends AbstractModule {
  public status$: EventEmitter;
  public id: string;
  public isRoot: boolean;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  private parentModule: AbstractModule;
  private subModules: { [moduleId: string]: AbstractModule };
  private services: { [serviceRef: string]: Service };
  private routes: AbstractRoute[];


  constructor(
    id: string,
    parentModule: AbstractModule,
    declared: {
      subModules: ModuleFactory[];
      services: ServiceMetadata[];
      routes: RouteMetadata[];
    }
  ) {
    super();
    this.id = id;
    this.path = [...parentModule.path, id];
    this.isRoot = false;
    this.status$ = new EventEmitter();
    this.status$.on('error', err => { throw err; });
    this.dependencyResolver = parentModule.dependencyResolver;

    this.status$.emit('registering-services');
    this.dependencyResolver.registerModuleServices(this, declared.services)
      .then((services: InstantiatedServices) => {
        this.services = services;
        this.status$.emit('services-instantiated');
      })
      .catch((err: any) => { throw err; });

    this.status$.emit('registering-modules');
    this.subModules = {};
    declared.subModules
      .map((moduleFactory: ModuleFactory) => moduleFactory(this))
      .forEach((module: AbstractModule) => this.subModules[module.id] = module);

    this.status$.on('services-instantiated', () => {
      this.status$.emit('registering-routes');
      this.routes = declared.routes
        .map((routeMetadata: RouteMetadata): AbstractRoute => {
          const deps: any[] = routeMetadata.dependenciesRefs.map(ref => this.getService(ref, this.id));
          return new routeMetadata.constructor(...deps);
        });

      this.status$.emit('all-done');
    });

  }


  public getService(serviceRef: string, askingModuleId?: string): Service {
    return this.services[serviceRef] || this.parentModule.getService(serviceRef, askingModuleId || this.id);
  }

}
