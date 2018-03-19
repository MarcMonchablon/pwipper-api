import * as Restify from 'restify';

import { EventEmitter } from 'events';
import { DependencyResolver } from './dependency-resolver.model';
import { Service } from './service.model';
import { AbstractRoute } from './abstract-route.model';


export abstract class AbstractModule {
  public id: string;
  public path: string[];
  public isRoot: boolean;
  public status$: EventEmitter;
  public dependencyResolver: DependencyResolver;

  protected subModules: { [moduleId: string]: AbstractModule };
  protected services: { [serviceRef: string]: Service };
  protected routes: AbstractRoute[];

  constructor() {}

  abstract getService(serviceRef: string, askingModuleId?: string): Service

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
