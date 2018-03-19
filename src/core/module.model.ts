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
  public status$: EventEmitter;
  public id: string;
  public isRoot: boolean;
  public path: string[];
  public dependencyResolver: DependencyResolver;

  private parentModule: AbstractModule;
  protected subModules: { [moduleId: string]: AbstractModule };
  protected services: { [serviceRef: string]: Service };
  protected routes: AbstractRoute[];


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
    this.parentModule = parentModule;
    this.status$ = new EventEmitter();
    this.status$.on('error', err => { throw err; });
    this.dependencyResolver = parentModule.dependencyResolver;

    console.log(`${this.id}: registering-services`);
    this.status$.emit('registering-services');
    this.dependencyResolver.registerModuleServices(this, declared.services)
      .then((services: InstantiatedServices) => {
        this.services = services;
        console.log(`${this.id}: services-instantiated`);
        this.status$.emit('services-instantiated');
      })
      .catch((err: any) => { throw err; });

    console.log(`${this.id}: registering-modules`);
    this.status$.emit('registering-modules');
    this.subModules = {};
    declared.subModules
      .map((moduleFactory: ModuleFactory) => moduleFactory(this))
      .forEach((module: AbstractModule) => this.subModules[module.id] = module);

    this.status$.on('services-instantiated', () => {
      console.log(`${this.id}: registering-routes`);
      this.status$.emit('registering-routes');
      this.routes = declared.routes
        .map(function(routeMetadata: RouteMetadata): AbstractRoute {
          const deps: Service[] = routeMetadata.dependenciesRefs
            .map(function (ref: string): Service {
              return this.getService(ref);
            }.bind(this));
          return new routeMetadata.constructor(...deps);
        }.bind(this));

      console.log(`${this.id}: ready-for-routes-initialization`);
      this.status$.emit('ready-for-routes-initialization');
    });

  }


  public getService(serviceRef: string, askingModuleId?: string): Service {
    return this.services[serviceRef] || this.parentModule.getService(serviceRef, askingModuleId || this.id);
  }

}
