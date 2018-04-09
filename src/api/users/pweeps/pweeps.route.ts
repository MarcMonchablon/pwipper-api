import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing/index';

import { PweepsQueryService } from '../_query/pweeps.query-service';
import { PweepService } from '../_services/pweep.service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';

import { Pweep } from '../_models/pweep.model';


const DEPENDENCIES = [
  PweepsQueryService.REF,
  PweepService.REF,
  MiddlewareService.REF
];

const ROUTE_PATH = 'users/:userid/pweeps';

export class PweepsRoute extends Route {

  constructor(
    private query: PweepsQueryService,
    private pweepService: PweepService,
    private middlewares: MiddlewareService
  ) {
    super(ROUTE_PATH);
  }



  // === OPTIONS =======================================================================

  public OPTIONS(): Restify.RequestHandler {
    return function(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
      res.send();
      next();
    };
  }



  // === GET ==========================================================================

  public GET(): Restify.RequestHandler[] {
    return [
      this.GET_mainHandler.bind(this)
    ];
  }


  private GET_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const userId = req.params['userid'];

    this.query.getPweeps(userId)
      .then((pweeps: Pweep[]) => {
        res.send({ pweeps: pweeps });
        next();
      })
      .catch(err => {
        res.send(new errs.InternalServerError(err));
        next();
      })
  }



  // === POST ==========================================================================

  public POST(): Restify.RequestHandler[] {
    const mandatoryFields = ['content'];

    return [
      this.middlewares.checkBodyFields(mandatoryFields),
      this.POST_checkContentSize.bind(this),
      this.POST_mainHandler.bind(this)
    ];
  }

  private POST_checkContentSize(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const content: string = req.body['content'];
    if (!this.pweepService.checkContentSize(content)) {
      res.send(new errs.PreconditionFailedError('Pweep content is 140 character max.'));
    } else {
      next();
    }
  }

  private POST_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const userId: string = req.params['userid'];
    const content: string = req.body['content'];

    this.query.createPweeps(userId, content)
      .then((pweep: Pweep) => {
        res.send(pweep);
        next();
      })
      .catch((err: any) => {
        res.send(new errs.InternalServerError(err));
        next();
      });
  }

}


export const pweepsRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: PweepsRoute,
  dependenciesRefs: DEPENDENCIES
};
