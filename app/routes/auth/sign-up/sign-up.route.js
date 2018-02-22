const errs = require('restify-errors');
const Route = require('../../_models/route.model');

module.exports = function(authModule) {
  const authQueryService = authModule.getService('authQueryService');
  const accountValidationService = authModule.getService('accountValidationService');


  const signUpResponse = function(req, res, next) {
    console.log('sign up !');
    if (!(req.body &&
      req.body['email'] &&
      req.body['username'] &&
      req.body['password'])) {
      return next(new errs.PreconditionFailed("Payload should contain fields 'email', 'username' and 'password"));
    }

    const email = req.body['email'];
    const username = req.body['username'];
    const password = req.body['password'];

    if (!accountValidationService.isValidUsername(username)) {
      return next(new errs.PreconditionFailed("Invalid Username"));
    }

    if (!accountValidationService.isValidEmail(email)) {
      return next(new errs.PreconditionFailed("Invalid email"));
    }

    authQueryService.createAccount(username, email, password)
      .then(queryResponse => {
        if (queryResponse.created) {
          res.send({ account: queryResponse.account });
          next();
        } else {
          const errorCode = getErrorCode(queryResponse);
          const httpError = errorCode ?
            new errs.PreconditionFailedError(errorCode) :
            new errs.InternalServerError(queryResponse);
          next(httpError);
        }
      }).catch(e => {
        next(new errs.InternalServerError(e));
      });
  };

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

  return new Route('POST', 'auth/sign-up', signUpResponse);
};