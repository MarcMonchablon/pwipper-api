import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { UsersQueryService } from '../_query/users.query-service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';

import { FullUserData } from '../_models/full-user-data.model';


const DEPENDENCIES = [
  UsersQueryService.REF,
  MiddlewareService.REF
];

const ROUTE_PATH = '/users/:userid';

export class UserRoute extends Route {

  constructor(
    private query: UsersQueryService,
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


  public GET_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const userId = req.params['userid'];

    this.query.getUserById(userId)
      .then((user: FullUserData | null) => {
        if (user === null) {
          res.send(new errs.NotFoundError('No user found at this id.'));
          next();
          return;
        }

        res.send({ user: user });
        next();
      })
      .catch(err => {
        res.send(new errs.InternalServerError(err));
        next();
      });
  }
}


export const userRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: UserRoute,
  dependenciesRefs: DEPENDENCIES
};
