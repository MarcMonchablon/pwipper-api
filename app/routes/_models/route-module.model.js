class RouteModule {
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

  addRoute(route) {
    this.routes.push(route);
  }

  register(restifyServer) {
    this.routes.forEach(route => route.register(restifyServer));
  }
}

module.exports = RouteModule;