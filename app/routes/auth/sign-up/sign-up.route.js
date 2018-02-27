const errs = require('restify-errors');
const Route = require('../../_models/route.model');

module.exports = function(authModule) {
  const route = new Route('auth/sign-up');

  const authQueryService = authModule.getService('authQueryService');
  const accountValidationService = authModule.getService('accountValidationService');


  const signUp_POST = function(req, res, next) {
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

    const dataValidityState = checkData(accountValidationService, username, email);
    if (dataValidityState !== 'OK') {
      return next(new errs.PreconditionFailedError(dataValidityState));
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


  route.addEndpoint('POST', signUp_POST);
  return route;
};
