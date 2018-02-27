
class Route {
  constructor(path) {
    this.path = path;
    this.endpoints = [];
  }


  addEndpoint(verb, middlewares) {
    if (!Route.checkVerb(verb)) {
      throw new TypeError(`[Route ${this.path}]: ${verb} is not a valid HTTP verb`);
    } else if (this.endpointAlreadyPresent(verb)) {
      throw new RangeError(`[Route ${this.path}]: ${verb} endpoint is already defined`);
    }

    this.endpoints.push({verb: verb, middlewares: middlewares });
  }


  registerRoute(restifyServer) {
    const methodsStr = this.endpoints.map(e => e.verb).join(', ');

    const corsMiddleware = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', methodsStr);
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    };

    this.endpoints.forEach(endpoint => {
      const middlewares = [
        corsMiddleware,
        ...endpoint.middlewares
      ];
      this.registerEndpoint(restifyServer, endpoint.verb, middlewares)
    });
  }


  registerEndpoint(restifyServer, verb, middleware) {
    const restifyMapping = {
      'POST': 'post',
      'GET': 'get',
      'PUT': 'put',
      'PATCH': 'patch',
      'DELETE': 'del',
      'HEAD': 'head',
      'OPTIONS': 'opts'
    };

    switch (verb) {
      case 'POST':
        restifyServer.post(this.path, middleware);
        break;
      case 'GET':
        restifyServer.get(this.path, middleware);
        break;
      case 'OPTIONS':
        restifyServer.opts(this.path, middleware);
        break;
      default:
        console.error(`Route model: HTTP verb ${verb} not handled.`);
    }
  }


  endpointAlreadyPresent(verb) {
    return this.endpoints.some(e => e.verb === verb);
  }


  static checkVerb(verb) {
    const httpVerb = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    return httpVerb.includes(verb);
  }
}


module.exports = Route;