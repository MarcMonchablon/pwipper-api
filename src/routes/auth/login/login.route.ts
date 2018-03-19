import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../_models/route.model';

import { AuthQueryService } from '../_query/auth.query-service';
import { AccountValidationService } from '../_service/account-validation.service';
import { CredentialsService } from '../_service/credentials.service';


const DEPENDENCIES = ['authQueryService', 'accountValidationService', 'credentialsService'];

const ROUTE_PATH = 'login';
export class LoginRoute extends Route {

  constructor(
    private query: AuthQueryService,
    private validator: AccountValidationService,
    private credentialsService: CredentialsService
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
      this.POST_checkParams.bind(this),
      this.POST_mainHandler.bind(this)
    ];
  }


  private POST_checkParams(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    // Check for missing parameters in body
    let error = null;

    if (!req.body) {
      error = {
        code: 'MISSING_PAYLOAD',
        message: 'Payload is missing'
      };
    } else if (!req.body['email-or-username']) {
      error = {
        code: 'MISSING_FIELD',
        detail: 'email-or-username',
        message: "Payload should contain fields 'email-or-username' and 'password'."
      };
    } else if (!req.body['password']) {
      error = {
        code: 'MISSING_FIELD',
        detail: 'password',
        message: "Payload should contain fields 'email-or-username' and 'password'."
      };
    }

    if (error) {
      return next(new errs.PreconditionFailedError(error));
    } else {
      next();
    }
  };


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
        res.send({account: data.account });
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
