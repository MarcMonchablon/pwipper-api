import * as Restify from 'restify';

import { EventEmitter } from 'events';
import {DependencyResolver, InstantiatedServices} from './dependency-resolver.model';
import {Service, ServiceMetadata} from './service.model';
import {AbstractRoute, RouteMetadata} from './abstract-route.model';
import { ModuleFactory } from './module-factory.model';


export abstract class AbstractModule {
  public status$: EventEmitter;

  public dependencyResolver: DependencyResolver;
  private subModules: AbstractModule[];
  protected services: { [serviceRef: string]: Service };
  private routes: AbstractRoute[];

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

    this.status$ = new EventEmitter();
    this.status$.on('error', err => { throw err; });
    this.status$.emit('ready-to-init-module');
  }

  public init() {
    if (!this.dependencyResolver) {
      throw new Error(`In module '${this.id}', dependencyResolver is missing !`);
    }

    // === REGISTER SERVICES ==========
    console.log(`${this.id}: registering-services`);
    this.status$.emit('registering-services');
    this.dependencyResolver.registerModuleServices(this, this.declared.services)
      .then((services: InstantiatedServices) => {
        this.services = services;
        console.log(`${this.id}: services-instantiated`);
        this.status$.emit('services-instantiated');
      })
      .catch((err: any) => { throw err; });


    // === INIT MODULES ===========
    console.log(`${this.id}: registering-modules`);
    this.status$.emit('registering-modules');
    this.subModules = this.declared.subModules
      .map((moduleFactory: ModuleFactory): AbstractModule => {
        const module: AbstractModule = moduleFactory(this);
        module.init();
        return module;
      });


    // === INSTANTIATE SERVICES =======
    this.status$.on('services-instantiated', () => {
      console.log(`${this.id}: registering-routes`);
      this.status$.emit('registering-routes');


      // === INIT ROUTES =======
      this.routes = this.declared.routes
        .map(function (routeMetadata: RouteMetadata): AbstractRoute {
          const deps: Service[] = routeMetadata.dependenciesRefs
            .map(function (ref: string): Service {
              return this.getService(ref);
            }.bind(this));
          return new routeMetadata.constructor(...deps);
        }.bind(this));


      // TODO: it's not when we are ready for route intialization,
      // but when DependencyResolver returned services to ALL modules
      console.log(`${this.id}: ready-for-routes-initialization`);
      this.status$.emit('ready-for-routes-initialization');
    });
  }

  public abstract getService(serviceRef: string, askingModuleId?: string): Service

  public initializeRoutes(server: Restify.Server): void {
    this.status$.emit('initializing-routes');
    this.routes.forEach((r: AbstractRoute) => r.registerRoute(server));

    let moduleId: string;
    let module: AbstractModule;
    for (moduleId in this.subModules) {
      module = this.subModules[moduleId];
      module.initializeRoutes(server);
    }

    this.status$.emit('routes-initialized');
  }
}
