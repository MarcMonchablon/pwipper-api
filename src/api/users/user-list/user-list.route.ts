import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { UsersQueryService } from '../_query/users.query-service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';


import { SimpleUserData } from '../_models/simple-user-data.model';


const DEPENDENCIES = [
  UsersQueryService.REF,
  MiddlewareService.REF
];

const ROUTE_PATH = 'users';

export class UserListRoute extends Route {

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
    this.query.getUserList()
      .then((users: SimpleUserData[]) => {
        res.send({ users: users });
        next();
      })
      .catch(err => {
        res.send(new errs.InternalServerError(err));
        next();
    })
  }

}


export const userListRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: UserListRoute,
  dependenciesRefs: DEPENDENCIES
};
