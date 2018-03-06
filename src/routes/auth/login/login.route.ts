const errs = require('restify-errors');
import { Route } from '../../_models/route.model';


export function LoginFn(authModule) {
  const route = new Route('login');

  const authQueryService = authModule.getService('authQueryService');
  const accountValidationService = authModule.getService('accountValidationService');
  const credentialsService = authModule.getService('credentialsService');


  const login_POST_checkParams = function(req, res, next) {
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

  const login_POST = function(req, res, next) {
    const emailOrUsername = req.body['email-or-username'];
    const password = req.body['password'];
    const data$= accountValidationService.isEmail(emailOrUsername) ?
      authQueryService.checkLogin_email(emailOrUsername, password) :
      authQueryService.checkLogin_username(emailOrUsername, password);

    data$.then(data => {
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



