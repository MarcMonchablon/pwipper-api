import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';
import { AuthMiddleware, USER_DATA_KEY, UserData } from '../_middleware/auth.middleware';


const DEPENDENCIES = [
  AuthMiddleware.REF
];

const ROUTE_PATH = '/check-session';

export class CheckSessionRoute extends Route {

  constructor(
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



  // === POST ==========================================================================

  public POST(): Restify.RequestHandler[] {

    return [
      this.authMiddleware.checkAuthorization(true),
      this.POST_mainHandler.bind(this)
    ];
  }


  private POST_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const userData = req[USER_DATA_KEY] as UserData | null;
    if (!userData) {
      next(new errs.InternalServerError(`Invalid user data : ${userData}`));
      return;
    }

    const payload = {
      account: userData.account,
      token: userData.token
    };
    res.send(payload);
    next();
  }
}


export const checkSessionRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: CheckSessionRoute,
  dependenciesRefs: DEPENDENCIES
};
