import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { SessionService, LoginData } from '../_service/session.service';


const DEPENDENCIES = [
  SessionService.REF
];

const ROUTE_PATH = 'check-session';

export class CheckSessionRoute extends Route {

  constructor(
    private sessionService: SessionService
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



  // === POST ==========================================================================

  public POST(): Restify.RequestHandler[] {

    return [
      this.POST_mainHandler.bind(this)
    ];
  }


  private POST_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const bearerToken = req.headers['authorization'];
    if (!bearerToken || typeof bearerToken !== 'string') {
      next(new errs.NotAuthorizedError('No bearer token found'));
      return;
    }

    this.sessionService.checkSession(bearerToken)
      .then((loginData: LoginData | null) => {
        if (loginData === null) {
          next(new errs.NotAuthorizedError('Bearer token not valid.'));
        } else {
          res.send({
            account: loginData.account,
            token: loginData.token
          });
          next();
        }
      }).catch(e => {
        console.error('CheckSession: Something unexpected happened : ', e);
        next(new errs.InternalServerError(e));
      });
  }
}


export const checkSessionRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: CheckSessionRoute,
  dependenciesRefs: DEPENDENCIES
};
