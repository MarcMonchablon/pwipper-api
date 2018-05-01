import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { SessionService, LoginData } from '../_service/session.service';
import { AccountValidationService } from '../_service/account-validation.service';
import { CredentialsService } from '../_service/credentials.service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';


const DEPENDENCIES = [
  SessionService.REF,
  AccountValidationService.REF,
  CredentialsService.REF,
  MiddlewareService.REF
];

const ROUTE_PATH = 'login';

export class LoginRoute extends Route {

  constructor(
    private sessionService: SessionService,
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
    const isEmail = this.validator.isEmail(emailOrUsername);
    const data$ = this.sessionService.login(emailOrUsername, password, isEmail);

    data$.then((data: LoginData | null) => {
      if (data === null) {
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
