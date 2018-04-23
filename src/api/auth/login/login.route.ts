import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { AuthQueryService } from '../_query/auth.query-service';
import { AccountValidationService } from '../_service/account-validation.service';
import { CredentialsService } from '../_service/credentials.service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';


const DEPENDENCIES = [
  AuthQueryService.REF,
  AccountValidationService.REF,
  CredentialsService.REF,
  MiddlewareService.REF
];

const ROUTE_PATH = 'login';

export class LoginRoute extends Route {

  constructor(
    private query: AuthQueryService,
    private validator: AccountValidationService,
    private credentialsService: CredentialsService,
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



  // === POST ==========================================================================

  public POST(): Restify.RequestHandler[] {
    const mandatoryFields = ['email-or-username', 'password'];

    return [
      this.middlewares.checkBodyFields(mandatoryFields),
      this.POST_mainHandler.bind(this)
    ];
  }


  private POST_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const emailOrUsername = req.body['email-or-username'];
    const password = req.body['password'];
    const data$ = this.validator.isEmail(emailOrUsername) ?
      this.query.checkLogin_email(emailOrUsername, password) :
      this.query.checkLogin_username(emailOrUsername, password);

    data$.then((data: any) => {
      if (data.empty || !this.credentialsService.passwordMatch(data.account, data.credentials, password)) {
        res.send(new errs.UnprocessableEntityError({code: 'INVALID_CREDENTIALS', message: 'Invalid credentials'}));
        next();
      } else {
        res.send({
          account: data.account,
          token: data.token
        });
        next();
      }
    }).catch(e => {
      console.error('LoginResponse: Something unexpected happened : ', e);
      next(new errs.InternalServerError(e));
    });
  };
}


export const loginRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: LoginRoute,
  dependenciesRefs: DEPENDENCIES
};
