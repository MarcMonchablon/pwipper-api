const errs = require('restify-errors');
const Route = require('../../_models/route.model');

module.exports = function(authModule) {
  const route = new Route('auth/sign-up');

  const authQueryService = authModule.getService('authQueryService');
  const accountValidationService = authModule.getService('accountValidationService');


  const signUp_POST_checkParams = function(req, res, next) {
    // Check for missing parameters in body
    let error = null;

    if (!req.body) {
      error = {
        code: 'MISSING_PAYLOAD',
        message: 'Payload is missing'
      };
    } else if (!req.body['email']) {
      error = {
        code: 'MISSING_FIELD',
        detail: 'email',
        message: "Payload should contain fields 'email', 'username' and 'password'."
      };
    } else if (!req.body['username']) {
      error = {
        code: 'MISSING_FIELD',
        detail: 'username',
        message: "Payload should contain fields 'email', 'username' and 'password'."
      }
    } else if (!req.body['password']) {
      error = {
        code: 'MISSING_FIELD',
        detail: 'password',
        message: "Payload should contain fields 'email', 'username' and 'password'."
      }
    }

    if (error) {
      return next(new errs.PreconditionFailedError(error));
    } else {
      next();
    }
  };


  const signUp_POST = function(req, res, next) {
    const email = req.body['email'];
    const username = req.body['username'];
    const password = req.body['password'];

    const dataValidityState = checkData(accountValidationService, username, email);
    if (dataValidityState !== 'OK') {
      const error = {
        code: 'INVALID_FIELD',
        detail: dataValidityState,
        message: dataValidityState
      };
      return next(new errs.PreconditionFailedError(error));
    }

    authQueryService.createAccount(username, email, password)
      .then(queryResponse => {
        if (queryResponse.created) {
          res.send({ account: queryResponse.account });
          next();
        } else {
          const errorCode = getErrorCode(queryResponse);
          const httpError = errorCode ?
            new errs.PreconditionFailedError({ code: errorCode, message: errorCode}) : // TODO: better message
            new errs.InternalServerError(queryResponse);
          next(httpError);
        }
      }).catch(e => {
        next(new errs.InternalServerError(e));
      });
  };


  function checkData(validator, username, email) {
    if (!validator.checkEmailMinLength(email)) { return 'EMAIL_TOO_SHORT'; }
    if (!validator.checkEmailMaxLength(email)) { return 'EMAIL_TOO_LONG'; }
    if (!validator.checkEmailCharset(email)) { return 'INVALID_EMAIL_CHARACTERS'; }

    if (!validator.checkUsernameMinLength(username)) { return 'USERNAME_TOO_SHORT'; }
    if (!validator.checkUsernameMaxLength(username)) { return 'USERNAME_TOO_LONG'; }
    if (!validator.checkUsernameCharset(username)) { return 'INVALID_USERNAME_CHARACTERS'; }

    return 'OK'; // no basic error found
  }


  function getErrorCode(queryResponse) {
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


  route.addEndpoint('POST', [signUp_POST_checkParams, signUp_POST]);
  return route;
};
