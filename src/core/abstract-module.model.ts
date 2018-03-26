import * as Restify from 'restify';

import { DependencyResolver, InstantiatedServices} from './dependency-resolver.model';
import { Service, ServiceMetadata } from './service.model';
import { AbstractRoute, RouteMetadata } from './abstract-route.model';
import { ModuleFactory } from './module-factory.model';
import { ModuleStatus } from './module-status.model';


export abstract class AbstractModule {
  public status$: ModuleStatus;

  public dependencyResolver: DependencyResolver;
  private subModules: AbstractModule[];
  protected services: { [serviceRef: string]: Service };
  private routes: AbstractRoute[];

  public abstract getService(serviceRef: string, askingModuleId?: string): Service


  constructor(
    public id: string,
    public path: string[],
    public isRoot: boolean,
    public declared: {
      subModules: ModuleFactory[];
      services: ServiceMetadata[];
      routes: RouteMetadata[];
    },
  ) {
    this.subModules = [];
    this.services = {};
    this.routes = [];

    this.status$ = new ModuleStatus(this.id, this.path, false);
    this.status$.emit('module-ready-for-init');
  }


  public init(): AbstractModule {
    if (!this.dependencyResolver) {
      throw new Error(`In module '${this.id}', dependencyResolver is missing !`);
    }

    // === INIT MODULES ===========
    this.status$.emit('instantiating-submodules');
    this.subModules = this.declared.subModules
      .map((moduleFactory: ModuleFactory): AbstractModule =>
        moduleFactory(this).init());
    this.status$.registerChildModules(this.subModules);
    this.status$.emit('submodules-instantiated');


    // === REGISTER SERVICES ==========
    this.status$.emit('registering-services');
    const resolvedServices$ = this.dependencyResolver
      .registerModuleServices(this, this.declared.services);
    this.status$.emit('services-registered');



    // === RESOLVE DEPENDENCIES =======
    if (this.isRoot) {
      this.status$.on('ready-to-resolve-dependency').then(() => {
        this.status$.emit('resolving-dependencies');
        this.dependencyResolver.doYourThing();
      });
    }


    // === INSTANTIATE SERVICES =======
    resolvedServices$.then((services: InstantiatedServices) => {
      // Promise fulfilled when DependencyResolved did his thing.
      this.services = services;
      this.status$.emit('services-instantiated');
    }).catch((err: any) => { throw err; });


    // === INSTANTIATE ROUTES =========
    if (this.isRoot) {
      this.status$.on('ready-for-routes-instantiation').then(() => {
        this.instantiateRoutes();
      });
    }


    // === ACTIVATE ROUTES =========
    // Lauched by main.ts (server entry point) when root module has 'ready-for-routes-activations'


    // === ALL GOOD ================
    // When every routes has been activated, RootModule is all good :)

    return this; // So we can chain .init() in sub-modules creations.
  }



  public instantiateRoutes() {
    this.status$.emit('instantiating-routes');
    // Instantiate current routes ...
    this.routes = this.declared.routes
      .map(function (routeMetadata: RouteMetadata): AbstractRoute {
        const deps: Service[] = routeMetadata.dependenciesRefs
          .map(function (ref: string): Service {
            return this.getService(ref, routeMetadata.routePath);
          }.bind(this));
        return new routeMetadata.constructor(...deps);
      }.bind(this));

    // ... and then launch submodules routes activations.
    this.subModules.forEach((m: AbstractModule) => m.instantiateRoutes());
    this.status$.emit('routes-instantiated');
  }



  public activateRoutes(server: Restify.Server): void {
    this.status$.emit('activating-routes');
    this.routes.forEach((r: AbstractRoute) => r.registerRoute(server));
    this.subModules.forEach((m: AbstractModule) => m.activateRoutes(server));
    this.status$.emit('routes-activated');
  }
}
