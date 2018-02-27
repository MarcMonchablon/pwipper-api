
class Route {
  constructor(path) {
    this.path = path;
    this.endpoints = [];
  }


  addEndpoint(verb, response) {
    if (!Route.checkVerb(verb)) {
      throw new TypeError(`[Route ${this.path}]: ${verb} is not a valid HTTP verb`);
    } else if (this.endpointAlreadyPresent(verb)) {
      throw new RangeError(`[Route ${this.path}]: ${verb} endpoint is already defined`);
    }

    this.endpoints.push({verb: verb, response: response });
  }


  registerRoute(restifyServer) {
    this.endpoints.forEach(endpoint => this.registerEndpoint(restifyServer, endpoint.verb, endpoint.response));

    // Every route should implement OPTIONS for CORS purposes
    if (!this.endpointAlreadyPresent('OPTIONS')) {
      const defaultOptionsResponse = function(req, res, next) {
        res.send();
        next();
      };
      this.registerEndpoint(restifyServer, 'OPTIONS', defaultOptionsResponse)
    }
  }


  registerEndpoint(restifyServer, verb, response) {
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
        restifyServer.post(this.path, response);
        break;
      case 'GET':
        restifyServer.get(this.path, response);
        break;
      case 'OPTIONS':
        restifyServer.opts(this.path, response);
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