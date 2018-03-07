import * as Restify from 'restify';

import { Route } from './route.model';


export class RouteModule {
  private moduleName: string;
  private services: any;
  private routes: Route[];

  constructor(moduleName: string) {
    this.moduleName = moduleName;

    this.services = {};
    this.routes = [];
  }


  public addService(serviceName: string, serviceFn) {
    if (this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' already exist in ${this.moduleName}`);
    }
    this.services[serviceName] = serviceFn;
  }


  public getService(serviceName: string) {
    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' doesn't exist in ${this.moduleName}`);
    }
    return this.services[serviceName];
  }


  public addRoute(route: Route) {
    this.routes.push(route);
  }


  public registerRouteModule(restifyServer: Restify.Server) {
    this.routes.forEach(route => route.registerRoute(restifyServer));
  }
}
