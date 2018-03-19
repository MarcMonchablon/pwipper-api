import { EventEmitter } from 'events';
import { AbstractModule } from './abstract-module.model';
import { ModuleFactory } from './module-factory.model';
import { Service, ServiceMetadata } from './service.model';
import { AbstractRoute, RouteMetadata} from './abstract-route.model';
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

  protected subModules: { [moduleId: string]: AbstractModule };
  protected services: { [serviceRef: string]: Service };
  protected routes: AbstractRoute[];

  
  constructor(
    id: string,
    services: { [serviceRef: string]: Service },
    declared: {
      subModules: ModuleFactory[];
      services: ServiceMetadata[];
      routes: RouteMetadata[];
    }
  ) {
    super();
    this.id = id;
    this.path = [id];
    this.isRoot = true;
    this.status$ = new EventEmitter();
    this.status$.on('error', err => { throw err; });
    this.dependencyResolver = new DependencyResolver(this, services);

    // TODO: mettre tout ça dans AbstractModule ?
    console.log('root: registering-services');
    this.status$.emit('registering-services');
    this.dependencyResolver.registerModuleServices(this, declared.services)
      .then((services: InstantiatedServices) => {
        this.services = services;
        console.log('root: services-instantiated');
        this.status$.emit('services-instantiated');
      })
      .catch((err: any) => { throw err; });

    console.log('root: registering-modules');
    this.status$.emit('registering-modules');
    this.subModules = {};
    declared.subModules
      .map((moduleFactory: ModuleFactory) => moduleFactory(this))
      .forEach((module: AbstractModule) => this.subModules[module.id] = module);

    this.status$.on('services-instantiated', () => {
      console.log('root: registering-routes');
      this.status$.emit('registering-routes');
      this.routes = declared.routes
        .map((routeMetadata: RouteMetadata): AbstractRoute => {
          const deps: any[] = routeMetadata.dependenciesRefs.map(ref => this.getService(ref));
          return new routeMetadata.constructor(...deps);
        });

      console.log('root: ready-for-routes-initialization');
      // TODO: it's not when we are ready for route intialization,
      // but when DependencyResolver returned services to ALL modules
      this.status$.emit('ready-for-routes-initialization');
    });
  }

  public gnip() {
    console.log('root: resolving-dependencies');
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


