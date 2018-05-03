import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { PweepsQueryService } from '../_query/pweeps.query-service';
import { PweepService } from '../_services/pweep.service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';
import { AuthMiddleware, UserData, USER_DATA_KEY } from '../../auth/_middleware/auth.middleware';

import { Pweep } from '../_models/pweep.model';


const DEPENDENCIES = [
  PweepsQueryService.REF,
  PweepService.REF,
  MiddlewareService.REF,
  AuthMiddleware.REF
];

const ROUTE_PATH = '/users/:userid/pweeps';

export class PweepListRoute extends Route {

  constructor(
    private query: PweepsQueryService,
    private pweepService: PweepService,
    private middlewares: MiddlewareService,
    private authMiddleware: AuthMiddleware
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
      this.authMiddleware.checkAuthorization(false),
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
      this.authMiddleware.checkAuthorization(true),
      this.POST_checkUserData.bind(this),
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


  private POST_checkUserData(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const userData = req[USER_DATA_KEY] as UserData | null;
    if (!userData) {
      next(new errs.InternalServerError(`Invalid user data : ${userData}`));
      return;
    }
    const paramsUserId = req.params['userid'];
    const tokenUserId = userData.account.id;

    if (paramsUserId !== tokenUserId) {
      next(new errs.PreconditionFailedError(`UserId mismatch: is '${paramsUserId}' in params yet '${tokenUserId}' in bearer token.`));
    } else {
      next();
    }
  }


  private POST_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const userData = req[USER_DATA_KEY] as UserData | null;
    const userId = userData.account.id;
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


export const pweepListRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: PweepListRoute,
  dependenciesRefs: DEPENDENCIES
};
