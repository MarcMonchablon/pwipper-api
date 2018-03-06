
export class RouteModule {
  private moduleName: any;
  private services: any;
  private routes: any;

  constructor(moduleName) {
    this.moduleName = moduleName;

    this.services = {};
    this.routes = [];
  }


  addService(serviceName, serviceFn) {
    if (this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' already exist in ${this.moduleName}`);
    }
    this.services[serviceName] = serviceFn;
  }


  getService(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' doesn't exist in ${this.moduleName}`);
    }
    return this.services[serviceName];
  }


  addRoute(routeFn) {
    this.routes.push(routeFn(this));
  }


  registerRouteModule(restifyServer) {
    this.routes.forEach(route => route.registerRoute(restifyServer));
  }
}
