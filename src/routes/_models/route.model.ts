import * as Restify from 'restify';

import { HttpVerb } from './http-verb.model';

interface Endpoint {
  verb: string,
  handlers: Restify.RequestHandlerType | null
}

export abstract class Route {
  private _path: string;

  constructor(path: string) {
    this._path = path;
  }

  protected POST():     Restify.RequestHandlerType | null { return null; }
  protected GET():      Restify.RequestHandlerType | null { return null; }
  protected PUT():      Restify.RequestHandlerType | null { return null; }
  protected PATCH():    Restify.RequestHandlerType | null { return null; }
  protected DELETE():   Restify.RequestHandlerType | null { return null; }
  protected HEAD():     Restify.RequestHandlerType | null { return null; }
  protected OPTIONS():  Restify.RequestHandlerType | null { return null; }



  public registerRoute(restifyServer: Restify.Server): void {
    const endpoints: Endpoint[] = [
      { verb: 'POST', handlers: this.POST() },
      { verb: 'GET', handlers: this.GET() },
      { verb: 'PUT', handlers: this.PUT() },
      { verb: 'PATCH', handlers: this.PATCH() },
      { verb: 'DELETE', handlers: this.DELETE() },
      { verb: 'HEAD', handlers: this.HEAD() },
      { verb: 'OPTIONS', handlers: this.OPTIONS() },
    ].filter(endpoint => endpoint.handlers !== null);
    
    const methodsStr = endpoints.map(e => e.verb).join(', ');
    const corsMiddleware: Restify.RequestHandler = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', methodsStr);
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    };

    endpoints.forEach(endpoint => {
      if (!Route.checkVerb(endpoint.verb)) {
        throw new TypeError(`[Route ${this._path}]: ${endpoint.verb} is not a valid HTTP verb`);
      }
      const mainHandlers = Array.isArray(endpoint.handlers) ? endpoint.handlers : [endpoint.handlers];
      const handlers = [
        corsMiddleware,
        ...mainHandlers
      ];
      this.registerEndpoint(restifyServer, endpoint.verb as HttpVerb, handlers)
    });
  }


  private registerEndpoint(
    restifyServer: Restify.Server,
    verb: HttpVerb,
    middleware: Restify.RequestHandler[]
  ): void {
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
        restifyServer.post(this._path, middleware);
        break;
      case 'GET':
        restifyServer.get(this._path, middleware);
        break;
      case 'OPTIONS':
        restifyServer.opts(this._path, middleware);
        break;
      default:
        console.error(`Route model: HTTP verb ${verb} not handled.`);
    }
  }


  static checkVerb(verb: string) {
    const httpVerbs: string[] = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    return httpVerbs.includes(verb);
  }
}
