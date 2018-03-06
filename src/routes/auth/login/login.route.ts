import * as Restify from 'restify';
import * as errs from 'restify-errors';

import { RouteModule } from '../../_models/route-module.model';
import { Route } from '../../_models/route.model';
import { AuthQueryService } from '../_query/auth.query-service';
import { AccountValidationService } from '../_service/account-validation.service';
import { CredentialsService } from '../_service/credentials.service';


export function LoginFn(authModule: RouteModule): Route {
  const route = new Route('login');

  const authQueryService: AuthQueryService = authModule.getService('authQueryService');
  const accountValidationService: AccountValidationService = authModule.getService('accountValidationService');
  const credentialsService: CredentialsService = authModule.getService('credentialsService');


  const login_POST_checkParams: Restify.RequestHandler = function(req, res, next) {
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

  const login_POST: Restify.RequestHandler = function(req, res, next) {
    const emailOrUsername = req.body['email-or-username'];
    const password = req.body['password'];
    const data$= accountValidationService.isEmail(emailOrUsername) ?
      authQueryService.checkLogin_email(emailOrUsername, password) :
      authQueryService.checkLogin_username(emailOrUsername, password);

    data$.then((data: any) => {
      if (data.empty || !credentialsService.passwordMatch(data.account, data.credentials, password)) {
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


  const login_OPTIONS = function(req, res, next) {
    res.send();
    next();
  };


  route.addEndpoint('POST', [login_POST_checkParams, login_POST]);
  route.addEndpoint('OPTIONS', [login_OPTIONS]);
  return route;
}



