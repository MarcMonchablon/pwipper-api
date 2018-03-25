import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { Route, RouteMetadata } from '../../../routing';

import { AuthQueryService } from '../_query/auth.query-service';
import { AccountValidationService } from '../_service/account-validation.service';
import { MiddlewareService } from '../../../routing/_services/middleware.service';


const DEPENDENCIES = ['auth.query-service', 'account-validation.service', 'middleware.service'];

const ROUTE_PATH = 'sign-up';

export class SignUpRoute extends Route {

  constructor(
    private query: AuthQueryService,
    private validator: AccountValidationService,
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
    const mandatoryFields = ['email', 'username', 'password'];

    return [
      this.middlewares.checkBodyFields(mandatoryFields),
      this.POST_mainHandler.bind(this)
    ];
  }


  private POST_mainHandler(req: Restify.Request, res: Restify.Response, next: Restify.Next) {
    const email: string = req.body['email'];
    const username: string = req.body['username'];
    const password: string = req.body['password'];

    const dataValidityState = this.checkData(username, email);
    if (dataValidityState !== 'OK') {
      const error = {
        code: 'INVALID_FIELD',
        detail: dataValidityState,
        message: dataValidityState
      };
      return next(new errs.PreconditionFailedError(error));
    }

    this.query.createAccount(username, email, password)
      .then(queryResponse => {
        if (queryResponse.created) {
          res.send({ account: queryResponse.account });
          next();
        } else {
          const errorCode = this.getErrorCode(queryResponse);
          const httpError = errorCode ?
            new errs.PreconditionFailedError({ code: errorCode, message: errorCode}) : // TODO: better message
            new errs.InternalServerError(queryResponse);
          next(httpError);
        }
      }).catch(e => {
        next(new errs.InternalServerError(e));
      });
  };


  private checkData(username, email) {
    if (!this.validator.checkEmailMinLength(email)) { return 'EMAIL_TOO_SHORT'; }
    if (!this.validator.checkEmailMaxLength(email)) { return 'EMAIL_TOO_LONG'; }
    if (!this.validator.checkEmailCharset(email)) { return 'INVALID_EMAIL_CHARACTERS'; }

    if (!this.validator.checkUsernameMinLength(username)) { return 'USERNAME_TOO_SHORT'; }
    if (!this.validator.checkUsernameMaxLength(username)) { return 'USERNAME_TOO_LONG'; }
    if (!this.validator.checkUsernameCharset(username)) { return 'INVALID_USERNAME_CHARACTERS'; }

    return 'OK'; // no basic error found
  }


  private getErrorCode(queryResponse) {
    switch (queryResponse.errorType) {
      case 'string_data_right_truncation':
        return 'DATA_TOO_BIG';
      case 'unique_violation':
        switch(queryResponse.errorData.constraint) {
          case 'unique_username':
            return 'DUPLICATE_USERNAME';
          case 'unique_email':
            return 'DUPLICATE_EMAIL';
        }
        break;
    }

    // No code for this error ! :/
    return null;
  }
}


export const signUpRoute: RouteMetadata = {
  routePath: ROUTE_PATH,
  constructor: SignUpRoute,
  dependenciesRefs: DEPENDENCIES
};

