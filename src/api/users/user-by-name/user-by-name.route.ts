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

const ROUTE_PATH = 'user-by-name/:username';

export class UserByNameRoute extends Route {

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
    const username = req.params['username'];

    this.query.getUserByUsername(username)
      .then((user: FullUserData | null) => {
        if (user === null) {
          res.send(new errs.NotFoundError('No user found with this username.'));
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


export const userByNameRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: UserByNameRoute,
  dependenciesRefs: DEPENDENCIES
};
