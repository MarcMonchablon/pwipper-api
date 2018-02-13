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

  getService(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' doesn't exist in ${this.moduleName}`);
    }
    return this.services[serviceName];
  }

  addRoute(routeFn) {
    this.routes.push(routeFn(this));
  }

  register(restifyServer) {
    this.routes.forEach(route => route.register(restifyServer));
  }
}

module.exports = RouteModule;