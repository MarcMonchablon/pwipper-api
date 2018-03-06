import * as Restify from 'restify';

import { HttpVerb } from './http-verb.model';

interface Endpoint { verb: HttpVerb; middlewares: Restify.RequestHandler[] }


export class Route {
  private path: string;
  private endpoints: Endpoint[];


  constructor(path: string) {
    this.path = path;
    this.endpoints = [];
  }


  public addEndpoint(verb: HttpVerb, middlewares: Restify.RequestHandler[]): void {
    if (!Route.checkVerb(verb)) {
      throw new TypeError(`[Route ${this.path}]: ${verb} is not a valid HTTP verb`);
    } else if (this.endpointAlreadyPresent(verb)) {
      throw new RangeError(`[Route ${this.path}]: ${verb} endpoint is already defined`);
    }

    this.endpoints.push({verb: verb, middlewares: middlewares });
  }


  public registerRoute(restifyServer: Restify.Server): void {
    const methodsStr = this.endpoints.map(e => e.verb).join(', ');

    const corsMiddleware: Restify.RequestHandler = function(req, res, next) {
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


  private registerEndpoint(restifyServer: Restify.Server, verb: HttpVerb, middleware: Restify.RequestHandler[]): void {
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


  private endpointAlreadyPresent(verb: HttpVerb) {
    return this.endpoints.some(e => e.verb === verb);
  }


  static checkVerb(verb: string) {
    const httpVerbs: string[] = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    return httpVerbs.includes(verb);
  }
}
